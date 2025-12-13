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
import LocationPicker from "./location-picker"
import QRScannerField from "./qr-scanner-field"
import { uploadMultipleFiles, type UploadedFile } from "@/lib/upload-helpers"

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
        serviceType: commonData.serviceType,
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

      const response = await fetch("http://localhost:8080/api/claim/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to submit claim to API:", error)
      // Don't throw - allow local storage to work even if API fails
      return null
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

      // Save to file for testing
      saveJsonToFile(payload)

      // Try to send to API (don't fail if API is down)
      const apiResponse = await submitClaimToAPI(payload)

      // Always add to local state for UI purposes
      const newClaim = addClaim({
        userId: user?.id || "",
        serviceType: commonData.serviceType,
        serviceName: selectedService?.name || "",
        title: commonData.title,
        description: commonData.description,
        location: commonData.location || null,
        images: [],
        extraData: extraData,
      })

      setSubmittedClaimId(apiResponse?.claimId || newClaim.id)
      setIsSubmitted(true)
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
      <main className="mx-auto max-w-2xl px-4 py-12">
        <Card className="text-center">
          <CardContent className="pt-12 pb-8">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Claim Submitted Successfully</h2>
            <p className="mb-6 text-muted-foreground">
              Your claim has been received. You can track its status and communicate with the service team from your
              claims page.
            </p>
            <p className="mb-8 text-sm text-muted-foreground">
              Reference Number: <span className="font-mono font-medium text-foreground">{submittedClaimId}</span>
            </p>
            <Button onClick={onBack}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </div>
            <span className={step >= 1 ? "font-medium text-foreground" : "text-muted-foreground"}>Claim Details</span>
          </div>
          <div className="mx-4 h-px flex-1 bg-border" />
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <span className={step >= 2 ? "font-medium text-foreground" : "text-muted-foreground"}>Additional Info</span>
          </div>
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Submit a Claim</CardTitle>
            <CardDescription>Provide the details of your issue. Fields marked with * are required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type *</Label>
              <Select
                value={commonData.serviceType}
                onValueChange={(value) => {
                  setCommonData((prev) => ({ ...prev, serviceType: value }))
                  setExtraData({})
                }}
              >
                <SelectTrigger id="serviceType">
                  <SelectValue placeholder="Select a service" />
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

            <div className="space-y-2">
              <Label htmlFor="title">Claim Title *</Label>
              <Input
                id="title"
                placeholder="Brief summary of your issue"
                value={commonData.title}
                onChange={(e) => setCommonData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about your issue..."
                rows={4}
                value={commonData.description}
                onChange={(e) => setCommonData((prev) => ({ ...prev, description: e.target.value }))}
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

            <div className="space-y-2">
              <Label htmlFor="priority">Priorité *</Label>
              <Select
                value={commonData.priority}
                onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                  setCommonData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger id="priority">
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

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Attach Images (Optional)
              </Label>
              <div className="rounded-lg border border-dashed border-border p-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex cursor-pointer flex-col items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Upload className="h-8 w-8" />
                  <span>Click to upload images (max 5)</span>
                </label>
              </div>

              {commonData.images.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {commonData.images.map((file, index) => (
                    <div key={index} className="relative">
                      <div className="h-16 w-16 overflow-hidden rounded-lg border border-border bg-muted">
                        <img
                          src={URL.createObjectURL(file) || "/placeholder.svg"}
                          alt={`Upload ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)} disabled={!canProceedToStep2}>
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
        <Card>
          <CardHeader>
            <CardTitle>{selectedService.name} - Additional Information</CardTitle>
            <CardDescription>
              Please provide the following details specific to {selectedService.name.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit() || isSubmitting}>
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
    <Label htmlFor={field.name}>
      {field.label} {field.required && "*"}
    </Label>
  )

  switch (field.type) {
    case "select":
      return (
        <div className="space-y-2">
          {label}
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger id={field.name}>
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
        <div className="space-y-2">
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
        <div className="space-y-2">
          {label}
          <Input id={field.name} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
      )

    case "number":
      return (
        <div className="space-y-2">
          {label}
          <Input
            id={field.name}
            type="number"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={validationError ? "border-red-500" : ""}
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
        <div className="space-y-2">
          {label}
          <Input
            id={field.name}
            type="text"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={validationError ? "border-red-500" : ""}
          />
          {validationError && <p className="text-sm text-red-500">{validationError}</p>}
          {field.placeholder && field.validationRegex && (
            <p className="text-xs text-muted-foreground">Format attendu: {field.placeholder}</p>
          )}
        </div>
      )
  }
}
