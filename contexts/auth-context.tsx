"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useUser, useClerk } from "@clerk/nextjs"

interface User {
  id: string
  name: string
  email: string
  nationalId: string
  phone: string
  address: string
  city: string
  dateOfBirth: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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

  // Deprecated - redirects to sign-in page
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    console.warn('login() is deprecated. Use Clerk sign-in instead.')
    return false
  }, [])

  const logout = useCallback(() => {
    signOut({ redirectUrl: '/sign-in' })
  }, [signOut])

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!clerkUser) return

    try {
      // Split name into first and last name
      let firstName = clerkUser.firstName
      let lastName = clerkUser.lastName

      if (updates.name) {
        const nameParts = updates.name.split(' ')
        firstName = nameParts[0]
        lastName = nameParts.slice(1).join(' ') || ''
      }

      // Update Clerk user metadata
      await clerkUser.update({
        firstName,
        lastName,
        unsafeMetadata: {
          nationalId: updates.nationalId !== undefined ? updates.nationalId : clerkUser.unsafeMetadata?.nationalId,
          phone: updates.phone !== undefined ? updates.phone : clerkUser.unsafeMetadata?.phone,
          address: updates.address !== undefined ? updates.address : clerkUser.unsafeMetadata?.address,
          city: updates.city !== undefined ? updates.city : clerkUser.unsafeMetadata?.city,
          dateOfBirth: updates.dateOfBirth !== undefined ? updates.dateOfBirth : clerkUser.unsafeMetadata?.dateOfBirth,
        }
      })

      // Update local state
      setUser((prev) => (prev ? { ...prev, ...updates } : null))
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }, [clerkUser])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: isSignedIn || false,
      login,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
