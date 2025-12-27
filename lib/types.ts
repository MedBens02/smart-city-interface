// Types for claims, messages, and notifications

export type ClaimStatus = "submitted" | "received" | "assigned" | "in_progress" | "pending_info" | "resolved" | "rejected"

export interface ClaimMessage {
  id: string
  claimId: string
  senderId: string
  senderName: string
  senderType: "user" | "service"
  content: string
  timestamp: string
  attachments?: Array<{
    url: string
    fileName: string
    fileType: string
  }>
}

export interface Claim {
  id: string
  claimNumber?: string
  userId: string
  serviceType: string
  serviceName: string
  title: string
  description: string
  location: string | null
  latitude?: number | null
  longitude?: number | null
  priority?: "low" | "medium" | "high" | "urgent"
  images: string[]
  extraData: Record<string, any>
  status: ClaimStatus
  assignedTo?: {
    operatorId: string
    operatorName: string
  }
  resolution?: {
    summary: string
    actionsTaken: string[]
    closingMessage: string
  }
  createdAt: string
  updatedAt: string
  messages: ClaimMessage[]
}

export interface Notification {
  id: string
  userId: string
  claimId: string
  type: "status_change" | "new_message"
  title: string
  message: string
  read: boolean
  createdAt: string
}
