"use client"

import type React from "react"
import { useState } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Shield, Users, Loader2 } from "lucide-react"

export default function SignUpPage() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [code, setCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoaded) {
      console.log("Clerk not loaded yet")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      console.log("Creating sign up with:", { firstName, lastName, email })

      const result = await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password: password,
      })

      console.log("Sign up result:", result.status, result)

      if (result.status === "complete") {
        console.log("Sign up complete, setting active session")
        await setActive({ session: result.createdSessionId })
        console.log("Redirecting to onboarding")
        router.push("/onboarding")
      } else if (result.status === "missing_requirements") {
        console.log("Missing requirements, preparing email verification")
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
        setVerifying(true)
        setError("")
      } else {
        console.log("Verification required:", result.status)
        setError(`Account created but verification required. Status: ${result.status}`)
      }
    } catch (err: any) {
      console.error("Sign up error:", err)
      console.error("Error details:", err.errors)
      setError(err.errors?.[0]?.message || err.message || "Failed to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoaded || !code) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      console.log("Verifying email with code:", code)

      const result = await signUp.attemptEmailAddressVerification({
        code: code,
      })

      console.log("Verification result:", result.status, result)

      if (result.status === "complete") {
        console.log("Verification complete, setting active session")
        await setActive({ session: result.createdSessionId })
        console.log("Redirecting to onboarding")
        router.push("/onboarding")
      } else {
        console.log("Verification incomplete:", result.status)
        setError(`Verification incomplete. Status: ${result.status}`)
      }
    } catch (err: any) {
      console.error("Verification error:", err)
      console.error("Error details:", err.errors)
      setError(err.errors?.[0]?.message || err.message || "Invalid code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Smart City</h1>
              <p className="text-xs text-muted-foreground">Citizen Portal</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left - Info Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground">
                Join Your City Services
              </h2>
              <p className="text-pretty text-lg text-muted-foreground">
                Create your account to access all municipal services, submit claims, and stay connected with your city
                administration.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Shield className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-card-foreground">Secure Access</h3>
                  <p className="text-sm text-muted-foreground">Your data is protected with enterprise-grade security</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Users className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-card-foreground">Citizen First</h3>
                  <p className="text-sm text-muted-foreground">Designed for easy access to all city services</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Sign Up Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">{verifying ? "Verify Email" : "Create Account"}</CardTitle>
                <CardDescription>
                  {verifying
                    ? "Enter the verification code sent to your email"
                    : "Enter your information to create your account"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!verifying ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {/* CAPTCHA widget */}
                  <div id="clerk-captcha"></div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full" disabled={isLoading || !isLoaded}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    <p>
                      Already have an account?{" "}
                      <a href="/sign-in" className="hover:text-primary hover:underline">
                        Sign in
                      </a>
                    </p>
                  </div>
                </form>
                ) : (
                  <form onSubmit={handleVerifyEmail} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Verification Code</Label>
                      <Input
                        id="code"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        maxLength={6}
                        required
                        autoFocus
                      />
                      <p className="text-sm text-muted-foreground">
                        Check your email at <strong>{email}</strong> for the verification code
                      </p>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button type="submit" className="w-full" disabled={isLoading || !isLoaded || !code}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify Email"
                      )}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => setVerifying(false)}
                        className="hover:text-primary hover:underline"
                      >
                        ← Back to sign up
                      </button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
