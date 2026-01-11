"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Grid, List, Loader2, Users, TrendingUp, Globe, Clock } from "lucide-react"
import Link from "next/link"
import { getVictims, getGroups, getCountryStats, getDataStatus, formatDate, formatNumber, getCountryFlag, type Victim } from "@/lib/api"
import { GroupLogoInline } from "@/components/group-logo"

export default function VictimsPage() {
  const [victims, setVictims] = useState<Victim[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [groupFilter, setGroupFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [groups, setGroups] = useState<{name: string}[]>([])
  const [countries, setCountries] = useState<{country: string}[]>([])
  const [lastScrape, setLastScrape] = useState<string | null>(null)
  const limit = 25
  
  // Format last scrape time
  const formatLastScrape = (dateStr: string | null) => {
    if (!dateStr) return "N/A"
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  // Fetch filters data and status
  useEffect(() => {
    async function fetchFilters() {
      try {
        const [groupsRes, countriesRes, statusRes] = await Promise.all([
          getGroups(),
          getCountryStats(50),
          getDataStatus()
        ])
        setGroups(groupsRes.data.slice(0, 20))
        setCountries(countriesRes.data.filter(c => c.country && c.country !== "Unknown"))
        setLastScrape(statusRes.scheduler?.last_scrape || statusRes.victims?.modified || null)
      } catch (err) {
        console.error("Failed to fetch filters:", err)
      }
    }
    fetchFilters()
  }, [])

  // Fetch victims
  const fetchVictims = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit }
      if (search) params.search = search
      if (groupFilter !== "all") params.group = groupFilter
      if (countryFilter !== "all") params.country = countryFilter
      
      const res = await getVictims(params)
      setVictims(res.data)
      setTotalPages(res.pages)
      setTotal(res.total)
    } catch (err) {
      console.error("Failed to fetch victims:", err)
    } finally {
      setLoading(false)
    }
  }, [page, search, groupFilter, countryFilter, limit])

  useEffect(() => {
    fetchVictims()
  }, [fetchVictims])

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleFilterChange = (type: string, value: string) => {
    if (type === "group") setGroupFilter(value)
    if (type === "country") setCountryFilter(value)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        {/* Hero Section */}
        <Card className="border-red-900/30 bg-gradient-to-br from-zinc-900 via-red-950/20 to-zinc-900 mb-8 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl bg-red-600/20 border border-red-500/30">
                  <Users className="h-10 w-10 text-red-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Victims Database</h1>
                  <p className="text-zinc-400 max-w-xl">
                    Comprehensive database of ransomware attack victims. 
                    Search, filter, and analyze attack patterns across organizations worldwide.
                  </p>
                  {lastScrape && (
                    <div className="flex items-center gap-1.5 text-sm text-zinc-500 mt-2">
                      <Clock className="h-4 w-4" />
                      <span>Last scraped: {formatLastScrape(lastScrape)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-white">{formatNumber(total)}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Victims</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-red-500">{formatNumber(totalPages)}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Pages</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-zinc-400">{countries.length}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Countries</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="border-border bg-card mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search victims by name or website..." 
                  className="pl-9 bg-secondary"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={groupFilter} onValueChange={(v) => handleFilterChange("group", v)}>
                  <SelectTrigger className="w-[180px] bg-secondary">
                    <SelectValue placeholder="Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.name} value={g.name}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={countryFilter} onValueChange={(v) => handleFilterChange("country", v)}>
                  <SelectTrigger className="w-[180px] bg-secondary">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map((c) => (
                      <SelectItem key={c.country} value={c.country}>
                        {getCountryFlag(c.country)} {c.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearch("")
                    setGroupFilter("all")
                    setCountryFilter("all")
                    setPage(1)
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `Showing ${((page - 1) * limit) + 1}-${Math.min(page * limit, total)} of ${formatNumber(total)} results`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Victims Table */}
        <Card className="border-border bg-card">
          <CardContent className="p-0">
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
                    <TableHead>Country</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {victims.map((victim, index) => (
                    <TableRow 
                      key={`${victim.post_title}-${index}`} 
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => victim._index !== undefined && (window.location.href = `/victims/${victim._index}`)}
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
                          <span className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors capitalize">
                            <GroupLogoInline groupName={victim.group_name} size="xs" />
                            {victim.group_name}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {victim.country && victim.country !== "Unknown" ? (
                          <Link href={`/country/${victim.country}`} onClick={(e) => e.stopPropagation()}>
                            <span className="hover:text-primary transition-colors" title={victim.country}>
                              {getCountryFlag(victim.country)} {victim.country}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {victim.activity && victim.activity !== "N/A" && victim.activity !== "Unknown" && victim.activity !== "Not Found" ? (
                          <Link href={`/industry/${encodeURIComponent(victim.activity)}`} onClick={(e) => e.stopPropagation()}>
                            <span className="text-muted-foreground hover:text-primary transition-colors">
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
          </CardContent>
        </Card>

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
              {page > 3 && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setPage(1)}>1</Button>
                  {page > 4 && <span className="text-muted-foreground">...</span>}
                </>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                if (pageNum > totalPages) return null
                return (
                  <Button 
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              {page < totalPages - 2 && (
                <>
                  {page < totalPages - 3 && <span className="text-muted-foreground">...</span>}
                  <Button variant="outline" size="sm" onClick={() => setPage(totalPages)}>{totalPages}</Button>
                </>
              )}
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
      </main>
    </div>
  )
}
