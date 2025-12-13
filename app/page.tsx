"use client"

import Dashboard from "@/components/dashboard"

export default function Home() {
  // Middleware protects this route - user is always authenticated here
  return <Dashboard />
}
