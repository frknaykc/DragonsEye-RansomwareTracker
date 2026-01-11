import { Header } from "@/components/header"
import { StatCard } from "@/components/stat-card"
import { InteractiveWorldMap } from "@/components/interactive-world-map"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  Shield,
  Globe,
  TrendingUp,
  ArrowRight,
  Activity,
  Building2,
  Briefcase,
  Sparkles,
  PieChart,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { getStatsSummary, getVictims, getSectorStats, getDataStatus, formatNumber, formatDate, getCountryFlag } from "@/lib/api"
import { GroupLogoInline } from "@/components/group-logo"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getDashboardData() {
  try {
    console.log("[v0] Starting dashboard data fetch...")
    const [stats, victimsRes, sectorsRes, status] = await Promise.all([
      getStatsSummary(),
      getVictims({ page: 1, limit: 10, sort: "desc" }),
      getSectorStats(8),
      getDataStatus(),
    ])

    console.log("[v0] Dashboard data fetched successfully")
    return { 
      stats, 
      victims: victimsRes.data, 
      sectors: sectorsRes.data,
      lastScrape: status.scheduler?.last_scrape || status.victims?.modified
    }
  } catch (error) {
    console.error("[v0] Failed to fetch dashboard data:", error)
    throw error
  }
}

// Sector bar colors - gradient from red to yellow
const sectorColors = [
  "bg-red-600",
  "bg-red-500",
  "bg-orange-600",
  "bg-orange-500",
  "bg-amber-500",
  "bg-amber-400",
  "bg-yellow-500",
  "bg-yellow-400",
]

export default async function DashboardPage() {
  let dashboardData
  let hasError = false

  try {
    dashboardData = await getDashboardData()
  } catch (error) {
    console.error("[v0] Dashboard error:", error)
    hasError = true
    dashboardData = {
      stats: {
        total_victims: 0,
        total_groups: 0,
        active_groups: 0,
        countries_affected: 0,
        today_new: 0,
        top_group: "N/A",
        top_group_count: 0,
      },
      victims: [],
      sectors: [],
      lastScrape: null,
    }
  }

  const { stats, victims, sectors, lastScrape } = dashboardData
  
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

  const maxSectorPercent = sectors.length > 0 ? Math.max(...sectors.map((s) => s.percentage)) : 100

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        {hasError && (
          <div className="mb-6 p-4 rounded-lg border border-red-900/50 bg-red-950/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-300 mb-1">API Connection Error</h3>
                <p className="text-sm text-red-200/80">Unable to connect to the backend API. Please ensure:</p>
                <ul className="text-sm text-red-200/80 list-disc list-inside mt-2 space-y-1">
                  <li>The API server is running (default: http://localhost:8000)</li>
                  <li>
                    Set <code className="px-1 py-0.5 bg-red-900/50 rounded">NEXT_PUBLIC_API_URL</code> environment
                    variable in the Vars section if using a different URL
                  </li>
                  <li>Check the browser console for detailed error messages</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
          <StatCard title="TOTAL VICTIMS" value={formatNumber(stats.total_victims)} icon={Users} />
          <StatCard
            title="TODAY NEW"
            value={String(stats.today_new)}
            change={stats.today_new > 0 ? `+${stats.today_new}` : undefined}
            icon={TrendingUp}
            trend={stats.today_new > 0 ? "up" : undefined}
          />
          <StatCard title="ACTIVE GROUPS" value={String(stats.active_groups)} icon={Shield} />
          <StatCard title="COUNTRIES" value={String(stats.countries_affected)} icon={Globe} />
          <StatCard
            title="TOP GROUP"
            value={stats.top_group}
            change={`${formatNumber(stats.top_group_count)} victims`}
            icon={Activity}
          />
        </div>

        {/* Map + Sectors Row - Side by Side */}
        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          {/* World Map */}
          <InteractiveWorldMap />

          {/* Sectors Affected */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                Sectors Affected
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {sectors.length > 0 ? (
                <div className="space-y-2">
                  {sectors.map((sector, index) => (
                    <Link key={sector.sector} href={`/industry/${encodeURIComponent(sector.sector)}`} className="block">
                      <div className="space-y-1 hover:opacity-80 transition-opacity cursor-pointer">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium truncate max-w-[180px]">{sector.sector || "Unknown"}</span>
                          <span className="text-muted-foreground font-mono">{sector.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${sectorColors[index] || "bg-zinc-500"}`}
                            style={{ width: `${(sector.percentage / maxSectorPercent) * 100}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">No sector data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Latest Victims */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <CardTitle className="text-base">Latest Victims</CardTitle>
              {lastScrape && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last updated: {formatLastScrape(lastScrape)}</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/victims">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {victims.length > 0 ? (
              <div className="space-y-3">
                {victims.map((victim, index) => {
                  const isAIGenerated = victim.description?.startsWith("[AI generated]")
                  const cleanDescription = isAIGenerated
                    ? victim.description?.replace("[AI generated] ", "")
                    : victim.description

                  return (
                    <div
                      key={`${victim.post_title}-${index}`}
                      className="p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Left side - Main info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                            <Link href={victim._index !== undefined ? `/victims/${victim._index}` : "#"}>
                              <h3 className="font-semibold truncate hover:text-primary cursor-pointer text-sm">
                                {victim.post_title}
                              </h3>
                            </Link>
                          </div>

                          {/* Description */}
                          {cleanDescription && cleanDescription !== "N/A" && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                              {cleanDescription}
                              {isAIGenerated && (
                                <span className="inline-flex items-center ml-1 text-primary">
                                  <Sparkles className="h-3 w-3" />
                                </span>
                              )}
                            </p>
                          )}

                          {/* Tags/Badges */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Link href={`/groups/${victim.group_name}`}>
                              <Badge
                                variant="outline"
                                className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer text-xs py-0 capitalize flex items-center gap-1.5"
                              >
                                <GroupLogoInline groupName={victim.group_name} size="xs" />
                                {victim.group_name}
                              </Badge>
                            </Link>

                            {victim.country && victim.country !== "Unknown" && (
                              <Link href={`/country/${victim.country}`}>
                                <Badge variant="outline" className="bg-secondary text-xs py-0 hover:bg-secondary/80 cursor-pointer">
                                  {getCountryFlag(victim.country)} {victim.country}
                                </Badge>
                              </Link>
                            )}

                            {victim.activity &&
                              victim.activity !== "N/A" &&
                              victim.activity !== "Not Found" &&
                              victim.activity !== "Unknown" && (
                                <Link href={`/industry/${encodeURIComponent(victim.activity)}`}>
                                  <Badge variant="outline" className="bg-secondary text-xs py-0 hover:bg-secondary/80 cursor-pointer">
                                    <Briefcase className="h-3 w-3 mr-1" />
                                    {victim.activity}
                                  </Badge>
                                </Link>
                              )}
                          </div>
                        </div>

                        {/* Right side - Date */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">Discovered</p>
                          <p className="text-xs font-medium">{formatDate(victim.discovered)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No victims data available</p>
                <p className="text-sm mt-2">Make sure the API server is running</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
