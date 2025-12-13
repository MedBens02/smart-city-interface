"use client"

import ClaimsHistory from "@/components/claims-history"
import Header from "@/components/header"
import { useRouter } from "next/navigation"

export default function ClaimsPage() {
  const router = useRouter()

  return (
    <>
      <Header />
      <ClaimsHistory
        onBack={() => router.push("/")}
        onViewClaim={(id) => router.push(`/claims/${id}`)}
      />
    </>
  )
}
