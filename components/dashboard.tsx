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
  ArrowRight,
  Trash2,
  Bus,
  LampCeiling,
} from "lucide-react"
import { useRouter } from "next/navigation"

const services = [
  {
    id: "smart-parking",
    code: "SPK",
    name: "Smart Parking",
    description: "Stationnement intelligent, réservations et tarifs",
    icon: Car,
    url: "https://parking.smartcity.gov",
    gradient: "from-blue-500 via-blue-400 to-cyan-400",
    lightGradient: "from-blue-50 to-cyan-50",
    borderColor: "hover:border-blue-400",
  },
  {
    id: "incendies",
    code: "RFM",
    name: "Incendies",
    description: "Prévention incendie, signalement et urgences",
    icon: Flame,
    url: "https://fire.smartcity.gov",
    gradient: "from-rose-500 via-pink-400 to-red-400",
    lightGradient: "from-rose-50 to-pink-50",
    borderColor: "hover:border-rose-400",
  },
  {
    id: "touriste",
    code: "TRM",
    name: "Tourisme",
    description: "Informations touristiques, attractions et événements",
    icon: Plane,
    url: "https://tourism.smartcity.gov",
    gradient: "from-indigo-500 via-purple-400 to-violet-400",
    lightGradient: "from-indigo-50 to-purple-50",
    borderColor: "hover:border-indigo-400",
  },
  {
    id: "tri-dechets",
    code: "ENV",
    name: "Tri des Déchets",
    description: "Tri sélectif, recyclage et collecte des déchets",
    icon: Recycle,
    url: "https://waste-sorting.smartcity.gov",
    gradient: "from-emerald-500 via-teal-400 to-cyan-400",
    lightGradient: "from-emerald-50 to-teal-50",
    borderColor: "hover:border-emerald-400",
  },
  {
    id: "eau-potable",
    code: "WM",
    name: "Gestion de l'Eau Potable",
    description: "Distribution d'eau, qualité et consommation",
    icon: Droplets,
    url: "https://water.smartcity.gov",
    gradient: "from-blue-500 via-blue-400 to-cyan-400",
    lightGradient: "from-blue-50 to-cyan-50",
    borderColor: "hover:border-blue-400",
  },
  {
    id: "patrimoine",
    code: "PAT",
    name: "Gestion Patrimoine",
    description: "Patrimoine culturel, monuments et préservation",
    icon: Building2,
    url: "https://heritage.smartcity.gov",
    gradient: "from-orange-500 via-rose-400 to-pink-400",
    lightGradient: "from-orange-50 to-rose-50",
    borderColor: "hover:border-orange-400",
  },
  {
    id: "proprete-urbaine",
    code: "PRP",
    name: "Propreté Urbaine",
    description: "Nettoyage des rues, entretien urbain et espaces publics",
    icon: Sparkles,
    url: "https://cleanliness.smartcity.gov",
    gradient: "from-teal-500 via-cyan-400 to-blue-400",
    lightGradient: "from-teal-50 to-cyan-50",
    borderColor: "hover:border-teal-400",
  },
  {
    id: "smart-traffic",
    code: "STR",
    name: "Smart Traffic",
    description: "Gestion intelligente du trafic, feux et capteurs",
    icon: TrafficCone,
    url: "https://traffic.smartcity.gov",
    gradient: "from-rose-500 via-pink-400 to-red-400",
    lightGradient: "from-rose-50 to-pink-50",
    borderColor: "hover:border-rose-400",
  },
  {
    id: "smart-utilities",
    code: "WEM",
    name: "Smart Utilities",
    description: "Gestion intelligente eau et électricité, compteurs",
    icon: Lightbulb,
    url: "https://utilities.smartcity.gov",
    gradient: "from-amber-400 via-orange-400 to-red-400",
    lightGradient: "from-amber-50 to-orange-50",
    borderColor: "hover:border-amber-400",
  },
  {
    id: "gestion-dechets",
    code: "GDD",
    name: "Gestion de Déchets",
    description: "Collecte, traitement et valorisation des déchets",
    icon: Trash2,
    url: "https://waste.smartcity.gov",
    gradient: "from-green-500 via-emerald-400 to-teal-400",
    lightGradient: "from-green-50 to-emerald-50",
    borderColor: "hover:border-green-400",
  },
  {
    id: "mobilite-transport",
    code: "MTU",
    name: "Mobilité & Transport Urbain",
    description: "Réseau de bus, horaires et abonnements",
    icon: Bus,
    url: "https://transport.smartcity.gov",
    gradient: "from-violet-500 via-purple-400 to-fuchsia-400",
    lightGradient: "from-violet-50 to-purple-50",
    borderColor: "hover:border-violet-400",
  },
  {
    id: "gestion-dechets-avancee",
    code: "AGD",
    name: "Gestion de Déchets Avancée",
    description: "Solutions innovantes pour la gestion des déchets",
    icon: Recycle,
    url: "https://advanced-waste.smartcity.gov",
    gradient: "from-cyan-500 via-sky-400 to-blue-400",
    lightGradient: "from-cyan-50 to-sky-50",
    borderColor: "hover:border-cyan-400",
  },
  {
    id: "eclairage-public",
    code: "AEP",
    name: "Gestion d'Éclairage Public",
    description: "Éclairage urbain intelligent et économie d'énergie",
    icon: LampCeiling,
    url: "https://lighting.smartcity.gov",
    gradient: "from-yellow-500 via-amber-400 to-orange-400",
    lightGradient: "from-yellow-50 to-amber-50",
    borderColor: "hover:border-yellow-400",
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { claims } = useClaims()
  const router = useRouter()

  const pendingClaims = claims.filter((c) => c.status === "pending" || c.status === "in_progress").length
  const resolvedClaims = claims.filter((c) => c.status === "resolved").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/3">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Bienvenue, {user?.name?.split(" ")[0]}
            </h2>
            <p className="text-muted-foreground mt-2">Gérez vos réclamations et accédez aux services de la ville</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => router.push("/claims")} className="h-10">
              <FileText className="mr-2 h-4 w-4" />
              Mes Réclamations
            </Button>
            <Button onClick={() => router.push("/claims/new")} className="h-10">
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Soumettre une Réclamation
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="group cursor-pointer border-border/40 bg-gradient-to-br from-amber-500/5 to-transparent transition-all hover:border-amber-500/30 hover:shadow-lg"
            onClick={() => router.push("/claims")}
          >
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{pendingClaims}</p>
                <p className="text-sm text-muted-foreground">Réclamations Actives</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer border-border/40 bg-gradient-to-br from-green-500/5 to-transparent transition-all hover:border-green-500/30 hover:shadow-lg"
            onClick={() => router.push("/claims")}
          >
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{resolvedClaims}</p>
                <p className="text-sm text-muted-foreground">Résolues</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer border-border/40 bg-gradient-to-br from-blue-500/5 to-transparent transition-all hover:border-blue-500/30 hover:shadow-lg"
            onClick={() => router.push("/claims")}
          >
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{claims.length}</p>
                <p className="text-sm text-muted-foreground">Total Réclamations</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer border-border/40 bg-gradient-to-br from-primary/5 to-transparent transition-all hover:border-primary/30 hover:shadow-lg"
            onClick={() => router.push("/claims/new")}
          >
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <MessageSquarePlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Soumettre une Réclamation</p>
                <p className="text-sm text-muted-foreground">Signaler un problème</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Grid */}
        <div>
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-foreground">Services de la Ville</h3>
            <p className="text-muted-foreground mt-1">Accédez aux services municipaux et soumettez des réclamations</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card
                key={service.id}
                className={`group relative overflow-hidden cursor-pointer border-2 border-border/40 bg-gradient-to-br ${service.lightGradient} transition-all duration-300 hover:shadow-xl ${service.borderColor}`}
                onClick={() => window.open(service.url, "_blank")}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
                />

                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${service.gradient} group-hover:shadow-lg transition-all group-hover:scale-110`}
                    >
                      <service.icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                  </div>
                  <CardTitle className="text-lg mt-4 group-hover:text-primary transition-colors">
                    {service.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
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
