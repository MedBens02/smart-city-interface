"use client"

import ClaimDetail from "@/components/claim-detail"
import Header from "@/components/header"
import { useRouter, useParams } from "next/navigation"

export default function ClaimDetailPage() {
  const router = useRouter()
  const params = useParams()
  const claimId = params.id as string

  return (
    <>
      <Header />
      <ClaimDetail claimId={claimId} onBack={() => router.push("/claims")} />
    </>
  )
}
