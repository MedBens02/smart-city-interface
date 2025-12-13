"use client"

import { useState } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Camera, Upload, Keyboard, Loader2 } from "lucide-react"
import jsQR from "jsqr"

type ScanMode = "camera" | "upload" | "manual"

interface QRScannerFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export default function QRScannerField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: QRScannerFieldProps) {
  const [mode, setMode] = useState<ScanMode>("manual")
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCameraScan = (result: any) => {
    if (result && result.length > 0) {
      const scannedValue = result[0].rawValue
      onChange(scannedValue)
      setMode("manual") // Switch back to show the scanned value
      setError(null)
    }
  }

  const handleCameraError = (error: Error) => {
    setError(error.message)
    console.error("QR Scan Error:", error)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const imageUrl = await readFileAsDataURL(file)
      const qrCode = await decodeQRFromImage(imageUrl)

      if (qrCode) {
        onChange(qrCode)
        setMode("manual")
        setError(null)
      } else {
        setError("Aucun code QR trouvé dans l'image")
      }
    } catch (err) {
      setError("Erreur lors du traitement de l'image")
      console.error("Image processing error:", err)
    } finally {
      setIsProcessing(false)
      // Reset file input
      e.target.value = ""
    }
  }

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const decodeQRFromImage = (imageUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          resolve(null)
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        resolve(code?.data || null)
      }
      img.onerror = () => resolve(null)
      img.src = imageUrl
    })
  }

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && "*"}
      </Label>

      {/* Mode Selection Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "camera" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("camera")}
        >
          <Camera className="mr-2 h-4 w-4" />
          Caméra
        </Button>
        <Button
          type="button"
          variant={mode === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("upload")}
        >
          <Upload className="mr-2 h-4 w-4" />
          Image
        </Button>
        <Button
          type="button"
          variant={mode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("manual")}
        >
          <Keyboard className="mr-2 h-4 w-4" />
          Manuel
        </Button>
      </div>

      {/* Camera Mode */}
      {mode === "camera" && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Scanner
            onScan={handleCameraScan}
            onError={handleCameraError}
            constraints={{ facingMode: "environment" }} // Use back camera
            styles={{
              container: { width: "100%", maxHeight: "300px" },
            }}
          />
          <p className="p-2 text-xs text-center text-muted-foreground bg-muted/50">
            Pointez la caméra vers le code QR
          </p>
        </div>
      )}

      {/* Upload Mode */}
      {mode === "upload" && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <QrCode className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyse de l'image...</p>
            </div>
          ) : (
            <>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="mt-2"
                disabled={isProcessing}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Sélectionnez une photo contenant un code QR
              </p>
            </>
          )}
        </div>
      )}

      {/* Manual Mode - Always show scanned value here too */}
      {mode === "manual" && (
        <Input
          type="text"
          placeholder={placeholder || "Entrez le code manuellement"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {/* Current Value Display */}
      {value && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-sm font-medium text-foreground">Code scanné:</p>
          <p className="mt-1 text-sm text-muted-foreground font-mono break-all">
            {value}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
