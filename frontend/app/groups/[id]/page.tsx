import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, Globe, ImageIcon, ExternalLink, AlertCircle, FileText, Copy, Check, Key } from "lucide-react"
import Link from "next/link"
import { getGroupByName, formatNumber, formatDate, getCountryFlag, getRansomNotesByGroup, getDecryptorByGroup } from "@/lib/api"
import { notFound } from "next/navigation"
import { GroupLogo } from "@/components/group-logo"

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { id } = await params
  
  let groupData
  let ransomNotes: any[] = []
  let decryptor: any = null
  
  try {
    groupData = await getGroupByName(id)
    // Fetch ransom notes and decryptor for this group
    try {
      ransomNotes = await getRansomNotesByGroup(id)
    } catch (e) {
      console.error("Failed to fetch ransom notes:", e)
    }
    try {
      decryptor = await getDecryptorByGroup(id)
    } catch (e) {
      console.error("Failed to fetch decryptor:", e)
    }
  } catch (error) {
    notFound()
  }

  if (!groupData) {
    notFound()
  }

  // Extract locations info
  const locations = groupData.locations || []
  const activeLocations = locations.filter((loc: any) => loc.available)
  const mirrors = locations.map((loc: any) => ({
    url: loc.fqdn || loc.slug,
    status: loc.available ? "active" : "down",
    label: loc.type || "DLS",
    lastUpdate: loc.updated
  }))

  // Get top countries and sectors
  const topCountries = Object.entries(groupData.country_distribution || {})
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5)
    .map(([country]) => country)

  const topSectors = Object.entries(groupData.sector_distribution || {})
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5)
    .map(([sector]) => sector)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/groups" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to Groups
          </Link>
        </div>

        {/* Group Header */}
        <Card className="border-border bg-card mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <GroupLogo groupName={groupData.name} size="xl" />
                <div>
                  <h1 className="text-3xl font-bold mb-2 capitalize">{groupData.name}</h1>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="default" 
                      className={activeLocations.length > 0 
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                      }
                    >
                      {activeLocations.length > 0 ? "🟢 Active" : "🔴 Inactive"}
                    </Badge>
                    {groupData.has_parser && (
                      <Badge variant="outline" className="text-xs">
                        ✓ Parser
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <p className="font-medium capitalize">{activeLocations.length > 0 ? "Active" : "Inactive"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Victims</p>
                <p className="font-medium text-primary text-xl">{formatNumber(groupData.victim_count)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Active Sites</p>
                <p className="font-medium">{activeLocations.length} / {locations.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Has Parser</p>
                <p className="font-medium">{groupData.has_parser ? "Yes" : "No"}</p>
              </div>
            </div>

            {(topCountries.length > 0 || topSectors.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
                {topCountries.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Top Target Countries</p>
                    <div className="flex flex-wrap gap-2">
                      {topCountries.map((country) => (
                        <Badge key={country} variant="outline">
                          {getCountryFlag(country)} {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {topSectors.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Top Target Industries</p>
                    <div className="flex flex-wrap gap-2">
                      {topSectors.map((sector) => (
                        <Badge key={sector} variant="outline">
                          {sector}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Country Distribution */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Country Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(groupData.country_distribution || {}).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(groupData.country_distribution || {})
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 8)
                    .map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between">
                        <span className="text-sm">
                          {getCountryFlag(country)} {country}
                        </span>
                        <span className="text-sm font-medium text-primary">{count as number}</span>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No country data available</p>
              )}
            </CardContent>
          </Card>

          {/* Mirror Status */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Site Locations ({locations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mirrors.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {mirrors.slice(0, 10).map((mirror: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={`h-2 w-2 rounded-full flex-shrink-0 ${mirror.status === "active" ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <code className="text-xs truncate">{mirror.url}</code>
                      </div>
                      <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                        {mirror.label}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No locations available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {groupData.description && (
          <Card className="border-border bg-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {/* Sanitized: render as plain text to prevent XSS */}
                {groupData.description?.replace(/<[^>]*>/g, '') || ''}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Meta info */}
        {groupData.meta && (
          <Card className="border-border bg-card mb-6 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-500">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{groupData.meta}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ransom Notes Section */}
        {ransomNotes.length > 0 && (
          <Card className="border-border bg-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-destructive" />
                Ransom Notes ({ransomNotes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ransomNotes.map((note, idx) => (
                  <div key={note.id || idx} className="border border-border rounded-lg p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="bg-secondary">
                        <FileText className="h-3 w-3 mr-1" />
                        {note.filename}
                      </Badge>
                      {note.file_extensions?.map((ext: string, i: number) => (
                        <Badge key={i} variant="destructive" className="font-mono text-xs">
                          {ext}
                        </Badge>
                      ))}
                      {note.note_title && (
                        <span className="text-xs text-muted-foreground ml-2">{note.note_title}</span>
                      )}
                    </div>
                    <pre className="bg-black/80 text-green-400 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                      {note.note_content}
                    </pre>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/ransom-notes">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View All Ransom Notes
                  </Badge>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Decryptor Section */}
        {decryptor && (
          <Card className="border-green-500/30 bg-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-green-500">
                <Key className="h-5 w-5" />
                Decryptor Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
                <div>
                  <p className="font-semibold">{decryptor.decryptor_name}</p>
                  <p className="text-sm text-muted-foreground">Provider: {decryptor.provider}</p>
                  {decryptor.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{decryptor.notes}</p>
                  )}
                </div>
                <a href={decryptor.download_url} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Get Decryptor
                  </Button>
                </a>
              </div>
              <div className="mt-4">
                <Link href="/decryptors">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    <Key className="h-3 w-3 mr-1" />
                    View All Decryptors
                  </Badge>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Victims */}
        <Card className="border-border bg-card mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Victims ({formatNumber(groupData.victim_count)} total)</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/victims?group=${groupData.name}`}>
                View All
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(groupData.recent_victims || []).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Victim</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(groupData.recent_victims || []).map((victim: any, index: number) => (
                    <TableRow key={index} className="cursor-pointer hover:bg-secondary/50">
                      <TableCell className="font-medium">
                        <div>
                          {victim.post_title}
                          {victim.website && (
                            <div className="text-xs text-muted-foreground">{victim.website}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {victim.country ? (
                          <span>{getCountryFlag(victim.country)} {victim.country}</span>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{victim.activity || "N/A"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(victim.discovered)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent victims</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
