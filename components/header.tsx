"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useClaims } from "@/contexts/claims-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, LogOut, User, Bell, Settings, FileText, CheckCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

export default function Header() {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useClaims()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-semibold text-foreground">Smart City</h1>
            <p className="text-xs text-muted-foreground">Citizen Portal</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="font-semibold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-xs text-muted-foreground"
                    onClick={() => markAllNotificationsRead()}
                  >
                    <CheckCheck className="mr-1 h-3 w-3" />
                    Mark all read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications</div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.slice(0, 10).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start gap-1 px-3 py-3 ${!notification.read ? "bg-primary/5" : ""}`}
                      onClick={() => {
                        markNotificationRead(notification.id)
                        router.push("/claims")
                        setNotificationsOpen(false)
                      }}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <span className="font-medium text-foreground">{notification.title}</span>
                        {!notification.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm text-muted-foreground">{notification.message}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
                <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/claims")}>
                <FileText className="mr-2 h-4 w-4" />
                My Claims
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
