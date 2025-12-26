import { apiRequest } from "./client"
import type { Claim } from "@/lib/types"

export interface CreateClaimPayload {
  user: {
    id: string
    email: string
    name: string
    phone: string | null
  }
  claim: {
    serviceType: string
    title: string
    description: string
    priority: "low" | "medium" | "high" | "urgent"
    location: {
      address: string
      latitude: number | null
      longitude: number | null
    }
    attachments: Array<{
      url: string
      fileName: string
      fileType: string
    }>
    extraData: Record<string, any>
  }
}

export interface CreateClaimResponse {
  claimId: string
  claimNumber: string
  message: string
}

export interface SendMessagePayload {
  claimId: string
  message: string
  attachments: Array<{
    url: string
    fileName: string
    fileType: string
  }>
}

export interface SendMessageResponse {
  messageId: string
  timestamp: string
}

// Fetch all claims for the current user
export async function fetchClaims(token: string): Promise<Claim[]> {
  return apiRequest<Claim[]>("/api/claims", { method: "GET" }, token)
}

// Fetch single claim with all messages
export async function fetchClaimById(claimId: string, token: string): Promise<Claim> {
  return apiRequest<Claim>(`/api/claims/${claimId}`, { method: "GET" }, token)
}

// Create new claim
export async function createClaim(
  payload: CreateClaimPayload,
  token: string
): Promise<CreateClaimResponse> {
  return apiRequest<CreateClaimResponse>(
    "/api/claims",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

// Send message to claim
export async function sendMessage(
  claimId: string,
  payload: SendMessagePayload,
  token: string
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(
    `/api/claims/${claimId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

// Simulate service response (for testing without Kafka)
export async function simulateServiceResponse(
  claimId: string,
  data: {
    serviceType: string
    operatorId: string
    operatorName: string
    message: string
    serviceReference?: string
  },
  token: string
): Promise<{ messageId: string; timestamp: string }> {
  return apiRequest<{ messageId: string; timestamp: string }>(
    `/api/claims/${claimId}/service-response`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  )
}

// Simulate status update (for testing without Kafka)
export async function simulateStatusUpdate(
  claimId: string,
  data: {
    previousStatus: string
    newStatus: string
    reason: string
    operatorId?: string
    operatorName?: string
  },
  token: string
): Promise<{ messageId: string; timestamp: string; newStatus: string }> {
  return apiRequest<{ messageId: string; timestamp: string; newStatus: string }>(
    `/api/claims/${claimId}/status-update`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  )
}
