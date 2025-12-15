"use client"

import { useAuth } from "@/contexts/auth-context"
import { useClaims } from "@/contexts/claims-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Droplets,
  Zap,
  Car,
  Flame,
  Plane,
  Recycle,
  Building2,
  Sparkles,
  ExternalLink,
  MessageSquarePlus,
  FileText,
  Clock,
  CheckCircle2,
  Lightbulb,
  TrafficCone,
} from "lucide-react"
import { useRouter } from "next/navigation"

const services = [
  {
    id: "electricite",
    name: "Électricité",
    description: "Factures d'électricité, pannes, relevés de compteur",
    icon: Zap,
    url: process.env.NODE_ENV === 'production'
      ? "https://electricity.smartcity.gov"
      : "https://electricity-service.vercel.app/",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    id: "smart-parking",
    name: "Smart Parking",
    description: "Stationnement intelligent, réservations, tarifs",
    icon: Car,
    url: "https://parking.smartcity.gov",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "incendies",
    name: "Incendies",
    description: "Prévention incendie, signalement, urgences",
    icon: Flame,
    url: "https://fire.smartcity.gov",
    color: "bg-red-500/10 text-red-600",
  },
  {
    id: "touriste",
    name: "Touriste",
    description: "Informations touristiques, attractions, événements",
    icon: Plane,
    url: "https://tourism.smartcity.gov",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    id: "tri-dechets",
    name: "Tri des Déchets",
    description: "Tri sélectif, recyclage, collecte des déchets",
    icon: Recycle,
    url: "https://waste-sorting.smartcity.gov",
    color: "bg-green-500/10 text-green-600",
  },
  {
    id: "eau-potable",
    name: "Gestion de l'Eau Potable",
    description: "Distribution d'eau, qualité, consommation",
    icon: Droplets,
    url: "https://water.smartcity.gov",
    color: "bg-cyan-500/10 text-cyan-600",
  },
  {
    id: "patrimoine",
    name: "Service Gestion Patrimoine",
    description: "Patrimoine culturel, monuments, préservation",
    icon: Building2,
    url: "https://heritage.smartcity.gov",
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    id: "proprete-urbaine",
    name: "Service Propreté Urbaine",
    description: "Nettoyage des rues, entretien urbain, espaces publics",
    icon: Sparkles,
    url: "https://cleanliness.smartcity.gov",
    color: "bg-teal-500/10 text-teal-600",
  },
  {
    id: "smart-utilities",
    name: "Smart Utilities",
    description: "Gestion intelligente eau/électricité, compteurs, facturation",
    icon: Lightbulb,
    url: "https://utilities.smartcity.gov",
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    id: "smart-traffic",
    name: "Smart Traffic",
    description: "Gestion intelligente du trafic, feux, capteurs, congestion",
    icon: TrafficCone,
    url: "https://traffic.smartcity.gov",
    color: "bg-rose-500/10 text-rose-600",
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { claims } = useClaims()
  const router = useRouter()

  const pendingClaims = claims.filter((c) => c.status === "pending" || c.status === "in_progress").length
  const resolvedClaims = claims.filter((c) => c.status === "resolved").length

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]}</h2>
            <p className="text-muted-foreground">Access city services or manage your claims</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/claims")}>
              <FileText className="mr-2 h-4 w-4" />
              My Claims
            </Button>
            <Button onClick={() => router.push("/claims/new")}>
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              New Claim
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer transition-all hover:border-primary/50"
            onClick={() => router.push("/claims")}
          >
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingClaims}</p>
                <p className="text-sm text-muted-foreground">Active Claims</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:border-primary/50"
            onClick={() => router.push("/claims")}
          >
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{resolvedClaims}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:border-primary/50"
            onClick={() => router.push("/claims")}
          >
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{claims.length}</p>
                <p className="text-sm text-muted-foreground">Total Claims</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:border-primary/50"
            onClick={() => router.push("/claims/new")}
          >
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquarePlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Need Help?</p>
                <p className="text-sm text-muted-foreground">Submit a claim</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Grid */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">City Services</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card
                key={service.id}
                className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                onClick={() => window.open(service.url, "_blank")}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${service.color}`}>
                      <service.icon className="h-6 w-6" />
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{service.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
