"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useClaims } from "@/contexts/claims-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  MessageSquare,
  Search,
  Filter,
  FileText,
  ChevronRight,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { ClaimStatus } from "@/lib/types"

interface ClaimsHistoryProps {
  onBack: () => void
  onViewClaim: (claimId: string) => void
}

const statusConfig: Record<
  ClaimStatus,
  {
    label: string
    icon: React.ElementType
    variant: "default" | "secondary" | "destructive" | "outline"
    bgColor: string
  }
> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary", bgColor: "bg-amber-50 dark:bg-amber-950/30" },
  in_progress: { label: "In Progress", icon: Loader2, variant: "default", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  resolved: { label: "Resolved", icon: CheckCircle2, variant: "outline", bgColor: "bg-green-50 dark:bg-green-950/30" },
  closed: { label: "Closed", icon: XCircle, variant: "secondary", bgColor: "bg-gray-50 dark:bg-gray-800/50" },
  rejected: { label: "Rejected", icon: AlertCircle, variant: "destructive", bgColor: "bg-red-50 dark:bg-red-950/30" },
}

export default function ClaimsHistory({ onBack, onViewClaim }: ClaimsHistoryProps) {
  const { claims } = useClaims()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<ClaimStatus | "all">("all")

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const matchesSearch =
        claim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = selectedStatus === "all" || claim.status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }, [claims, searchTerm, selectedStatus])

  const statusOptions: Array<{ value: ClaimStatus | "all"; label: string }> = [
    { value: "all", label: "All Claims" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
    { value: "rejected", label: "Rejected" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">My Claims</h2>
            <p className="text-muted-foreground">Track and manage your submitted claims</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4 lg:flex lg:gap-4 lg:space-y-0">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, description, or claim ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ClaimStatus | "all")}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Claims Grid */}
        {filteredClaims.length === 0 ? (
          <Card className="border-dashed">
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">No claims found</h3>
              <p className="text-center text-muted-foreground">
                {claims.length === 0
                  ? "You haven't submitted any claims yet."
                  : "No claims match your search or filter criteria."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {filteredClaims.map((claim) => {
              const status = statusConfig[claim.status]
              const StatusIcon = status.icon

              return (
                <Card
                  key={claim.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 ${status.bgColor}`}
                  onClick={() => onViewClaim(claim.id)}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-muted-foreground mb-2">{claim.id}</p>
                        <h3 className="text-lg font-semibold text-foreground line-clamp-2">{claim.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{claim.serviceName}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground mt-1" />
                    </div>

                    {/* Status Badge */}
                    <div className="mb-4">
                      <Badge variant={status.variant} className="flex w-fit items-center gap-1">
                        <StatusIcon className={`h-3 w-3 ${claim.status === "in_progress" ? "animate-spin" : ""}`} />
                        {status.label}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="mb-4 text-sm text-foreground line-clamp-2">{claim.description}</p>

                    {/* Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-4 text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}</span>
                      {claim.messages.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {claim.messages.length}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Stats */}
        {claims.length > 0 && (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: "Total", value: claims.length, color: "bg-muted" },
              {
                label: "Pending",
                value: claims.filter((c) => c.status === "pending").length,
                color: "bg-amber-100 dark:bg-amber-950",
              },
              {
                label: "In Progress",
                value: claims.filter((c) => c.status === "in_progress").length,
                color: "bg-blue-100 dark:bg-blue-950",
              },
              {
                label: "Resolved",
                value: claims.filter((c) => c.status === "resolved").length,
                color: "bg-green-100 dark:bg-green-950",
              },
              {
                label: "Closed",
                value: claims.filter((c) => c.status === "closed").length,
                color: "bg-gray-200 dark:bg-gray-800",
              },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-lg ${stat.color} p-4 text-center`}>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
