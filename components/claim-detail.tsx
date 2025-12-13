"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useClaims } from "@/contexts/claims-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Send,
  MapPin,
  Calendar,
  User,
  Building2,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import type { ClaimStatus } from "@/lib/types"

interface ClaimDetailProps {
  claimId: string
  onBack: () => void
}

const statusConfig: Record<
  ClaimStatus,
  {
    label: string
    icon: React.ElementType
    variant: "default" | "secondary" | "destructive" | "outline"
    color: string
  }
> = {
  pending: { label: "Pending Review", icon: Clock, variant: "secondary", color: "text-amber-600" },
  in_progress: { label: "In Progress", icon: Loader2, variant: "default", color: "text-blue-600" },
  resolved: { label: "Resolved", icon: CheckCircle2, variant: "outline", color: "text-green-600" },
  closed: { label: "Closed", icon: XCircle, variant: "secondary", color: "text-muted-foreground" },
  rejected: { label: "Rejected", icon: AlertCircle, variant: "destructive", color: "text-destructive" },
}

export default function ClaimDetail({ claimId, onBack }: ClaimDetailProps) {
  const { user } = useAuth()
  const { getClaim, addMessage } = useClaims()
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const claim = getClaim(claimId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [claim?.messages])

  if (!claim) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Claims
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Claim not found</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const status = statusConfig[claim.status]
  const StatusIcon = status.icon

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setIsSending(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    addMessage(claimId, newMessage.trim(), "citizen")
    setNewMessage("")
    setIsSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Claims
        </Button>

        {/* Claim Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{claim.id}</span>
                  <Badge variant={status.variant} className="flex items-center gap-1">
                    <StatusIcon className={`h-3 w-3 ${claim.status === "in_progress" ? "animate-spin" : ""}`} />
                    {status.label}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{claim.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{claim.serviceName}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-foreground">{claim.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(claim.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
              {claim.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {claim.location}
                </span>
              )}
            </div>

            {/* Extra Data */}
            {Object.keys(claim.extraData).length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">Additional Details</h4>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    {Object.entries(claim.extraData).map(([key, value]) => (
                      <div key={key} className="flex justify-between rounded-md bg-muted/50 px-3 py-2">
                        <span className="capitalize text-muted-foreground">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="font-medium text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Chat Section */}
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <div className="max-h-96 overflow-y-auto p-4">
              {claim.messages.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No messages yet. Start a conversation with the service team.
                </div>
              ) : (
                <div className="space-y-4">
                  {claim.messages.map((message) => {
                    const isCitizen = message.senderType === "citizen"
                    return (
                      <div key={message.id} className={`flex ${isCitizen ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] ${isCitizen ? "order-2" : "order-1"}`}>
                          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                            {isCitizen ? (
                              <>
                                <span>{message.senderName}</span>
                                <User className="h-3 w-3" />
                              </>
                            ) : (
                              <>
                                <Building2 className="h-3 w-3" />
                                <span>{message.senderName}</span>
                              </>
                            )}
                          </div>
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isCitizen ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  className="resize-none"
                  disabled={claim.status === "closed" || claim.status === "rejected"}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending || claim.status === "closed" || claim.status === "rejected"}
                  className="shrink-0"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              {(claim.status === "closed" || claim.status === "rejected") && (
                <p className="mt-2 text-xs text-muted-foreground">
                  This claim is {claim.status}. You cannot send new messages.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
