import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

/**
 * Sanitizes a filename to make it URL-safe
 * - Replaces spaces with hyphens
 * - Removes special characters except hyphens, underscores, and dots
 * - Converts to lowercase
 */
function sanitizeFileName(fileName: string): string {
  // Get file extension
  const lastDotIndex = fileName.lastIndexOf(".")
  const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : ""

  // Sanitize the name part
  const sanitized = name
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9\-_]/g, "") // Remove special characters except hyphens and underscores
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens

  return sanitized + extension.toLowerCase()
}

export async function uploadToR2(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const sanitizedFileName = sanitizeFileName(fileName)
  const key = `claims/${Date.now()}-${sanitizedFileName}`

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await r2Client.send(command)

  // Return public URL with properly encoded path
  const encodedKey = key.split('/').map(encodeURIComponent).join('/')
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${encodedKey}`
  return publicUrl
}
