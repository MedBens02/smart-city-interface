"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useClaims } from "@/contexts/claims-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  MessageSquare,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { groupMessagesByDate } from "@/lib/message-utils"
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
  const messageGroups = claim ? groupMessagesByDate(claim.messages) : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [claim?.messages])

  if (!claim) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Claims
          </Button>
          <Card>
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Claim not found</p>
            </div>
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
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Claims
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Claim Header Card */}
            <Card className="p-6 sm:p-8">
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-muted-foreground mb-2">{claim.id}</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">{claim.title}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{claim.serviceName}</p>
                  </div>
                  <Badge variant={status.variant} className="flex w-fit items-center gap-1 shrink-0">
                    <StatusIcon className={`h-3 w-3 ${claim.status === "in_progress" ? "animate-spin" : ""}`} />
                    {status.label}
                  </Badge>
                </div>

                <Separator className="my-4" />

                <p className="text-foreground leading-relaxed">{claim.description}</p>
              </div>

              {/* Metadata */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(claim.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>

                {claim.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-foreground">{claim.location}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Extra Data Card */}
            {Object.keys(claim.extraData).length > 0 && (
              <Card className="p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-foreground mb-4">Additional Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(claim.extraData).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-muted/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p className="font-medium text-foreground break-words">{value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Chat Section */}
            <Card className="flex flex-col overflow-hidden">
              <div className="border-b border-border bg-muted/40 px-6 py-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Conversation</h3>
                  {claim.messages.length > 0 && (
                    <span className="ml-auto text-sm text-muted-foreground">
                      {claim.messages.length} message{claim.messages.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-96">
                {claim.messages.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Start a conversation with the service team.
                    </p>
                  </div>
                ) : (
                  <>
                    {messageGroups.map((group) => (
                      <div key={group.date}>
                        <div className="mb-4 flex items-center justify-center">
                          <div className="bg-muted px-3 py-1 rounded-full">
                            <p className="text-xs font-medium text-muted-foreground">{group.date}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {group.messages.map((message) => {
                            const isCitizen = message.senderType === "citizen"
                            return (
                              <div key={message.id} className={`flex ${isCitizen ? "justify-end" : "justify-start"}`}>
                                <div
                                  className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isCitizen ? "flex-row-reverse" : "flex-row"}`}
                                >
                                  {/* Avatar */}
                                  <div
                                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isCitizen ? "bg-primary/10" : "bg-accent/10"}`}
                                  >
                                    {isCitizen ? (
                                      <User className="h-4 w-4 text-primary" />
                                    ) : (
                                      <Building2 className="h-4 w-4 text-accent" />
                                    )}
                                  </div>

                                  {/* Message Bubble */}
                                  <div className={isCitizen ? "flex flex-col items-end" : "flex flex-col items-start"}>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                      {message.senderName}
                                    </p>
                                    <div
                                      className={`rounded-2xl px-4 py-2.5 ${
                                        isCitizen
                                          ? "bg-primary text-primary-foreground rounded-br-sm"
                                          : "bg-muted text-foreground rounded-bl-sm"
                                      }`}
                                    >
                                      <p className="text-sm leading-relaxed">{message.content}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {format(new Date(message.timestamp), "h:mm a")}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-border bg-muted/40 p-4 sm:p-6">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={
                      claim.status === "closed" || claim.status === "rejected"
                        ? "This claim is closed. No new messages can be sent."
                        : "Type your message..."
                    }
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    className="resize-none"
                    disabled={claim.status === "closed" || claim.status === "rejected"}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={
                      !newMessage.trim() || isSending || claim.status === "closed" || claim.status === "rejected"
                    }
                    className="shrink-0"
                    size="icon"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Quick Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-foreground mb-4">Status Timeline</h4>
              <div className="space-y-3">
                <div>
                  <Badge variant={status.variant} className="flex w-fit items-center gap-1 mb-2">
                    <StatusIcon className={`h-3 w-3 ${claim.status === "in_progress" ? "animate-spin" : ""}`} />
                    {status.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(claim.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="text-sm font-semibold text-foreground mb-4">Activity Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Messages</span>
                  <span className="font-medium text-foreground">{claim.messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Update</span>
                  <span className="font-medium text-foreground">
                    {formatDistanceToNow(new Date(claim.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
