"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Eye, EyeOff, Shield, ArrowLeft, Lock, User, Mail, Smartphone } from "lucide-react"
import { AuthRedirect } from "@/components/AuthRedirect"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    customerId: "",
    password: "",
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(3)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{customerId?: string, password?: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
    if (error) setError("")
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, rememberMe: checked }))
  }

  const validateForm = () => {
    let valid = true;
    const errors: {customerId?: string, password?: string} = {};
    if (!formData.customerId.trim()) {
      errors.customerId = "Customer ID is required";
      valid = false;
    } else if (!/^\d{10}$/.test(formData.customerId.trim())) {
      errors.customerId = "Customer ID must be exactly 10 digits";
      valid = false;
    }
    if (!formData.password.trim()) {
      errors.password = "Password is required";
      valid = false;
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      valid = false;
    }
    setFieldErrors(errors);
    if (!valid) setError("Please correct the highlighted fields below.");
    return valid;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    if (isLocked) return
    setIsLoading(true)
    setError("")
    
    try {
      await login(formData.customerId, formData.password)
      setLoginAttempts(0)
      setIsLocked(false)
    } catch (err: any) {
      // Regular login error
      const newAttempts = loginAttempts + 1
      setLoginAttempts(newAttempts)
      if (newAttempts >= 3) {
        setError("Too many failed attempts. Please try again later.")
        setIsLocked(true)
      } else {
        setError((err.message || "Login failed.") + ` ${3 - newAttempts} attempts remaining.`)
      }
    }
    setIsLoading(false)
  }

  return (
    <AuthRedirect>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-blue-600">CANARA BANK</h1>
              <p className="text-sm text-yellow-600 font-semibold">Together We Can</p>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Net Banking Login</h2>
          <p className="text-gray-600">Access your account securely</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Secure Login</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer ID Field */}
              <div className="space-y-2">
                <Label htmlFor="customerId" className="text-sm font-medium">
                  Customer ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="customerId"
                    name="customerId"
                    type="text"
                    placeholder="Enter your Customer ID"
                    value={formData.customerId}
                    onChange={handleInputChange}
                    className={`pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.customerId ? 'border-red-500 ring-red-200' : ''}`}
                    disabled={isLoading}
                  />
                  {fieldErrors.customerId && <p className="text-xs text-red-600 mt-1">{fieldErrors.customerId}</p>}
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.password ? 'border-red-500 ring-red-200' : ''}`}
                    disabled={isLoading}
                  />
                  {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={handleCheckboxChange}
                  disabled={isLoading}
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-600">
                  Remember my Customer ID
                </Label>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error} {error.includes('Password') || error.includes('Customer ID') ? '' : 'If you forgot your password, click "Forgot Password" below.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                disabled={isLoading || isLocked}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  "Sign In to Net Banking"
                )}
              </Button>
            </form>

            {/* Additional Links */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <Link href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Forgot Password?
                </Link>
                <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign Up
                </Link>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Need help? Contact us</p>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Smartphone className="h-3 w-3" />
                    <span>1800-425-0018</span>
                  </div>
                  <span>•</span>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Security Notice</p>
              <p className="text-blue-700">
                Never share your login credentials. Canara Bank will never ask for your password via email or phone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthRedirect>
  )
} 