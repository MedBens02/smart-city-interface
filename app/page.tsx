"use client"

import Dashboard from "@/components/dashboard"
import Header from "@/components/header"

export default function Home() {
  // Middleware protects this route - user is always authenticated here
  return (
    <>
      <Header />
      <Dashboard />
    </>
  )
}
