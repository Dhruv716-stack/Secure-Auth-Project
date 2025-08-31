import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import {
  Building2,
  CreditCard,
  Smartphone,
  Globe,
  Phone,
  MapPin,
  ChevronRight,
  Download,
  FileText,
  Calculator,
  Shield,
  Banknote,
  Home,
  Car,
  GraduationCap,
  Star,
  Zap,
  Users,
  Award,
  CheckCircle,
  TrendingUp,
  Lock,
  Menu,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Header Bar */}
      <div className="bg-blue-600 text-white py-2 md:py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-xs md:text-sm font-medium">
            <div className="flex items-center space-x-4 md:space-x-8">
              <div className="flex items-center space-x-2">
                <Phone className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Customer Care: 1800-425-0018</span>
                <span className="sm:hidden">1800-425-0018</span>
              </div>
              <div className="hidden md:block">IFSC Code: CNRB0000001</div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#" className="hover:text-yellow-300 transition-colors">
                Careers
              </a>
              <a href="#" className="hover:text-yellow-300 transition-colors">
                Tenders
              </a>
              <a href="#" className="hover:text-yellow-300 transition-colors">
                RTI
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <Building2 className="h-5 w-5 md:h-7 md:w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-blue-600">CANARA BANK</h1>
                  <p className="text-xs text-yellow-600 font-semibold">Together We Can</p>
                </div>
              </div>
            </div>

            <nav className="hidden lg:flex items-center space-x-8">
              {["Personal", "Corporate", "NRI", "Digital", "About Us"].map((item) => (
                <button
                  key={item}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-2 md:space-x-3">
              <Link href="/signup">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg md:rounded-xl text-xs md:text-sm px-3 md:px-4"
              >
                  Sign Up
              </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg md:rounded-xl shadow-lg text-xs md:text-sm px-3 md:px-4"
                >
                  Net Banking
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="lg:hidden p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Bank Image */}
      <section className="relative bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center bg-blue-100 rounded-full px-4 md:px-6 py-2 md:py-3 border border-blue-200">
                <Star className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mr-2" />
                <span className="text-blue-700 font-medium text-sm md:text-base">Trusted by 10M+ customers</span>
              </div>

              <div className="space-y-4 md:space-y-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                  Modern Banking
                  <span className="block text-blue-600">Made Simple</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Experience seamless digital banking with advanced fraud detection, secure transactions, and 24/7
                  customer support.
                </p>
              </div>

              {/* Feature Points */}
              <div className="space-y-3 md:space-y-4">
                {["Advanced Fraud Detection", "Real-time Transaction Monitoring", "24/7 Secure Banking"].map(
                  (feature, index) => (
                    <div key={index} className="flex items-center justify-center lg:justify-start space-x-3">
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 font-medium text-sm md:text-base">{feature}</span>
                    </div>
                  ),
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 md:px-8 py-3 md:py-4 text-base md:text-lg shadow-lg w-full sm:w-auto"
                  >
                    Access Net Banking
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl px-6 md:px-8 py-3 md:py-4 text-base md:text-lg w-full sm:w-auto"
                  >
                    Create Account
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl px-6 md:px-8 py-3 md:py-4 text-base md:text-lg w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Download App
                </Button>
              </div>
            </div>

            {/* Right Side - Bank Building Image & Cards */}
            <div className="relative mt-8 lg:mt-0">
              {/* Main Bank Building Image */}
              <div className="relative bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl mx-4 md:mx-0">
                <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                  {/* Bank Building Illustration */}
                  <div className="w-full h-48 md:h-64 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg md:rounded-xl flex items-end justify-center relative overflow-hidden">
                    {/* Building Structure */}
                    <div className="absolute bottom-0 w-full flex justify-center items-end space-x-1 md:space-x-2">
                      {/* Main Building */}
                      <div className="bg-blue-600 w-16 md:w-20 h-24 md:h-32 rounded-t-lg relative">
                        <div className="absolute top-1 md:top-2 left-1 md:left-2 right-1 md:right-2 space-y-1">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex space-x-1">
                              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-300 rounded-sm"></div>
                              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-300 rounded-sm"></div>
                              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-300 rounded-sm"></div>
                            </div>
                          ))}
                        </div>
                        {/* Bank Entrance */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 md:w-8 h-8 md:h-12 bg-yellow-400 rounded-t-lg"></div>
                      </div>

                      {/* Side Buildings */}
                      <div className="bg-blue-500 w-8 md:w-12 h-16 md:h-24 rounded-t-lg">
                        <div className="mt-1 md:mt-2 mx-1 space-y-1">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-200 rounded-sm mx-auto"></div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-blue-700 w-12 md:w-16 h-20 md:h-28 rounded-t-lg">
                        <div className="mt-1 md:mt-2 mx-1 space-y-1">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex space-x-1 justify-center">
                              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-yellow-200 rounded-sm"></div>
                              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-yellow-200 rounded-sm"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Clouds */}
                    <div className="absolute top-2 md:top-4 left-2 md:left-4 w-6 md:w-8 h-3 md:h-4 bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-3 md:top-6 right-3 md:right-6 w-4 md:w-6 h-2 md:h-3 bg-white rounded-full opacity-60"></div>
                  </div>

                  {/* Bank Name */}
                  <div className="text-center mt-3 md:mt-4">
                    <h3 className="text-base md:text-lg font-bold text-blue-600">CANARA BANK</h3>
                    <p className="text-xs md:text-sm text-gray-500">Digital Banking Hub</p>
                  </div>
                </div>
              </div>

              {/* Floating Cards - Hidden on mobile, visible on tablet+ */}
              <div className="hidden md:block">
                <div className="absolute -top-4 -left-4 bg-white rounded-2xl p-3 md:p-4 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Shield className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-gray-900">Secure Banking</p>
                      <p className="text-xs text-gray-500">99.9% Uptime</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-3 md:p-4 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-gray-900">Smart Analytics</p>
                      <p className="text-xs text-gray-500">Real-time Insights</p>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 -right-8 bg-white rounded-2xl p-3 md:p-4 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Lock className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-gray-900">Fraud Detection</p>
                      <p className="text-xs text-gray-500">AI Powered</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Services Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Quick Banking Services</h2>
            <p className="text-gray-600 text-sm md:text-base">Access your most-used banking features instantly</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: CreditCard, label: "Fund Transfer", href: "/login", color: "blue" },
              { icon: FileText, label: "Account Statement", color: "green" },
              { icon: Calculator, label: "EMI Calculator", color: "yellow" },
              { icon: MapPin, label: "Branch Locator", color: "purple" },
            ].map((service, index) => (
              <Link
                key={index}
                href={service.href || "#"}
                className="group p-4 md:p-6 bg-white rounded-xl md:rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all"
              >
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 rounded-lg md:rounded-xl flex items-center justify-center mx-auto md:mx-0 ${
                    service.color === "blue"
                      ? "bg-blue-100 group-hover:bg-blue-600"
                      : service.color === "green"
                        ? "bg-green-100 group-hover:bg-green-600"
                        : service.color === "yellow"
                          ? "bg-yellow-100 group-hover:bg-yellow-600"
                          : "bg-purple-100 group-hover:bg-purple-600"
                  } transition-colors`}
                >
                  <service.icon
                    className={`h-5 w-5 md:h-6 md:w-6 ${
                      service.color === "blue"
                        ? "text-blue-600 group-hover:text-white"
                        : service.color === "green"
                          ? "text-green-600 group-hover:text-white"
                          : service.color === "yellow"
                            ? "text-yellow-600 group-hover:text-white"
                            : "text-purple-600 group-hover:text-white"
                    } transition-colors`}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 text-sm md:text-base text-center md:text-left">
                  {service.label}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Users, value: "10M+", label: "Happy Customers", color: "blue" },
              { icon: Award, value: "115+", label: "Years of Trust", color: "yellow" },
              { icon: Zap, value: "99.9%", label: "Uptime", color: "blue" },
              { icon: Shield, value: "24/7", label: "Security", color: "yellow" },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div
                  className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl flex items-center justify-center ${
                    stat.color === "blue" ? "bg-blue-100" : "bg-yellow-100"
                  } group-hover:scale-110 transition-transform`}
                >
                  <stat.icon
                    className={`h-6 w-6 md:h-8 md:w-8 ${stat.color === "blue" ? "text-blue-600" : "text-yellow-600"}`}
                  />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">Our Banking Services</h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive banking solutions designed to meet all your financial needs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                icon: Banknote,
                title: "Savings Account",
                desc: "High interest savings account with digital banking facilities",
                color: "blue",
              },
              {
                icon: Home,
                title: "Home Loans",
                desc: "Attractive interest rates starting from 8.40% per annum",
                color: "yellow",
              },
              {
                icon: Car,
                title: "Vehicle Loans",
                desc: "Easy financing for your dream car with quick approval",
                color: "blue",
              },
              {
                icon: GraduationCap,
                title: "Education Loans",
                desc: "Fund your education with competitive interest rates",
                color: "yellow",
              },
            ].map((service, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2"
              >
                <CardContent className="p-6 md:p-8 text-center">
                  <div
                    className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 rounded-xl md:rounded-2xl flex items-center justify-center ${
                      service.color === "blue"
                        ? "bg-blue-100 group-hover:bg-blue-600"
                        : "bg-yellow-100 group-hover:bg-yellow-400"
                    } transition-colors`}
                  >
                    <service.icon
                      className={`h-6 w-6 md:h-8 md:w-8 ${
                        service.color === "blue"
                          ? "text-blue-600 group-hover:text-white"
                          : "text-yellow-600 group-hover:text-white"
                      } transition-colors`}
                    />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-gray-900">{service.title}</h3>
                  <p className="text-gray-600 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">{service.desc}</p>
                  <Button
                    variant="link"
                    className={`${service.color === "blue" ? "text-blue-600" : "text-yellow-600"} p-0 font-semibold group-hover:underline text-sm md:text-base`}
                  >
                    Learn More <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Banking Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-blue-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              <div className="space-y-4 md:space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Digital Banking Solutions</h2>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  Experience the future of banking with our comprehensive digital platform. Secure, fast, and available
                  24/7 for all your banking needs.
                </p>
              </div>

              <div className="space-y-3 md:space-y-4">
                {[
                  { icon: Shield, label: "Advanced Security Features", color: "blue" },
                  { icon: Smartphone, label: "Mobile Banking App", color: "yellow" },
                  { icon: Globe, label: "Internet Banking", color: "blue" },
                  { icon: CreditCard, label: "UPI & Digital Payments", color: "yellow" },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-white rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-shadow justify-center lg:justify-start"
                  >
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center ${
                        feature.color === "blue" ? "bg-blue-100" : "bg-yellow-100"
                      }`}
                    >
                      <feature.icon
                        className={`h-5 w-5 md:h-6 md:w-6 ${feature.color === "blue" ? "text-blue-600" : "text-yellow-600"}`}
                      />
                    </div>
                    <span className="text-gray-700 font-semibold text-sm md:text-base">{feature.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 md:px-8 py-3 md:py-4 text-base md:text-lg shadow-lg w-full sm:w-auto"
                  >
                    Access Net Banking
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl px-6 md:px-8 py-3 md:py-4 text-base md:text-lg w-full sm:w-auto"
                  >
                    Create Account
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 rounded-xl px-6 md:px-8 py-3 text-base md:text-lg w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Download App
                </Button>
              </div>
            </div>

            <div className="relative mt-8 lg:mt-0">
              <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  {[
                    { value: "24/7", label: "Banking Services", color: "blue" },
                    { value: "10M+", label: "Digital Users", color: "yellow" },
                    { value: "99.9%", label: "Uptime", color: "blue" },
                    { value: "₹1L+", label: "Daily Limit", color: "yellow" },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className={`p-4 md:p-6 rounded-xl md:rounded-2xl text-center ${stat.color === "blue" ? "bg-blue-50" : "bg-yellow-50"}`}
                    >
                      <div
                        className={`text-2xl md:text-3xl font-bold mb-1 md:mb-2 ${stat.color === "blue" ? "text-blue-600" : "text-yellow-600"}`}
                      >
                        {stat.value}
                      </div>
                      <div className="text-gray-600 font-medium text-xs md:text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 md:mb-12">
            <div className="space-y-4 md:space-y-6 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <Building2 className="h-5 w-5 md:h-7 md:w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold">CANARA BANK</h3>
                  <p className="text-xs md:text-sm text-yellow-400">Together We Can</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                India's leading public sector bank serving customers for over 115 years with trust and excellence.
              </p>
              <div className="flex items-center justify-center md:justify-start space-x-2 text-gray-300">
                <Phone className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                <span className="font-medium text-sm md:text-base">1800-425-0018</span>
              </div>
            </div>

            {[
              {
                title: "Personal Banking",
                links: ["Savings Account", "Current Account", "Fixed Deposits", "Loans", "Credit Cards"],
              },
              {
                title: "Digital Services",
                links: ["Internet Banking", "Mobile Banking", "UPI Services", "Online FD", "Bill Payments"],
              },
              {
                title: "Support",
                links: ["Customer Care", "Branch Locator", "ATM Locator", "Grievance", "Security Tips"],
              },
            ].map((section, index) => (
              <div key={index} className="text-center md:text-left">
                <h4 className="font-bold mb-4 md:mb-6 text-yellow-400 text-sm md:text-base">{section.title}</h4>
                <ul className="space-y-2 md:space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm md:text-base">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-6 md:pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left space-y-4 md:space-y-0">
              <p className="text-gray-400 text-sm">© 2024 Canara Bank. All rights reserved. | DICGC Insured</p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
                {["Privacy Policy", "Terms & Conditions", "Disclaimer"].map((link) => (
                  <a key={link} href="#" className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
