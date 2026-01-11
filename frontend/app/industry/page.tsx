import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Target, TrendingUp } from "lucide-react"
import Link from "next/link"
import { getSectorStats, formatNumber } from "@/lib/api"

export const dynamic = 'force-dynamic'

// Icons for industries
const industryIcons: Record<string, string> = {
  "healthcare": "🏥",
  "technology": "💻",
  "manufacturing": "🏭",
  "financial": "💰",
  "education": "🎓",
  "retail": "🛒",
  "government": "🏛️",
  "energy": "⚡",
  "transportation": "🚚",
  "legal": "⚖️",
  "construction": "🏗️",
  "media": "📺",
  "hospitality": "🏨",
  "real estate": "🏠",
  "insurance": "🛡️",
  "telecom": "📡",
  "agriculture": "🌾",
  "business services": "💼",
  "consumer services": "🛎️",
  "logistics": "📦",
  "unknown": "❓",
  "not found": "❓",
}

function getIndustryIcon(name: string): string {
  const lowerName = name.toLowerCase()
  for (const [key, icon] of Object.entries(industryIcons)) {
    if (lowerName.includes(key)) return icon
  }
  return "📊"
}

async function getIndustriesData() {
  try {
    const res = await getSectorStats(50)
    return res.data
  } catch (error) {
    console.error("Failed to fetch industries:", error)
    return []
  }
}

export default async function IndustryPage() {
  const industries = await getIndustriesData()
  const totalAttacks = industries.reduce((sum, i) => sum + i.count, 0)
  const maxCount = industries.length > 0 ? Math.max(...industries.map(i => i.count)) : 1
  const topIndustry = industries[0]
  const highRiskCount = industries.filter((_, i) => i < 5).length

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
                  <Building2 className="h-10 w-10 text-red-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Industry Analysis</h1>
                  <p className="text-zinc-400 max-w-xl">
                    Ransomware attack distribution across industry sectors. 
                    Identify high-risk industries and track sector-specific threat trends.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-white">{formatNumber(industries.length)}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Industries</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-red-500">{formatNumber(totalAttacks)}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Attacks</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-zinc-400">{topIndustry ? getIndustryIcon(topIndustry.sector) : '📊'}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Most Targeted</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {industries.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry, index) => (
              <Link key={industry.sector} href={`/industry/${encodeURIComponent(industry.sector)}`}>
                <Card className="border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{getIndustryIcon(industry.sector)}</div>
                        <div>
                          <h3 className="text-lg font-bold">{industry.sector || "Unknown"}</h3>
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={index < 3 ? "destructive" : index < 6 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {index < 3 ? "🔥 High" : index < 6 ? "⚠️ Medium" : "Low"}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div className="text-3xl font-bold text-primary">{formatNumber(industry.count)}</div>
                        <div className="text-lg font-semibold">{industry.percentage.toFixed(1)}%</div>
                      </div>
                      <div className="text-sm text-muted-foreground">Total Attacks</div>
                      <div className="w-full bg-secondary rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-primary to-chart-2 h-3 rounded-full transition-all"
                          style={{ width: `${(industry.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p>No industry data available</p>
            <p className="text-sm mt-2">Make sure the API server is running</p>
          </div>
        )}
      </main>
    </div>
  )
}
