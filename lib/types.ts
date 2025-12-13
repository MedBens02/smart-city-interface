// Types for claims, messages, and notifications

export type ClaimStatus = "pending" | "in_progress" | "resolved" | "closed" | "rejected"

export interface ClaimMessage {
  id: string
  claimId: string
  senderId: string
  senderName: string
  senderType: "citizen" | "service"
  content: string
  timestamp: string
}

export interface Claim {
  id: string
  userId: string
  serviceType: string
  serviceName: string
  title: string
  description: string
  location: string | null
  images: string[]
  extraData: Record<string, string>
  status: ClaimStatus
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
