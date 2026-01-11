import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Globe, TrendingUp, Users, Shield, Activity, PieChart } from "lucide-react"
import Link from "next/link"
import { 
  getStatsSummary, 
  getGroupStats, 
  getCountryStats, 
  getSectorStats, 
  getTrendStats,
  formatNumber,
  getCountryFlag,
  getCountryName
} from "@/lib/api"

export const dynamic = 'force-dynamic'

async function getStatsData() {
  try {
    const [summary, groups, countries, sectors, trend] = await Promise.all([
      getStatsSummary(),
      getGroupStats(10),
      getCountryStats(10),
      getSectorStats(10),
      getTrendStats(30)
    ])
    return { summary, groups: groups.data, countries: countries.data, sectors: sectors.data, trend: trend.data }
  } catch (error) {
    console.error("Failed to fetch stats:", error)
    return {
      summary: { total_victims: 0, total_groups: 0, active_groups: 0, countries_affected: 0, today_new: 0, top_group: "N/A", top_group_count: 0 },
      groups: [],
      countries: [],
      sectors: [],
      trend: []
    }
  }
}

export default async function StatisticsPage() {
  const { summary, groups, countries, sectors, trend } = await getStatsData()
  
  // Calculate max values for relative bar widths
  const maxGroupCount = groups.length > 0 ? Math.max(...groups.map(g => g.count)) : 1
  const maxCountryCount = countries.length > 0 ? Math.max(...countries.map(c => c.count)) : 1
  const maxTrendCount = trend.length > 0 ? Math.max(...trend.map(t => t.count)) : 1

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
                  <BarChart3 className="h-10 w-10 text-red-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Statistics & Analytics</h1>
                  <p className="text-zinc-400 max-w-xl">
                    Comprehensive ransomware attack analytics, trends, and threat intelligence metrics. 
                    Gain insights into the global ransomware landscape.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-white">{formatNumber(summary.total_victims)}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Victims</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-red-500">{formatNumber(summary.total_groups)}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Groups</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-green-500">{summary.active_groups}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Active</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-zinc-400">{summary.countries_affected}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Countries</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-orange-500">+{summary.today_new}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Today</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attacks Over Time */}
        <Card className="border-border bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Attacks Over Time (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length > 0 ? (
              <>
                <div className="h-[200px] flex items-end gap-1">
                  {trend.map((day, i) => {
                    const height = maxTrendCount > 0 ? (day.count / maxTrendCount) * 100 : 0
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-primary/60 rounded-t transition-all hover:bg-primary cursor-pointer group relative"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day.date}: ${day.count} attacks`}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {day.count}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                  <span>{trend[0]?.date}</span>
                  <span>{trend[trend.length - 1]?.date}</span>
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 10 Groups and Countries */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Top 10 Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groups.length > 0 ? (
                <div className="space-y-4">
                  {groups.map((group, index) => (
                    <Link key={group.group} href={`/groups/${group.group}`} className="block">
                      <div className="space-y-2 hover:opacity-80 transition-opacity">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-6">{index + 1}.</span>
                            <span className="font-medium">{group.group}</span>
                          </div>
                          <span className="text-muted-foreground">{formatNumber(group.count)}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(group.count / maxGroupCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No group data available</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Top 10 Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {countries.length > 0 ? (
                <div className="space-y-4">
                  {countries.map((country, index) => (
                    <Link key={country.country} href={`/country/${country.country}`} className="block">
                      <div className="space-y-2 hover:opacity-80 transition-opacity">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-6">{index + 1}.</span>
                            <span className="font-medium">
                              {getCountryFlag(country.country)} {country.country !== "Unknown" ? getCountryName(country.country) : "Unknown"}
                            </span>
                          </div>
                          <span className="text-muted-foreground">{formatNumber(country.count)}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-chart-2 h-2 rounded-full transition-all"
                            style={{ width: `${(country.count / maxCountryCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No country data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sectors Breakdown */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Sectors Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {sectors.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {sectors.map((sector) => (
                  <Link key={sector.sector} href={`/industry/${encodeURIComponent(sector.sector)}`} className="block">
                    <div className="space-y-2 hover:opacity-80 transition-opacity cursor-pointer">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{sector.sector || "Unknown"}</span>
                        <span className="text-muted-foreground">{sector.percentage.toFixed(1)}% ({formatNumber(sector.count)})</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-chart-3 h-2 rounded-full transition-all"
                          style={{ width: `${sector.percentage}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No sector data available</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
