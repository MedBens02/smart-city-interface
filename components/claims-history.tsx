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
  FileText,
  ChevronRight,
  Zap,
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
    badgeGradient: string
  }
> = {
  submitted: {
    label: "En Attente",
    icon: Clock,
    variant: "secondary",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    badgeGradient: "from-amber-500 to-orange-500",
  },
  received: {
    label: "En Attente",
    icon: Clock,
    variant: "secondary",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    badgeGradient: "from-amber-500 to-orange-500",
  },
  assigned: {
    label: "En Cours",
    icon: Loader2,
    variant: "default",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    badgeGradient: "from-blue-500 to-cyan-500",
  },
  in_progress: {
    label: "En Cours",
    icon: Loader2,
    variant: "default",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    badgeGradient: "from-blue-500 to-cyan-500",
  },
  pending_info: {
    label: "En Attente",
    icon: Clock,
    variant: "secondary",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    badgeGradient: "from-amber-500 to-orange-500",
  },
  resolved: {
    label: "Résolue",
    icon: CheckCircle2,
    variant: "outline",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    badgeGradient: "from-green-500 to-emerald-500",
  },
  rejected: {
    label: "Rejetée",
    icon: AlertCircle,
    variant: "destructive",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    badgeGradient: "from-red-500 to-pink-500",
  },
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
    { value: "all", label: "Toutes les Réclamations" },
    { value: "submitted", label: "En Attente" },
    { value: "in_progress", label: "En Cours" },
    { value: "resolved", label: "Résolues" },
    { value: "rejected", label: "Rejetées" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-8 text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au Tableau de Bord
          </Button>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Mes Réclamations
              </h2>
            </div>
            <p className="text-lg text-muted-foreground">
              Suivez et gérez vos réclamations soumises en temps réel
            </p>
          </div>
        </div>

        <div className="mb-10 space-y-4 lg:flex lg:gap-4 lg:space-y-0">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Rechercher par titre, ID ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-11 border-2 border-border/40 rounded-lg focus:border-primary transition-all bg-white dark:bg-background"
              />
            </div>
          </div>

          <div className="flex gap-2 items-center px-4 py-3 bg-muted/30 rounded-lg border-2 border-border/40 w-fit">
            <Zap className="h-5 w-5 text-accent" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ClaimStatus | "all")}
              className="bg-transparent text-foreground font-medium focus:outline-none cursor-pointer"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredClaims.length === 0 ? (
          <Card className="border-2 border-dashed border-border/40">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Aucune réclamation trouvée</h3>
              <p className="text-center text-muted-foreground max-w-sm">
                {claims.length === 0
                  ? "Vous n'avez soumis aucune réclamation pour le moment. Créez-en une pour commencer !"
                  : "Aucune réclamation ne correspond à votre recherche ou à vos critères de filtre."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
            {filteredClaims.map((claim) => {
              const status = statusConfig[claim.status]
              const StatusIcon = status.icon

              return (
                <Card
                  key={claim.id}
                  className={`group cursor-pointer border-2 transition-all duration-300 hover:shadow-lg hover:border-primary/30 ${status.bgColor}`}
                  onClick={() => onViewClaim(claim.id)}
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-muted-foreground/70 mb-2 tracking-wide">{claim.id}</p>
                        <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {claim.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">{claim.serviceName}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1" />
                    </div>

                    <div>
                      <div
                        className={`flex w-fit items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${status.badgeGradient}`}
                      >
                        <StatusIcon
                          className={`h-4 w-4 text-white ${claim.status === "in_progress" || claim.status === "assigned" ? "animate-spin" : ""}`}
                        />
                        <span className="text-sm font-semibold text-white">{status.label}</span>
                      </div>
                    </div>

                    <p className="text-sm text-foreground line-clamp-2">{claim.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4 text-xs">
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
                      </span>
                      {claim.messages.length > 0 && (
                        <span className="flex items-center gap-2 px-2.5 py-1 bg-primary/10 rounded-full text-primary font-medium">
                          <MessageSquare className="h-3.5 w-3.5" />
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

        {claims.length > 0 && (
          <div className="mt-14">
            <h3 className="text-xl font-bold text-foreground mb-6">Aperçu des Réclamations</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { label: "Total", value: claims.length, gradient: "from-slate-400 to-gray-500" },
                {
                  label: "En Attente",
                  value: claims.filter((c) => c.status === "submitted" || c.status === "received" || c.status === "pending_info")
                    .length,
                  gradient: "from-amber-400 to-orange-500",
                },
                {
                  label: "En Cours",
                  value: claims.filter((c) => c.status === "in_progress" || c.status === "assigned").length,
                  gradient: "from-blue-400 to-cyan-500",
                },
                {
                  label: "Résolues",
                  value: claims.filter((c) => c.status === "resolved").length,
                  gradient: "from-green-400 to-emerald-500",
                },
                {
                  label: "Rejetées",
                  value: claims.filter((c) => c.status === "rejected").length,
                  gradient: "from-red-400 to-pink-500",
                },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className={`bg-gradient-to-br ${stat.gradient} border-0 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105`}
                >
                  <div className="p-4 text-center">
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm font-medium opacity-90 mt-1">{stat.label}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
