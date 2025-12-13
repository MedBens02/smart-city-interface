# Clerk SSO Implementation Guide
## Smart City Portal & Microservices

This guide explains how Single Sign-On (SSO) is implemented across the Smart City Portal and its microservices using Clerk authentication.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Portal Implementation](#portal-implementation)
3. [Electricity Service Implementation](#electricity-service-implementation)
4. [How SSO Works](#how-sso-works)
5. [Adding a New Service](#adding-a-new-service)
6. [Key Concepts](#key-concepts)
7. [Code Templates](#code-templates)
8. [Troubleshooting](#troubleshooting)
9. [Security](#security)
10. [Production Deployment](#production-deployment)

---

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Clerk Authentication                     │
│           (Single Source of Truth for Sessions)             │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐            ┌────────▼─────────┐
│  Portal (3000) │            │ Services (3001+) │
│                │            │                  │
│  - Sign In     │            │  - Electricity   │
│  - Sign Up     │───────────▶│  - Water         │
│  - Onboarding  │  New Tab   │  - Transport     │
│  - Profile     │            │  - etc...        │
└────────────────┘            └──────────────────┘
```

### Why Clerk?

- **Centralized Authentication**: One authentication system for all services
- **Session Sharing**: Users login once, access all services
- **Metadata Storage**: User data stored centrally and accessible by all services
- **Easy Integration**: Simple SDK for Next.js
- **Development Mode**: Works with localhost for easy testing

---

## Portal Implementation

The portal (`smart-city-interface`) handles all authentication and user management.

### 1. Environment Configuration

**File**: `.env.local`

```env
# Clerk API Keys
# Get these from: https://dashboard.clerk.com/last-active?path=api-keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c2luY2VyZS1raXQtNTEuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_JBuvDpahZ8pfmeQd8LoCCECImcalAnVduqRgmMe3ij

# Custom routing
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# For cross-subdomain SSO (production)
# NEXT_PUBLIC_CLERK_DOMAIN=smartcity.gov
```

**Important**:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Public key, safe to expose in browser
- `CLERK_SECRET_KEY`: Secret key, used server-side only
- All services MUST use the SAME keys for SSO to work

### 2. Middleware Setup

**File**: `proxy.ts` (at project root)

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/test-clerk(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

**How it works**:
- Routes matching `isPublicRoute` are accessible without authentication
- All other routes require authentication via `auth.protect()`
- Unauthenticated users are redirected to `/sign-in`

### 3. App Layout

**File**: `app/layout.tsx`

```typescript
import { ClerkProvider } from "@clerk/nextjs"
import { AuthProvider } from "@/contexts/auth-context"
import { ClaimsProvider } from "@/contexts/claims-context"

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
```

**Provider hierarchy**:
1. `ClerkProvider`: Provides Clerk context to entire app
2. `AuthProvider`: Custom wrapper that maps Clerk data to app's User interface
3. `ClaimsProvider`: App-specific context for claims management

### 4. Authentication Context

**File**: `contexts/auth-context.tsx`

```typescript
"use client"

import { useUser, useClerk } from "@clerk/nextjs"
import { useEffect, useState } from "react"

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const [user, setUser] = useState<User | null>(null)

  // Map Clerk user to custom User interface
  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      setUser({
        id: clerkUser.id,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        nationalId: (clerkUser.unsafeMetadata?.nationalId as string) || '',
        phone: (clerkUser.unsafeMetadata?.phone as string) || '',
        address: (clerkUser.unsafeMetadata?.address as string) || '',
        city: (clerkUser.unsafeMetadata?.city as string) || '',
        dateOfBirth: (clerkUser.unsafeMetadata?.dateOfBirth as string) || '',
      })
    } else if (isLoaded && !isSignedIn) {
      setUser(null)
    }
  }, [clerkUser, isLoaded, isSignedIn])

  const logout = useCallback(() => {
    signOut({ redirectUrl: '/sign-in' })
  }, [signOut])

  // ... rest of context
}
```

**Key points**:
- Uses Clerk's `useUser()` hook to get authenticated user
- Maps Clerk user to app's custom `User` interface
- All custom metadata stored in `unsafeMetadata` (user-editable)
- Maintains backward compatibility with existing app code

### 5. Sign-In Flow

**File**: `app/sign-in/page.tsx` (abbreviated)

```typescript
"use client"

import { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const { signIn, setActive } = useSignIn()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [code, setCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await signIn.create({
      identifier: email,
      password: password,
    })

    if (result.status === "complete") {
      await setActive({ session: result.createdSessionId })
      router.push("/")
    } else if (result.status === "needs_first_factor") {
      // Email verification required
      const firstFactor = result.supportedFirstFactors.find(
        (factor) => factor.strategy === "email_code"
      )
      if (firstFactor && firstFactor.strategy === "email_code") {
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: firstFactor.emailAddressId,
        })
        setVerifying(true)
      }
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await signIn.attemptFirstFactor({
      strategy: "email_code",
      code: code,
    })

    if (result.status === "complete") {
      await setActive({ session: result.createdSessionId })
      router.push("/")
    }
  }

  return (
    <div>
      {!verifying ? (
        <form onSubmit={handleSubmit}>
          {/* Email and password inputs */}
          <div id="clerk-captcha"></div> {/* Important! */}
        </form>
      ) : (
        <form onSubmit={handleVerifyEmail}>
          {/* Verification code input */}
        </form>
      )}
    </div>
  )
}
```

**Two-step authentication**:
1. User enters email/password
2. If email verification enabled, user receives code via email
3. User enters code to complete sign-in

**Important**: Include `<div id="clerk-captcha"></div>` to avoid CAPTCHA errors

### 6. Sign-Up Flow

**File**: `app/sign-up/page.tsx` (similar structure)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const result = await signUp.create({
    firstName,
    lastName,
    emailAddress: email,
    password: password,
  })

  if (result.status === "complete") {
    await setActive({ session: result.createdSessionId })
    router.push("/onboarding")
  } else if (result.status === "missing_requirements") {
    await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
    setVerifying(true)
  }
}

const handleVerifyEmail = async (e: React.FormEvent) => {
  e.preventDefault()

  const result = await signUp.attemptEmailAddressVerification({ code })

  if (result.status === "complete") {
    await setActive({ session: result.createdSessionId })
    router.push("/onboarding")
  }
}
```

### 7. Onboarding (Metadata Collection)

**File**: `app/onboarding/page.tsx`

```typescript
"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [nationalId, setNationalId] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Store all user metadata in unsafeMetadata
    await user.update({
      unsafeMetadata: {
        nationalId,
        phone,
        address,
        city,
        dateOfBirth,
      },
    })

    router.push("/")
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields for all metadata */}
    </form>
  )
}
```

**Why unsafeMetadata?**
- `publicMetadata`: Can only be set via Clerk Dashboard or Backend API (read-only for users)
- `unsafeMetadata`: Can be set by users via `user.update()` (user-editable)

### 8. Profile Management

**File**: `components/profile-page.tsx`

```typescript
const updateProfile = async (updates: Partial<User>) => {
  await clerkUser.update({
    firstName,
    lastName,
    unsafeMetadata: {
      nationalId: updates.nationalId,
      phone: updates.phone,
      address: updates.address,
      city: updates.city,
      dateOfBirth: updates.dateOfBirth,
    }
  })
}
```

### 9. Service Links

**File**: `components/dashboard.tsx`

```typescript
const services = [
  {
    id: "electricity",
    name: "Electricity",
    description: "Power bills, outage reports, meter readings",
    icon: Zap,
    url: process.env.NODE_ENV === 'production'
      ? "https://electricity.smartcity.gov"
      : "http://localhost:3001",
    color: "bg-amber-500/10 text-amber-600",
  },
  // ... more services
]

// Opening service in new tab
<a href={service.url} target="_blank" rel="noopener noreferrer">
  <Button>
    Open Service
    <ExternalLink className="ml-2 h-4 w-4" />
  </Button>
</a>
```

---

## Electricity Service Implementation

The electricity service is a separate Next.js app that automatically authenticates users from the portal.

### 1. Environment Configuration

**File**: `electricity-service/.env.local`

```env
# CRITICAL: Use SAME keys as portal for SSO to work
# Get these from your Clerk dashboard: https://dashboard.clerk.com/last-active?path=api-keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c2luY2VyZS1raXQtNTEuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_JBuvDpahZ8pfmeQd8LoCCECImcalAnVduqRgmMe3ij

# Redirect to portal for authentication (use localhost for development)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=http://localhost:3000/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=http://localhost:3000/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=http://localhost:3001
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=http://localhost:3001

# For cross-subdomain SSO (production only - comment out for local dev)
# NEXT_PUBLIC_CLERK_DOMAIN=smartcity.gov
# Production URLs:
# NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://portal.smartcity.gov/sign-in
# NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://portal.smartcity.gov/sign-up
# NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=https://electricity.smartcity.gov
# NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=https://electricity.smartcity.gov
```

**Critical points**:
- ✅ SAME Clerk keys as portal
- ✅ Sign-in/sign-up URLs point to PORTAL
- ✅ After-sign-in URL points to THIS service

### 2. Middleware

**File**: `electricity-service/proxy.ts`

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

// Protect all routes - will redirect to portal sign-in if not authenticated
export default clerkMiddleware(async (auth) => {
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

**How it works**:
- All routes are protected
- If user not authenticated, redirects to portal sign-in (via env vars)
- After successful sign-in on portal, user redirected back to this service

### 3. App Layout

**File**: `electricity-service/app/layout.tsx`

```typescript
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

**Minimal setup**: Only ClerkProvider needed, no custom auth context required

### 4. Main Page (Server Component)

**File**: `electricity-service/app/page.tsx`

```typescript
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ElectricityPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Extract user data including custom metadata
  const userData = {
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
    email: user.primaryEmailAddress?.emailAddress || 'No email',
    nationalId: (user.unsafeMetadata?.nationalId as string) || 'Not provided',
    phone: (user.unsafeMetadata?.phone as string) || 'Not provided',
    address: (user.unsafeMetadata?.address as string) || 'Not provided',
    city: (user.unsafeMetadata?.city as string) || 'Not provided',
    dateOfBirth: (user.unsafeMetadata?.dateOfBirth as string) || 'Not provided',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Electricity Service</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome to Electricity Service
        </h2>

        <div className="bg-white rounded-lg border p-8 mt-8">
          <h3 className="text-2xl font-semibold mb-6">Your Information</h3>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-base font-semibold text-gray-900">{userData.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-base font-semibold text-gray-900">{userData.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">National ID</p>
              <p className="text-base font-semibold text-gray-900">{userData.nationalId}</p>
            </div>
            {/* More fields... */}
          </div>

          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✓ Successfully authenticated via Single Sign-On (SSO)
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Server component benefits**:
- Use `currentUser()` to get user on server
- Access all Clerk user data including metadata
- No client-side hooks needed for simple data display

### 5. Port Configuration

**File**: `electricity-service/package.json`

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001"
  }
}
```

---

## How SSO Works

### Session Sharing Mechanism

```
┌──────────────────────────────────────────────────────────┐
│                    User Journey                          │
└──────────────────────────────────────────────────────────┘

1. User visits localhost:3000 (Portal)
   └─> Middleware checks authentication
   └─> Not authenticated → Redirect to /sign-in

2. User signs in on Portal
   └─> Clerk creates session
   └─> Session stored in cookies
   └─> User redirected to dashboard

3. User clicks "Electricity Service"
   └─> Opens http://localhost:3001 in new tab

4. Electricity Service middleware runs
   └─> Checks for Clerk session
   └─> Session found! (same cookies)
   └─> User automatically authenticated
   └─> Page loads with user data

5. User's metadata accessed
   └─> Both apps read from same Clerk account
   └─> Data always in sync
```

### Cookie-Based Sessions

**Development (localhost)**:
- Clerk stores session in browser cookies
- Cookies work across all localhost ports (3000, 3001, 3002, etc.)
- No special configuration needed

**Production (subdomains)**:
- Set `NEXT_PUBLIC_CLERK_DOMAIN=smartcity.gov`
- Clerk creates cross-domain cookies
- Works across: portal.smartcity.gov, electricity.smartcity.gov, etc.

### Metadata Synchronization

All services read from the same Clerk account:

```typescript
// Portal updates metadata
await user.update({
  unsafeMetadata: { phone: "+212 612 345 678" }
})

// Electricity service immediately sees the update
const user = await currentUser()
console.log(user.unsafeMetadata.phone) // "+212 612 345 678"
```

**Single source of truth**: Clerk database stores all user data

---

## Adding a New Service

Let's add a "Water Service" step by step.

### Step 1: Create Next.js Project

```bash
cd c:\Users\PC\Desktop\Urbanisation
npx create-next-app@latest water-service --typescript --tailwind --app --no-src-dir
cd water-service
npm install @clerk/nextjs
```

### Step 2: Configure Environment

Create `water-service/.env.local`:

```env
# SAME Clerk keys as portal
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c2luY2VyZS1raXQtNTEuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_JBuvDpahZ8pfmeQd8LoCCECImcalAnVduqRgmMe3ij

# Redirect to portal for authentication
NEXT_PUBLIC_CLERK_SIGN_IN_URL=http://localhost:3000/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=http://localhost:3000/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=http://localhost:3002
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=http://localhost:3002
```

### Step 3: Create Middleware

Create `water-service/proxy.ts`:

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(async (auth) => {
  await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

### Step 4: Setup Layout

Create `water-service/app/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata = {
  title: 'Water Service - Smart City',
  description: 'Manage your water services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### Step 5: Create Main Page

Create `water-service/app/page.tsx`:

```typescript
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function WaterPage() {
  const user = await currentUser()

  if (!user) redirect('/sign-in')

  const userData = {
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    email: user.primaryEmailAddress?.emailAddress,
    nationalId: user.unsafeMetadata?.nationalId as string,
    phone: user.unsafeMetadata?.phone as string,
    address: user.unsafeMetadata?.address as string,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <h1 className="text-3xl font-bold p-6">Water Service</h1>
      </header>
      <main className="p-8">
        <h2 className="text-4xl font-bold mb-4">Welcome to Water Service</h2>
        <div className="bg-white rounded-lg border p-6">
          <p>User: {userData.name}</p>
          <p>Email: {userData.email}</p>
          <p className="text-green-600 mt-4">✓ Authenticated via SSO</p>
        </div>
      </main>
    </div>
  )
}
```

### Step 6: Configure Port

Edit `water-service/package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002"
  }
}
```

### Step 7: Update Portal Dashboard

Edit `smart-city-interface/components/dashboard.tsx`:

```typescript
const services = [
  {
    id: "water",
    name: "Water Services",
    description: "Bill payments, consumption tracking",
    icon: Droplets,
    url: process.env.NODE_ENV === 'production'
      ? "https://water.smartcity.gov"
      : "http://localhost:3002",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "electricity",
    name: "Electricity",
    // ... existing electricity service
  },
  // ... other services
]
```

### Step 8: Test

```bash
# Terminal 1: Start portal
cd smart-city-interface
npm run dev

# Terminal 2: Start electricity service
cd electricity-service
npm run dev

# Terminal 3: Start water service
cd water-service
npm run dev
```

1. Visit http://localhost:3000
2. Sign in
3. Click "Water Services" card
4. Should open http://localhost:3002 with user auto-logged in

---

## Key Concepts

### Metadata Types

```typescript
// publicMetadata - Read-only for users
user.publicMetadata = {
  role: 'citizen',  // Set via Clerk Dashboard or Backend API only
}

// unsafeMetadata - User-editable
user.unsafeMetadata = {
  nationalId: 'AB123456',
  phone: '+212 612 345 678',
  address: '123 Main St',
  city: 'Casablanca',
  dateOfBirth: '1990-01-01',
}
```

**Best practice**: Use `unsafeMetadata` for all user-provided data that they should be able to update.

### Authentication Strategies

**Email + Password with Verification**:
```typescript
// Sign up
await signUp.create({ emailAddress, password })
await signUp.prepareEmailAddressVerification()
await signUp.attemptEmailAddressVerification({ code })

// Sign in
await signIn.create({ identifier, password })
await signIn.prepareFirstFactor({ strategy: "email_code" })
await signIn.attemptFirstFactor({ strategy: "email_code", code })
```

**Social OAuth** (optional):
```typescript
await signIn.authenticateWithRedirect({
  strategy: "oauth_google",
  redirectUrl: "/sso-callback",
  redirectUrlComplete: "/"
})
```

### Environment-Specific URLs

```typescript
// Dashboard service configuration
url: process.env.NODE_ENV === 'production'
  ? "https://service.smartcity.gov"  // Production subdomain
  : "http://localhost:3001",         // Development port
```

---

## Code Templates

### Minimal Service Template

**Directory structure**:
```
new-service/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── proxy.ts
├── .env.local
└── package.json
```

**layout.tsx**:
```typescript
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

**proxy.ts**:
```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(async (auth) => {
  await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**page.tsx**:
```typescript
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ServicePage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  return (
    <div>
      <h1>Service Name</h1>
      <p>Welcome, {user.firstName}!</p>
    </div>
  )
}
```

**.env.local**:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=http://localhost:3000/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=http://localhost:3000/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=http://localhost:3XXX
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=http://localhost:3XXX
```

**package.json** (scripts):
```json
{
  "scripts": {
    "dev": "next dev -p 3XXX",
    "build": "next build",
    "start": "next start -p 3XXX"
  }
}
```

---

## Troubleshooting

### Common Issues

**❌ "Not authenticated" when opening service**
- ✅ Verify SAME Clerk keys in both portal and service `.env.local`
- ✅ Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` match exactly

**❌ "Cannot initialize Smart CAPTCHA widget"**
```typescript
// Add this to your sign-in/sign-up forms:
<div id="clerk-captcha"></div>
```

**❌ "public_metadata is not a valid parameter"**
```typescript
// ❌ Wrong
await user.update({
  publicMetadata: { nationalId: 'ABC123' }
})

// ✅ Correct
await user.update({
  unsafeMetadata: { nationalId: 'ABC123' }
})
```

**❌ "Two-factor authentication required"**
- Disable 2FA in Clerk Dashboard → User & Authentication → Multi-factor
- Or implement 2FA flow in your custom forms

**❌ Service redirects to sign-in even when logged in**
- Check `NEXT_PUBLIC_CLERK_SIGN_IN_URL` points to portal
- Verify middleware is using `auth.protect()` correctly
- Clear browser cookies and try again

**❌ Metadata not appearing in service**
- Check onboarding completed and metadata saved
- Verify reading from correct metadata field (`unsafeMetadata`)
- Check Clerk Dashboard → Users → [User] → Metadata

### Debug Tips

**Check user session**:
```typescript
import { auth } from '@clerk/nextjs/server'

export default async function DebugPage() {
  const { userId } = await auth()
  console.log('User ID:', userId)

  const user = await currentUser()
  console.log('User data:', user)
  console.log('Metadata:', user?.unsafeMetadata)
}
```

**Check environment variables**:
```typescript
console.log('Publishable Key:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
console.log('Sign-in URL:', process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL)
```

---

## Security

### Best Practices

**1. Never commit .env.local files**
```gitignore
# .gitignore
.env.local
.env*.local
```

**2. Use environment variables for all secrets**
```typescript
// ❌ Never hardcode
const API_KEY = "sk_test_abc123"

// ✅ Always use env vars
const API_KEY = process.env.CLERK_SECRET_KEY
```

**3. Protect API routes**
```typescript
// app/api/sensitive/route.ts
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Handle authenticated request
}
```

**4. Validate on server components**
```typescript
export default async function ProtectedPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // User guaranteed to be authenticated here
}
```

**5. Sanitize user metadata**
```typescript
// Validate before saving
const phoneRegex = /^\+?[1-9]\d{1,14}$/
if (!phoneRegex.test(phone)) {
  throw new Error('Invalid phone number')
}

await user.update({
  unsafeMetadata: { phone }
})
```

---

## Production Deployment

### Clerk Dashboard Configuration

1. **Navigate to** https://dashboard.clerk.com

2. **Domains section**:
   - Add primary domain: `smartcity.gov`
   - Enable "Cross-origin authentication"
   - Add satellite domains:
     - `portal.smartcity.gov`
     - `electricity.smartcity.gov`
     - `water.smartcity.gov`
     - etc.

3. **Allowed Origins**:
   - Add all service URLs
   - Enable CORS for cross-domain requests

4. **Session Settings**:
   - Enable "Multi-session"
   - Set session lifetime: 7 days (recommended)
   - Configure token refresh settings

### Environment Variables (Production)

**Portal** (`portal.smartcity.gov`):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_XXX
CLERK_SECRET_KEY=sk_live_XXX
NEXT_PUBLIC_CLERK_DOMAIN=smartcity.gov
NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://portal.smartcity.gov/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://portal.smartcity.gov/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=https://portal.smartcity.gov
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=https://portal.smartcity.gov/onboarding
```

**Electricity Service** (`electricity.smartcity.gov`):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_XXX
CLERK_SECRET_KEY=sk_live_XXX
NEXT_PUBLIC_CLERK_DOMAIN=smartcity.gov
NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://portal.smartcity.gov/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://portal.smartcity.gov/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=https://electricity.smartcity.gov
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=https://electricity.smartcity.gov
```

### Testing SSO in Production

1. Deploy all services to their respective subdomains
2. Visit portal: https://portal.smartcity.gov
3. Sign in with test account
4. Click service link → should open https://electricity.smartcity.gov
5. Verify automatic authentication (no sign-in prompt)
6. Verify user data displays correctly

### DNS Configuration

```
portal.smartcity.gov      → Points to portal server
electricity.smartcity.gov → Points to electricity service server
water.smartcity.gov       → Points to water service server
```

### SSL/TLS Certificates

- Use wildcard certificate: `*.smartcity.gov`
- Or individual certificates for each subdomain
- Ensure HTTPS for all services (required for secure cookies)

---

## Summary

### Quick Checklist for Adding a Service

- [ ] Create Next.js project with TypeScript and Tailwind
- [ ] Install `@clerk/nextjs`
- [ ] Create `.env.local` with SAME Clerk keys
- [ ] Set sign-in/sign-up URLs to portal
- [ ] Set after-sign-in URL to this service
- [ ] Create `proxy.ts` with `auth.protect()`
- [ ] Wrap app in `ClerkProvider`
- [ ] Use `currentUser()` to access user data
- [ ] Configure unique port number
- [ ] Add service card to portal dashboard
- [ ] Test SSO flow

### Key Files

**Every service needs**:
1. `.env.local` - Same Clerk keys, unique URLs
2. `proxy.ts` - Route protection
3. `app/layout.tsx` - ClerkProvider
4. `app/page.tsx` - currentUser() usage

**Portal specific**:
1. Sign-in/sign-up pages with Clerk hooks
2. Onboarding page for metadata collection
3. Profile page for metadata updates
4. Dashboard with service links

---

## Additional Resources

- Clerk Documentation: https://clerk.com/docs
- Next.js App Router: https://nextjs.org/docs/app
- Clerk Next.js Guide: https://clerk.com/docs/quickstarts/nextjs

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Maintained by**: Smart City Development Team
