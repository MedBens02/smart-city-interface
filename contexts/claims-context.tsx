"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { Claim, ClaimMessage, Notification } from "@/lib/types"

interface ClaimsContextType {
  claims: Claim[]
  notifications: Notification[]
  unreadCount: number
  addClaim: (claim: Omit<Claim, "id" | "createdAt" | "updatedAt" | "messages" | "status">) => Claim
  getClaim: (id: string) => Claim | undefined
  addMessage: (claimId: string, content: string, senderType: "citizen" | "service") => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
}

const ClaimsContext = createContext<ClaimsContextType | undefined>(undefined)

// Mock initial claims data
const mockClaims: Claim[] = [
  {
    id: "CLM-001",
    userId: "citizen-001",
    serviceType: "eau-potable",
    serviceName: "Gestion de l'Eau Potable",
    title: "Fuite d'eau rue principale",
    description: "Il y a une fuite d'eau au coin de la rue principale et l'avenue Oak depuis 3 jours.",
    location: "Rue Principale & Avenue Oak",
    images: [],
    extraData: { accountNumber: "WAT-123456", issueType: "leak" },
    status: "in_progress",
    createdAt: "2025-06-08T10:30:00Z",
    updatedAt: "2025-06-10T14:20:00Z",
    messages: [
      {
        id: "msg-001",
        claimId: "CLM-001",
        senderId: "citizen-001",
        senderName: "Bensaddik Mohamed",
        senderType: "citizen",
        content: "La fuite semble s'aggraver aujourd'hui.",
        timestamp: "2025-06-09T08:00:00Z",
      },
      {
        id: "msg-002",
        claimId: "CLM-001",
        senderId: "service-water",
        senderName: "Équipe Eau Potable",
        senderType: "service",
        content:
          "Merci pour votre signalement. Nous avons envoyé une équipe pour évaluer la situation. Elle devrait arriver dans les 24 heures.",
        timestamp: "2025-06-09T09:30:00Z",
      },
      {
        id: "msg-003",
        claimId: "CLM-001",
        senderId: "service-water",
        senderName: "Équipe Eau Potable",
        senderType: "service",
        content:
          "Notre équipe est sur place et travaille à réparer la fuite. Nous prévoyons terminer les réparations d'ici la fin de la journée.",
        timestamp: "2025-06-10T14:20:00Z",
      },
    ],
  },
  {
    id: "CLM-002",
    userId: "citizen-001",
    serviceType: "electricite",
    serviceName: "Électricité",
    title: "Panne de courant zone résidentielle",
    description: "Tout le bloc est sans électricité depuis hier soir vers 20h.",
    location: "Bloc 12, Zone Résidentielle B",
    images: [],
    extraData: { accountNumber: "ELC-789012", issueType: "outage", outageDate: "2025-06-09" },
    status: "resolved",
    createdAt: "2025-06-09T20:15:00Z",
    updatedAt: "2025-06-10T06:00:00Z",
    messages: [
      {
        id: "msg-004",
        claimId: "CLM-002",
        senderId: "service-electricity",
        senderName: "Service Électricité",
        senderType: "service",
        content: "Nous avons identifié le problème - une panne de transformateur. Notre équipe d'urgence y travaille.",
        timestamp: "2025-06-09T21:00:00Z",
      },
      {
        id: "msg-005",
        claimId: "CLM-002",
        senderId: "service-electricity",
        senderName: "Service Électricité",
        senderType: "service",
        content: "L'électricité a été rétablie dans votre zone. N'hésitez pas à nous contacter si vous rencontrez d'autres problèmes.",
        timestamp: "2025-06-10T06:00:00Z",
      },
    ],
  },
  {
    id: "CLM-003",
    userId: "citizen-001",
    serviceType: "tri-dechets",
    serviceName: "Tri des Déchets",
    title: "Collecte des ordures manquée",
    description: "Nos ordures n'ont pas été collectées depuis 2 semaines malgré notre itinéraire de collecte régulier.",
    location: "45 Avenue du Cèdre",
    images: [],
    extraData: { wasteType: "household", missedCollection: "2025-06-03" },
    status: "pending",
    createdAt: "2025-06-10T11:00:00Z",
    updatedAt: "2025-06-10T11:00:00Z",
    messages: [],
  },
]

const mockNotifications: Notification[] = [
  {
    id: "notif-001",
    userId: "citizen-001",
    claimId: "CLM-001",
    type: "new_message",
    title: "Nouvelle Réponse",
    message: "L'équipe Eau Potable a répondu à votre réclamation concernant la fuite d'eau",
    read: false,
    createdAt: "2025-06-10T14:20:00Z",
  },
  {
    id: "notif-002",
    userId: "citizen-001",
    claimId: "CLM-002",
    type: "status_change",
    title: "Réclamation Résolue",
    message: "Votre réclamation de panne de courant a été marquée comme résolue",
    read: false,
    createdAt: "2025-06-10T06:00:00Z",
  },
]

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<Claim[]>(mockClaims)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const addClaim = useCallback((claimData: Omit<Claim, "id" | "createdAt" | "updatedAt" | "messages" | "status">) => {
    const now = new Date().toISOString()
    const newClaim: Claim = {
      ...claimData,
      id: `CLM-${Date.now()}`,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      messages: [],
    }
    setClaims((prev) => [newClaim, ...prev])
    return newClaim
  }, [])

  const getClaim = useCallback(
    (id: string) => {
      return claims.find((c) => c.id === id)
    },
    [claims],
  )

  const addMessage = useCallback((claimId: string, content: string, senderType: "citizen" | "service") => {
    const newMessage: ClaimMessage = {
      id: `msg-${Date.now()}`,
      claimId,
      senderId: senderType === "citizen" ? "citizen-001" : `service-${claimId}`,
      senderName: senderType === "citizen" ? "Bensaddik Mohamed" : "Service Team",
      senderType,
      content,
      timestamp: new Date().toISOString(),
    }

    setClaims((prev) =>
      prev.map((claim) =>
        claim.id === claimId
          ? { ...claim, messages: [...claim.messages, newMessage], updatedAt: new Date().toISOString() }
          : claim,
      ),
    )

    // If it's a service message, create a notification
    if (senderType === "service") {
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        userId: "citizen-001",
        claimId,
        type: "new_message",
        title: "New Response",
        message: `Service team responded to your claim`,
        read: false,
        createdAt: new Date().toISOString(),
      }
      setNotifications((prev) => [notification, ...prev])
    }
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  return (
    <ClaimsContext.Provider
      value={{
        claims,
        notifications,
        unreadCount,
        addClaim,
        getClaim,
        addMessage,
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
