"use client"

import ClaimForm from "@/components/claim-form"
import Header from "@/components/header"
import { useRouter } from "next/navigation"

export default function NewClaimPage() {
  const router = useRouter()

  return (
    <>
      <Header />
      <ClaimForm onBack={() => router.push("/")} />
    </>
  )
}
