"use client"

import { SignIn, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

export default function TestClerkPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Clerk Test Page</h1>

        <SignedOut>
          <SignIn routing="hash" />
        </SignedOut>

        <SignedIn>
          <div className="bg-green-100 p-4 rounded-lg">
            <p className="text-green-800 font-semibold mb-2">✓ You're signed in!</p>
            <UserButton />
            <p className="mt-4">If you see this, Clerk is working correctly.</p>
          </div>
        </SignedIn>
      </div>
    </div>
  )
}
