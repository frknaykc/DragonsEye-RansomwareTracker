"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Search, Menu, X, Flame, Info, ChevronDown, ChevronUp, Download, FileText, Activity, HelpCircle, History, Code, Crosshair } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [disclaimerExpanded, setDisclaimerExpanded] = useState(false)
  const [disclaimerVisible, setDisclaimerVisible] = useState(true)

  // Check localStorage for disclaimer preference
  useEffect(() => {
    const hidden = localStorage.getItem('disclaimerHidden')
    if (hidden === 'true') {
      setDisclaimerVisible(false)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/victims?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/victims", label: "Victims" },
    { href: "/groups", label: "Groups" },
    { href: "/ransom-notes", label: "Ransom Notes" },
    { href: "/decryptors", label: "Decryptors" },
    { href: "/negotiation", label: "Negotiation" },
    { href: "/ioc", label: "IOC" },
    { href: "/statistics", label: "Statistics" },
  ]

  const moreLinks = [
    { href: "/export", label: "Export & Feeds", icon: Download, description: "CSV, JSON, STIX, RSS" },
    { href: "/api-docs", label: "API Docs", icon: Code, description: "API Documentation" },
    { href: "/status", label: "Status", icon: Activity, description: "System Status" },
    { href: "/faq", label: "FAQ", icon: HelpCircle, description: "Frequently Asked Questions" },
    { href: "/changelog", label: "Changelog", icon: History, description: "Platform Updates" },
  ]

  return (
    <div className="sticky top-0 z-50 w-full px-3 pt-3">
      <header className="mx-auto rounded-2xl border border-red-500/30 bg-red-950/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(220,38,38,0.3)] shadow-red-900/20">
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image 
              src="/hero.svg" 
              alt="Dragons Eye" 
              width={40} 
              height={40}
              className="object-contain drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-white drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">Dragons Eye</span>
              <span className="text-xs text-red-300/70">Ransomware Tracker</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className="px-3 py-2 rounded-lg text-red-100/80 hover:text-white hover:bg-red-500/20 transition-all duration-200 whitespace-nowrap font-semibold"
              >
                {link.label}
              </Link>
            ))}
            
            {/* More Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-red-100/80 hover:text-white hover:bg-red-500/20 transition-all duration-200 whitespace-nowrap font-semibold">
                  More
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900/95 border-red-500/30 backdrop-blur-xl">
                {moreLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className="flex items-center gap-3 cursor-pointer">
                      <link.icon className="h-4 w-4 text-red-400" />
                      <div className="flex flex-col">
                        <span className="font-medium">{link.label}</span>
                        <span className="text-xs text-muted-foreground">{link.description}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {/* Dragons Community Link - Highlighted */}
            <Link 
              href="/about"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-900/30 hover:shadow-red-900/50"
            >
              <Flame className="h-4 w-4" />
              <span>Dragons Community</span>
            </Link>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="relative hidden lg:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-red-300/70" />
              <Input 
                type="search" 
                placeholder="Search victims..." 
                className="w-[180px] pl-9 bg-red-950/50 border-red-500/30 rounded-xl text-white placeholder:text-red-300/50 focus:border-red-400 focus:ring-red-400/20 backdrop-blur-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="lg:hidden text-white hover:bg-red-500/20 rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-red-500/20">
            <nav className="px-6 py-4 flex flex-col gap-1">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-red-300/70" />
                <Input 
                  type="search" 
                  placeholder="Search victims..." 
                  className="w-full pl-9 bg-red-950/50 border-red-500/30 rounded-xl text-white placeholder:text-red-300/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="text-red-100/80 hover:text-white hover:bg-red-500/20 transition-all duration-200 py-2 px-3 rounded-lg font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Divider */}
              <div className="h-px bg-red-500/20 my-2" />

              {/* More Links - Mobile */}
              {moreLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="flex items-center gap-2 text-red-100/80 hover:text-white hover:bg-red-500/20 transition-all duration-200 py-2 px-3 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="h-4 w-4 text-red-400" />
                  <span className="font-semibold">{link.label}</span>
                </Link>
              ))}
              
              {/* Dragons Community - Mobile */}
              <Link 
                href="/about"
                className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Flame className="h-4 w-4" />
                <span>Dragons Community</span>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Disclaimer Banner */}
      {disclaimerVisible && (
        <div className="mx-auto mt-2 rounded-xl border border-amber-500/30 bg-amber-950/40 backdrop-blur-xl shadow-lg overflow-hidden">
          <div 
            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-amber-900/20 transition-colors"
            onClick={() => setDisclaimerExpanded(!disclaimerExpanded)}
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-sm font-semibold text-amber-200">Information & Disclaimer</span>
            </div>
            <div className="flex items-center gap-2">
              {disclaimerExpanded ? (
                <ChevronUp className="h-4 w-4 text-amber-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-amber-400" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDisclaimerVisible(false)
                  localStorage.setItem('disclaimerHidden', 'true')
                }}
                className="text-amber-400/60 hover:text-amber-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {disclaimerExpanded && (
            <div className="px-4 pb-4 pt-2 border-t border-amber-500/20">
              <div className="text-xs text-amber-100/80 space-y-2 leading-relaxed">
                <p>
                  All data presented on this platform has been collected from publicly available sources related to relevant threat actors and compiled using AI-assisted analysis and enrichment techniques.
                </p>
                <p>
                  The content provided is for <span className="text-amber-300 font-medium">informational purposes only</span> and no guarantee is given regarding its accuracy, timeliness, or completeness. If you believe any information is incorrect or incomplete, please contact us.
                </p>
                <p>
                  No responsibility or liability is accepted for any direct or indirect damages arising from the use of the information provided on this platform.
                </p>
                <p className="text-amber-300/90 font-medium">
                  This platform has been developed to contribute to the cybersecurity ecosystem, enhance the traceability of threat actors, and provide reference material for threat researchers and analytical studies.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
