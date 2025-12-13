export interface UploadedFile {
  url: string
  fileName: string
  fileType: string
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Upload failed")
  }

  return await response.json()
}

export async function uploadMultipleFiles(
  files: File[]
): Promise<UploadedFile[]> {
  const uploadPromises = files.map((file) => uploadFile(file))
  return await Promise.all(uploadPromises)
}
