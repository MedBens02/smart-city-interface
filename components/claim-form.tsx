"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useAuth as useClerkAuth } from "@clerk/nextjs"
import { useClaims } from "@/contexts/claims-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Upload, X, MapPin, CheckCircle2, Loader2 } from "lucide-react"
import { serviceConfigs, type ServiceField } from "@/lib/service-fields"
import { getServiceCodeById } from "@/lib/service-code-mapper"
import LocationPicker from "./location-picker"
import QRScannerField from "./qr-scanner-field"
import { uploadMultipleFiles, type UploadedFile } from "@/lib/upload-helpers"
import { createClaim } from "@/lib/api/claims"

interface ClaimFormProps {
  onBack: () => void
}

interface CommonFormData {
  serviceType: string
  title: string
  description: string
  location: string
  latitude: number | null
  longitude: number | null
  priority: "low" | "medium" | "high" | "urgent"
  images: File[]
}

export default function ClaimForm({ onBack }: ClaimFormProps) {
  const { user } = useAuth()
  const { getToken } = useClerkAuth()
  const { addClaim } = useClaims()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedClaimId, setSubmittedClaimId] = useState<string | null>(null)

  const [commonData, setCommonData] = useState<CommonFormData>({
    serviceType: "",
    title: "",
    description: "",
    location: "",
    latitude: null,
    longitude: null,
    priority: "medium",
    images: [],
  })

  const [extraData, setExtraData] = useState<Record<string, string>>({})

  const selectedService = serviceConfigs.find((s) => s.id === commonData.serviceType)
  const hasExtraFields = selectedService && selectedService.extraFields.length > 0

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setCommonData((prev) => ({
      ...prev,
      images: [...prev.images, ...files].slice(0, 5),
    }))
  }, [])

  const removeImage = useCallback((index: number) => {
    setCommonData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }, [])

  const handleExtraFieldChange = useCallback((fieldName: string, value: string) => {
    setExtraData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }, [])

  const canProceedToStep2 = commonData.serviceType && commonData.title && commonData.description

  const canSubmit = () => {
    if (!selectedService) return false

    // Check each field
    return selectedService.extraFields.every((field) => {
      // Check if field should be displayed
      if (field.conditionalDisplay) {
        const { dependsOn, showWhen } = field.conditionalDisplay
        const dependentValue = extraData[dependsOn]
        const shouldShow = Array.isArray(showWhen)
          ? showWhen.includes(dependentValue)
          : dependentValue === showWhen

        // If field is not shown, skip validation
        if (!shouldShow) return true
      }

      // If field is required, check it has a value
      if (field.required && !extraData[field.name]) {
        return false
      }

      // If field has validation regex and a value, validate it
      if (field.validationRegex && extraData[field.name]) {
        const regex = new RegExp(field.validationRegex)
        if (!regex.test(extraData[field.name])) {
          return false
        }
      }

      return true
    })
  }

  const buildClaimPayload = (uploadedFiles: UploadedFile[] = []) => {
    return {
      user: {
        id: user?.id || "",
        email: user?.email || "",
        name: user?.name || "",
        phone: user?.phone || null,
      },
      claim: {
        serviceType: getServiceCodeById(commonData.serviceType),
        title: commonData.title,
        description: commonData.description,
        priority: commonData.priority,
        location: {
          address: commonData.location || "",
          latitude: commonData.latitude,
          longitude: commonData.longitude,
        },
        attachments:
          uploadedFiles.length > 0
            ? uploadedFiles
            : commonData.images.map((file) => ({
                url: URL.createObjectURL(file), // Fallback to blob if upload fails
                fileName: file.name,
                fileType: file.type,
              })),
        extraData: extraData, // All second page fields
      },
    }
  }

  const saveJsonToFile = (payload: any) => {
    const jsonString = JSON.stringify(payload, null, 2)
    const blob = new Blob([jsonString], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `claim-${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const submitClaimToAPI = async (payload: any) => {
    try {
      console.log("=== CLAIM SUBMISSION DATA ===")
      console.log(JSON.stringify(payload, null, 2))
      console.log("=============================")

      const token = await getToken()
      if (!token) {
        console.error("No authentication token available")
        throw new Error("Not authenticated")
      }

      const response = await createClaim(payload, token)
      return response
    } catch (error) {
      console.error("Failed to submit claim to API:", error)
      throw error
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setIsUploading(true)

    try {
      // Upload files to R2 first
      let uploadedFiles: UploadedFile[] = []
      if (commonData.images.length > 0) {
        try {
          uploadedFiles = await uploadMultipleFiles(commonData.images)
          console.log("Files uploaded to R2:", uploadedFiles)
        } catch (uploadError) {
          console.error("R2 upload failed, using blob URLs as fallback:", uploadError)
          // Continue with blob URLs if R2 upload fails
        }
      }

      setIsUploading(false)

      // Build payload with R2 URLs
      const payload = buildClaimPayload(uploadedFiles)

      // Submit to API
      const apiResponse = await submitClaimToAPI(payload)

      if (apiResponse) {
        setSubmittedClaimId(apiResponse.claimId)
        setIsSubmitted(true)
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      alert("Failed to submit claim. Please try again.")
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  if (isSubmitted) {
    return (
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <Card className="border-border/40 text-center shadow-lg">
          <CardContent className="pt-12 pb-8">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Claim Submitted!</h2>
            <p className="mb-6 text-muted-foreground">
              Your claim has been received and is being reviewed. Track its progress from your claims page.
            </p>
            <p className="mb-8 text-sm text-muted-foreground">
              Reference Number: <span className="font-mono font-semibold text-foreground">{submittedClaimId}</span>
            </p>
            <Button onClick={onBack}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <Button variant="ghost" onClick={onBack} className="mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      {/* Progress Indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                step >= 1
                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </div>
            <div>
              <p className={step >= 1 ? "font-semibold text-foreground" : "text-muted-foreground"}>Claim Details</p>
              <p className="text-xs text-muted-foreground">Basic information</p>
            </div>
          </div>
          <div className={`mx-4 h-1 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-border"}`} />
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                step >= 2
                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <div>
              <p className={step >= 2 ? "font-semibold text-foreground" : "text-muted-foreground"}>Additional Info</p>
              <p className="text-xs text-muted-foreground">Service-specific</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card className="border-border/40 shadow-lg">
          <CardHeader className="border-b border-border/40 pb-6">
            <CardTitle className="text-2xl">Submit a Claim</CardTitle>
            <CardDescription>
              Tell us what issue you'd like to report. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="serviceType" className="text-sm font-semibold">
                Service Type *
              </Label>
              <Select
                value={commonData.serviceType}
                onValueChange={(value) => {
                  setCommonData((prev) => ({ ...prev, serviceType: value }))
                  setExtraData({})
                }}
              >
                <SelectTrigger id="serviceType" className="h-10">
                  <SelectValue placeholder="Select a service..." />
                </SelectTrigger>
                <SelectContent>
                  {serviceConfigs.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="title" className="text-sm font-semibold">
                Claim Title *
              </Label>
              <Input
                id="title"
                placeholder="Brief summary of your issue"
                value={commonData.title}
                onChange={(e) => setCommonData((prev) => ({ ...prev, title: e.target.value }))}
                className="h-10"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="description" className="text-sm font-semibold">
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about your issue..."
                rows={5}
                value={commonData.description}
                onChange={(e) => setCommonData((prev) => ({ ...prev, description: e.target.value }))}
                className="resize-none"
              />
            </div>

            <LocationPicker
              value={{
                address: commonData.location,
                latitude: commonData.latitude,
                longitude: commonData.longitude,
              }}
              onChange={(location) =>
                setCommonData((prev) => ({
                  ...prev,
                  location: location.address,
                  latitude: location.latitude,
                  longitude: location.longitude,
                }))
              }
            />

            <div className="space-y-2.5">
              <Label htmlFor="priority" className="text-sm font-semibold">
                Priorité *
              </Label>
              <Select
                value={commonData.priority}
                onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                  setCommonData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger id="priority" className="h-10">
                  <SelectValue placeholder="Sélectionner la priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Attach Images (Optional)
              </Label>
              <div className="rounded-xl border-2 border-dashed border-border/40 p-6 hover:border-primary/40 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="flex cursor-pointer flex-col items-center gap-2 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Click to upload or drag and drop</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG up to 5 images</span>
                </label>
              </div>

              {commonData.images.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {commonData.images.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
                        <img
                          src={URL.createObjectURL(file) || "/placeholder.svg"}
                          alt={`Upload ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)} disabled={!canProceedToStep2} size="lg">
                {hasExtraFields ? (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  "Review & Submit"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && selectedService && (
        <Card className="border-border/40 shadow-lg">
          <CardHeader className="border-b border-border/40 pb-6">
            <CardTitle className="text-2xl">{selectedService.name} - Additional Information</CardTitle>
            <CardDescription>
              Please provide the following details specific to {selectedService.name.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {selectedService.extraFields.map((field) => {
              // Check if field should be displayed based on conditional logic
              if (field.conditionalDisplay) {
                const { dependsOn, showWhen } = field.conditionalDisplay
                const dependentValue = extraData[dependsOn]
                const shouldShow = Array.isArray(showWhen)
                  ? showWhen.includes(dependentValue)
                  : dependentValue === showWhen
                if (!shouldShow) return null
              }

              return (
                <DynamicField
                  key={field.name}
                  field={field}
                  value={extraData[field.name] || ""}
                  onChange={(value) => handleExtraFieldChange(field.name, value)}
                />
              )
            })}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)} size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit() || isSubmitting} size="lg">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading files...
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit Claim
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

interface DynamicFieldProps {
  field: ServiceField
  value: string
  onChange: (value: string) => void
}

function DynamicField({ field, value, onChange }: DynamicFieldProps) {
  const [validationError, setValidationError] = useState<string>("")

  const validateInput = (inputValue: string) => {
    if (field.validationRegex && inputValue) {
      const regex = new RegExp(field.validationRegex)
      if (!regex.test(inputValue)) {
        setValidationError(`Format invalide pour ${field.label.toLowerCase()}`)
        return false
      }
    }
    setValidationError("")
    return true
  }

  const handleChange = (newValue: string) => {
    onChange(newValue)
    if (validationError) {
      validateInput(newValue)
    }
  }

  const handleBlur = () => {
    validateInput(value)
  }

  const label = (
    <Label htmlFor={field.name} className="text-sm font-semibold">
      {field.label} {field.required && "*"}
    </Label>
  )

  switch (field.type) {
    case "select":
      return (
        <div className="space-y-2.5">
          {label}
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger id={field.name} className="h-10">
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )

    case "textarea":
      return (
        <div className="space-y-2.5">
          {label}
          <Textarea
            id={field.name}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
          />
        </div>
      )

    case "date":
      return (
        <div className="space-y-2.5">
          {label}
          <Input id={field.name} type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-10" />
        </div>
      )

    case "number":
      return (
        <div className="space-y-2.5">
          {label}
          <Input
            id={field.name}
            type="number"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={validationError ? "h-10 border-red-500" : "h-10"}
          />
          {validationError && <p className="text-sm text-red-500">{validationError}</p>}
        </div>
      )

    case "qr-scanner":
      return (
        <QRScannerField
          label={field.label + (field.required ? " *" : "")}
          value={value}
          onChange={handleChange}
          placeholder={field.placeholder}
          required={field.required}
        />
      )

    default:
      return (
        <div className="space-y-2.5">
          {label}
          <Input
            id={field.name}
            type="text"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={validationError ? "h-10 border-red-500" : "h-10"}
          />
          {validationError && <p className="text-sm text-red-500">{validationError}</p>}
          {field.placeholder && field.validationRegex && (
            <p className="text-xs text-muted-foreground">Format attendu: {field.placeholder}</p>
          )}
        </div>
      )
  }
}
