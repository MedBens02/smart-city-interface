import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider } from "@clerk/nextjs"
import { AuthProvider } from "@/contexts/auth-context"
import { ClaimsProvider } from "@/contexts/claims-context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Smart City Portal",
  description: "Your gateway to city services and citizen engagement",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-sans antialiased">
          <AuthProvider>
            <ClaimsProvider>{children}</ClaimsProvider>
          </AuthProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
