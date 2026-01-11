"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Building2, Shield, Globe, ImageIcon, Loader2, AlertTriangle, Briefcase, MapPin, Calendar, Link as LinkIcon } from "lucide-react"
import Link from "next/link"
import { getVictimById, formatDate, getCountryFlag, type Victim } from "@/lib/api"

export default function VictimDetailPage() {
  const params = useParams()
  const [victim, setVictim] = useState<Victim | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVictim() {
      try {
        setLoading(true)
        const id = parseInt(params.id as string, 10)
        if (isNaN(id)) {
          setError("Invalid victim ID")
          return
        }
        const data = await getVictimById(id)
        setVictim(data)
      } catch (err) {
        console.error("Failed to fetch victim:", err)
        setError("Failed to load victim details")
      } finally {
        setLoading(false)
      }
    }
    fetchVictim()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !victim) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Error</h2>
              <p className="text-muted-foreground">{error || "Victim not found"}</p>
              <Button asChild className="mt-4">
                <Link href="/victims">← Back to Victims</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const isAIGenerated = victim.description?.startsWith('[AI generated]')
  const cleanDescription = isAIGenerated 
    ? victim.description?.replace('[AI generated] ', '') 
    : victim.description

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/victims" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to Victims
          </Link>
        </div>

        {/* Victim Header */}
        <Card className="border-border bg-card mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{victim.post_title}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/groups/${victim.group_name}`}>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer capitalize">
                      <Shield className="h-3 w-3 mr-1" />
                        {victim.group_name}
                      </Badge>
                    </Link>
                    {victim.activity && victim.activity !== "Not Found" && (
                      <Badge variant="outline">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {victim.activity}
                    </Badge>
                    )}
                    {victim.country && (
                    <Badge variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        {getCountryFlag(victim.country)} {victim.country}
                    </Badge>
                    )}
                  </div>
                </div>
              </div>
              {victim.website && victim.website !== "unknown" && (
              <Button variant="outline" size="sm" asChild>
                  <a href={victim.website.startsWith('http') ? victim.website : `https://${victim.website}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Website
                </a>
              </Button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Group
                </p>
                <p className="font-medium capitalize">{victim.group_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> Industry/Sector
                </p>
                <p className="font-medium">{victim.activity || "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Discovered
                </p>
                <p className="font-medium">{formatDate(victim.discovered)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Published
                </p>
                <p className="font-medium">{formatDate(victim.published)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Country
                </p>
                <p className="font-medium">
                  {victim.country ? (
                    <>{getCountryFlag(victim.country)} {victim.country}</>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Website
                </p>
                <p className="font-medium">
                  {victim.website && victim.website !== "unknown" ? (
                    <a 
                      href={victim.website.startsWith('http') ? victim.website : `https://${victim.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {victim.website}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Description */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              {cleanDescription && cleanDescription !== "N/A" ? (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cleanDescription}</p>
                  {isAIGenerated && (
                    <p className="text-xs text-primary mt-4 italic flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                      AI Generated Summary
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description available</p>
              )}
            </CardContent>
          </Card>

          {/* Screenshot */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Leak Page Screenshot
              </CardTitle>
            </CardHeader>
            <CardContent>
              {victim.screenshot ? (
                <img 
                  src={victim.screenshot} 
                  alt={`Screenshot of ${victim.post_title}`}
                  className="w-full rounded-lg border border-border"
                />
              ) : (
              <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Screenshot not available</p>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Extra Information */}
        {victim.infostealer && victim.infostealer.length > 0 && (
          <Card className="border-border bg-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg">🔐 Infostealer Data (Hudson Rock)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {victim.infostealer.map((info, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>{info}</span>
                  </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Post URL */}
        {victim.post_url && (
          <Card className="border-border bg-card">
          <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Original Post URL
              </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="bg-secondary/30 p-4 rounded-lg border border-border font-mono text-sm break-all">
                <p className="text-muted-foreground">{victim.post_url}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">
                ⚠️ This is a .onion URL - requires TOR browser to access
              </p>
          </CardContent>
        </Card>
        )}
      </main>
    </div>
  )
}
