"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useAuth as useClerkAuth } from "@clerk/nextjs"
import type { Claim, ClaimMessage, Notification } from "@/lib/types"
import {
  fetchClaims,
  fetchClaimById,
  sendMessage as apiSendMessage,
  type SendMessagePayload,
} from "@/lib/api/claims"
import {
  fetchNotifications,
  markNotificationRead as apiMarkNotificationRead,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
} from "@/lib/api/notifications"

interface ClaimsContextType {
  claims: Claim[]
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  refreshClaims: () => Promise<void>
  getClaim: (id: string) => Claim | undefined
  sendMessage: (claimId: string, content: string, attachments?: any[]) => Promise<void>
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
}

const ClaimsContext = createContext<ClaimsContextType | undefined>(undefined)

const POLLING_INTERVAL = 30000 // 30 seconds

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const { getToken } = useClerkAuth()
  const [claims, setClaims] = useState<Claim[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Fetch claims from backend
  const refreshClaims = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) {
        console.warn("No auth token available")
        setIsLoading(false)
        return
      }

      const [claimsData, notificationsData] = await Promise.all([
        fetchClaims(token),
        fetchNotifications(token),
      ])

      setClaims(claimsData)
      setNotifications(notificationsData)
      setError(null)
    } catch (err) {
      console.error("Failed to fetch claims:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch claims")
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  // Initial fetch
  useEffect(() => {
    refreshClaims()
  }, [refreshClaims])

  // Polling mechanism (TODO: Replace with WebSocket later)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshClaims()
    }, POLLING_INTERVAL)

    return () => clearInterval(interval)
  }, [refreshClaims])

  // WebSocket setup (COMMENTED OUT FOR LATER)
  /*
  useEffect(() => {
    const connectWebSocket = async () => {
      const token = await getToken()
      if (!token) return

      const ws = new WebSocket(`ws://localhost:8080/api/ws?token=${token}`)

      ws.onopen = () => {
        console.log("WebSocket connected")
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.messageType === "CLAIM_MESSAGE") {
          // Update claim with new message
          setClaims(prev => prev.map(claim =>
            claim.id === data.claimId
              ? {
                  ...claim,
                  messages: [...claim.messages, {
                    id: data.messageId,
                    claimId: data.claimId,
                    senderId: data.user.id,
                    senderName: data.user.name,
                    senderType: "service",
                    content: data.message,
                    timestamp: data.timestamp,
                    attachments: data.attachments
                  }],
                  updatedAt: data.timestamp
                }
              : claim
          ))
        } else if (data.messageType === "STATUS_UPDATE") {
          // Update claim status
          setClaims(prev => prev.map(claim =>
            claim.id === data.claimId
              ? {
                  ...claim,
                  status: data.status.new,
                  assignedTo: data.status.assignedTo,
                  resolution: data.resolution,
                  updatedAt: data.timestamp
                }
              : claim
          ))
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
      }

      ws.onclose = () => {
        console.log("WebSocket disconnected")
        // Implement reconnection logic here
      }

      return () => ws.close()
    }

    connectWebSocket()
  }, [getToken])
  */

  const getClaim = useCallback(
    (id: string) => {
      return claims.find((c) => c.id === id)
    },
    [claims]
  )

  const sendMessage = useCallback(
    async (claimId: string, content: string, attachments: any[] = []) => {
      try {
        const token = await getToken()
        if (!token) throw new Error("Not authenticated")

        const payload: SendMessagePayload = {
          claimId,
          message: content,
          attachments: attachments.map((a) => ({
            url: a.url,
            fileName: a.fileName,
            fileType: a.fileType,
          })),
        }

        await apiSendMessage(claimId, payload, token)

        // Refresh claims to get the new message
        await refreshClaims()
      } catch (err) {
        console.error("Failed to send message:", err)
        throw err
      }
    },
    [getToken, refreshClaims]
  )

  const markNotificationRead = useCallback(
    async (id: string) => {
      try {
        const token = await getToken()
        if (!token) return

        // Optimistic update
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

        await apiMarkNotificationRead(id, token)
      } catch (err) {
        console.error("Failed to mark notification as read:", err)
        // Revert on error
        await refreshClaims()
      }
    },
    [getToken, refreshClaims]
  )

  const markAllNotificationsRead = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return

      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

      await apiMarkAllNotificationsRead(token)
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err)
      // Revert on error
      await refreshClaims()
    }
  }, [getToken, refreshClaims])

  return (
    <ClaimsContext.Provider
      value={{
        claims,
        notifications,
        unreadCount,
        isLoading,
        error,
        refreshClaims,
        getClaim,
        sendMessage,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </ClaimsContext.Provider>
  )
}

export function useClaims() {
  const context = useContext(ClaimsContext)
  if (context === undefined) {
    throw new Error("useClaims must be used within a ClaimsProvider")
  }
  return context
}
