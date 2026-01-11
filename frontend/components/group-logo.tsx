"use client"

import Image from "next/image"
import { useState } from "react"

// Mapping of group names to their logo files in /images/logos/
const GROUP_LOGOS: Record<string, string> = {
  // Exact matches from the logos folder
  "akira": "akira-ransomware.png",
  "alphv": "alphv.png",
  "blackcat": "alphv.png", // Alias for ALPHV
  "anubis": "anubis.gif",
  "blackshrantac": "blackshrantac-logo.png",
  "brotherhood": "brotherhoodlogo.png",
  "chaos": "chaos-favicon.svg",
  "direwolf": "DireWolf.png",
  "dragonforce": "dragonforce.png",
  "everest": "everest-ransomware.png",
  "thegentlemen": "gentlemen-ransomware.png",
  "the gentlemen": "gentlemen-ransomware.png",
  "gentlemen": "gentlemen-ransomware.png",
  "handala": "handala-ransomware.png",
  "incransom": "incransom.png",
  "inc ransom": "incransom.png",
  "interlock": "interlock-ransomware.gif",
  "lynx": "lynx-ransomware.svg",
  "medusa": "medusa.png",
  "qilin": "qilin-ransomware.png",
  "ransomhouse": "ransomhouse.png",
  "rhysida": "rhysida.ico",
  "sicarii": "sicarilogo.png",
  "sinobi": "sinobi-ransomware.png",
}

// Get logo URL for a group
export function getGroupLogoUrl(groupName: string): string | null {
  const normalizedName = groupName.toLowerCase().trim()
  const logoFile = GROUP_LOGOS[normalizedName]
  
  if (logoFile) {
    return `/images/logos/${logoFile}`
  }
  return null
}

// Get initials for groups without logos
function getGroupInitials(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, '')
  return clean.substring(0, 2).toUpperCase()
}

interface GroupLogoProps {
  groupName: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  showFallback?: boolean
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
}

const imageSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
}

export function GroupLogo({ groupName, size = "md", className = "", showFallback = true }: GroupLogoProps) {
  const [imageError, setImageError] = useState(false)
  const logoUrl = getGroupLogoUrl(groupName)
  const sizeClass = sizeClasses[size]
  const imageSize = imageSizes[size]

  // If we have a logo and no error loading it
  if (logoUrl && !imageError) {
    return (
      <div 
        className={`relative overflow-hidden rounded-lg bg-zinc-900/50 flex items-center justify-center ${sizeClass} ${className}`}
      >
        <Image
          src={logoUrl}
          alt={`${groupName} logo`}
          width={imageSize}
          height={imageSize}
          className="object-contain p-0.5"
          onError={() => setImageError(true)}
          unoptimized // For SVG and ICO files
        />
      </div>
    )
  }

  // Fallback to initials
  if (showFallback) {
    return (
      <div 
        className={`rounded-lg bg-red-600 flex items-center justify-center text-white font-bold shadow-lg ${sizeClass} ${className}`}
      >
        {getGroupInitials(groupName)}
      </div>
    )
  }

  return null
}

// Simple inline version for tables
export function GroupLogoInline({ groupName, size = "sm" }: { groupName: string; size?: "xs" | "sm" | "md" }) {
  const logoUrl = getGroupLogoUrl(groupName)
  const [imageError, setImageError] = useState(false)
  const imageSize = imageSizes[size]

  if (logoUrl && !imageError) {
    return (
      <Image
        src={logoUrl}
        alt={`${groupName} logo`}
        width={imageSize}
        height={imageSize}
        className="object-contain rounded"
        onError={() => setImageError(true)}
        unoptimized
      />
    )
  }

  // Fallback - small colored square with initial
  return (
    <div 
      className={`${sizeClasses[size]} rounded bg-red-600 flex items-center justify-center text-white font-bold`}
    >
      {groupName.charAt(0).toUpperCase()}
    </div>
  )
}

// Export the mapping for external use
export { GROUP_LOGOS }

