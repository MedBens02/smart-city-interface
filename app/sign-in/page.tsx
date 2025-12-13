"use client"

import type React from "react"
import { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Shield, Users, Loader2 } from "lucide-react"

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
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
      console.log("Attempting sign in with email:", email)

      const result = await signIn.create({
        identifier: email,
        password: password,
      })

      console.log("Sign in result:", result.status, result)

      if (result.status === "complete") {
        console.log("Sign in complete, setting active session")
        await setActive({ session: result.createdSessionId })
        console.log("Redirecting to home")
        router.push("/")
      } else if (result.status === "needs_second_factor") {
        console.log("2FA is enabled - need to disable it in Clerk dashboard")
        setError("Two-factor authentication is enabled. Please disable it in Clerk Dashboard → User & Authentication → Multi-factor, or contact an administrator.")
      } else if (result.status === "needs_first_factor") {
        console.log("Email verification required, preparing email code")
        const firstFactor = result.supportedFirstFactors.find(
          (factor) => factor.strategy === "email_code"
        )
        if (firstFactor && firstFactor.strategy === "email_code") {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: firstFactor.emailAddressId,
          })
          setVerifying(true)
          setError("")
        } else {
          setError("Email verification not available. Please contact support.")
        }
      } else {
        console.log("Additional verification required:", result.status)
        setError(`Sign in incomplete. Status: ${result.status}`)
      }
    } catch (err: any) {
      console.error("Sign in error:", err)
      console.error("Error details:", err.errors)
      setError(err.errors?.[0]?.message || err.message || "Invalid credentials. Please try again.")
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

      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code: code,
      })

      console.log("Verification result:", result.status, result)

      if (result.status === "complete") {
        console.log("Verification complete, setting active session")
        await setActive({ session: result.createdSessionId })
        console.log("Redirecting to home")
        router.push("/")
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
                Welcome to Your City Services
              </h2>
              <p className="text-pretty text-lg text-muted-foreground">
                Access all municipal services, submit claims, and stay connected with your city administration through
                one unified platform.
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

          {/* Right - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">{verifying ? "Verify Email" : "Sign in"}</CardTitle>
                <CardDescription>
                  {verifying
                    ? "Enter the verification code sent to your email"
                    : "Enter your credentials to access your account"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!verifying ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email or National ID</Label>
                    <Input
                      id="email"
                      type="text"
                      placeholder="Enter your email or ID"
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
                      placeholder="Enter your password"
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
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    <p>
                      Don't have an account?{" "}
                      <a href="/sign-up" className="hover:text-primary hover:underline">
                        Sign up
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
                        ← Back to sign in
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
