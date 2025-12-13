"use client"

import type React from "react"

import { useClaims } from "@/contexts/claims-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  MessageSquare,
  ChevronRight,
  FileText,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { ClaimStatus } from "@/lib/types"

interface ClaimsHistoryProps {
  onBack: () => void
  onViewClaim: (claimId: string) => void
}

const statusConfig: Record<
  ClaimStatus,
  { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  in_progress: { label: "In Progress", icon: Loader2, variant: "default" },
  resolved: { label: "Resolved", icon: CheckCircle2, variant: "outline" },
  closed: { label: "Closed", icon: XCircle, variant: "secondary" },
  rejected: { label: "Rejected", icon: AlertCircle, variant: "destructive" },
}

export default function ClaimsHistory({ onBack, onViewClaim }: ClaimsHistoryProps) {
  const { claims } = useClaims()

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">My Claims</h2>
          <p className="text-muted-foreground">View and manage your submitted claims</p>
        </div>

        {claims.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">No claims yet</h3>
              <p className="text-center text-muted-foreground">
                You haven&apos;t submitted any claims. When you do, they will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => {
              const status = statusConfig[claim.status]
              const StatusIcon = status.icon

              return (
                <Card
                  key={claim.id}
                  className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                  onClick={() => onViewClaim(claim.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{claim.id}</span>
                          <Badge variant={status.variant} className="flex items-center gap-1">
                            <StatusIcon className={`h-3 w-3 ${claim.status === "in_progress" ? "animate-spin" : ""}`} />
                            {status.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{claim.title}</CardTitle>
                        <CardDescription className="mt-1">{claim.serviceName}</CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{claim.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>Created {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}</span>
                      {claim.location && <span>Location: {claim.location}</span>}
                      {claim.messages.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {claim.messages.length} message{claim.messages.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
