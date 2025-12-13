"use client"

import ProfilePage from "@/components/profile-page"
import Header from "@/components/header"
import { useRouter } from "next/navigation"

export default function ProfileRoute() {
  const router = useRouter()

  return (
    <>
      <Header />
      <ProfilePage onBack={() => router.push("/")} />
    </>
  )
}
