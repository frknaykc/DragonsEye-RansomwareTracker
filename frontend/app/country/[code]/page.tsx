"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Globe, Users, Shield, Building2, ArrowLeft, TrendingUp, Loader2 } from "lucide-react"
import Link from "next/link"
import { getVictims, formatNumber, formatDate, getCountryFlag, getCountryName, type Victim } from "@/lib/api"

export default function CountryDetailPage() {
  const params = useParams()
  const countryCode = params.code as string
  
  const [victims, setVictims] = useState<Victim[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [groupStats, setGroupStats] = useState<Record<string, number>>({})
  const [sectorStats, setSectorStats] = useState<Record<string, number>>({})
  const limit = 25

  const fetchVictims = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getVictims({ 
        page, 
        limit, 
        country: countryCode.toUpperCase(),
        sort: 'desc'
      })
      setVictims(res.data)
      setTotalPages(res.pages)
      setTotal(res.total)

      // Calculate group and sector stats from victims
      const gStats: Record<string, number> = {}
      const sStats: Record<string, number> = {}
      res.data.forEach(v => {
        if (v.group_name) gStats[v.group_name] = (gStats[v.group_name] || 0) + 1
        if (v.activity && v.activity !== 'N/A' && v.activity !== 'Unknown' && v.activity !== 'Not Found') {
          sStats[v.activity] = (sStats[v.activity] || 0) + 1
        }
      })
      setGroupStats(gStats)
      setSectorStats(sStats)
    } catch (err) {
      console.error("Failed to fetch victims:", err)
    } finally {
      setLoading(false)
    }
  }, [page, countryCode, limit])

  useEffect(() => {
    fetchVictims()
  }, [fetchVictims])

  const countryName = getCountryName(countryCode)
  const countryFlag = getCountryFlag(countryCode)
  const topGroups = Object.entries(groupStats).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topSectors = Object.entries(sectorStats).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        {/* Back Button */}
        <Link href="/country" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Countries
        </Link>

        {/* Hero Section */}
        <Card className="border-red-900/30 bg-gradient-to-br from-zinc-900 via-red-950/20 to-zinc-900 mb-8 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl bg-red-600/20 border border-red-500/30 text-5xl">
                  {countryFlag}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{countryName}</h1>
                  <p className="text-zinc-400 max-w-xl">
                    Detailed ransomware attack analysis for {countryName}. 
                    Track threat actors, affected industries, and attack timeline.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-white">{formatNumber(total)}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Victims</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-red-500">{Object.keys(groupStats).length}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Threat Actors</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-zinc-400">{Object.keys(sectorStats).length}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Industries</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Top Groups */}
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Top Threat Actors
              </h3>
              {topGroups.length > 0 ? (
                <div className="space-y-3">
                  {topGroups.map(([group, count], index) => (
                    <Link key={group} href={`/groups/${group}`} className="block">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-5">#{index + 1}</span>
                          <span className="font-medium capitalize">{group}</span>
                        </div>
                        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                          {count} attacks
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No group data available</p>
              )}
            </CardContent>
          </Card>

          {/* Top Industries */}
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-red-500" />
                Affected Industries
              </h3>
              {topSectors.length > 0 ? (
                <div className="space-y-3">
                  {topSectors.map(([sector, count], index) => (
                    <Link key={sector} href={`/industry/${encodeURIComponent(sector)}`} className="block">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-5">#{index + 1}</span>
                          <span className="font-medium">{sector}</span>
                        </div>
                        <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30">
                          {count} attacks
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No industry data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Victims Table */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-red-500" />
              Victims in {countryName}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({formatNumber(total)} total)
              </span>
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Victim</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {victims.map((victim, index) => (
                    <TableRow 
                      key={`${victim.post_title}-${index}`} 
                      className="cursor-pointer hover:bg-secondary/50"
                    >
                      <TableCell className="font-medium">
                        <Link href={victim._index !== undefined ? `/victims/${victim._index}` : '#'}>
                          <div>
                            <div className="font-medium hover:text-primary">{victim.post_title}</div>
                            {victim.website && (
                              <div className="text-xs text-muted-foreground">{victim.website}</div>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/groups/${victim.group_name}`}>
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors capitalize">
                            {victim.group_name}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {victim.activity && victim.activity !== 'N/A' && victim.activity !== 'Unknown' && victim.activity !== 'Not Found' ? (
                          <Link href={`/industry/${encodeURIComponent(victim.activity)}`}>
                            <span className="text-muted-foreground hover:text-white transition-colors">
                              {victim.activity}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(victim.discovered)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <Button 
                  variant="outline" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                </div>
                <Button 
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

