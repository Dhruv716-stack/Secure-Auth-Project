"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export const ProtectedRoute = ({ children, redirectTo = '/login' }: ProtectedRouteProps) => {
  const { isLoggedIn, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push(redirectTo)
    }
  }, [isLoggedIn, isLoading, router, redirectTo])

  return (
    <>
      {/* Always render children, but overlay loading or access denied UI if needed */}
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        </div>
      )}
      {!isLoading && !isLoggedIn && (
        <div className="fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                You need to be logged in to access this page. Please sign in to continue.
              </p>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => router.push("/login")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Sign In
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/")}
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
} 