import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Globe, TrendingUp, MapPin } from "lucide-react"
import Link from "next/link"
import { getCountryStats, formatNumber, getCountryFlag, getCountryName } from "@/lib/api"

export const dynamic = 'force-dynamic'

async function getCountriesData() {
  try {
    const res = await getCountryStats(100)
    return res.data.filter(c => c.country && c.country !== "Unknown")
  } catch (error) {
    console.error("Failed to fetch countries:", error)
    return []
  }
}

export default async function CountryPage() {
  const countries = await getCountriesData()
  const totalAttacks = countries.reduce((sum, c) => sum + c.count, 0)
  const topCountry = countries[0]

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
                  <Globe className="h-10 w-10 text-red-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Country Analysis</h1>
                  <p className="text-zinc-400 max-w-xl">
                    Geographic distribution of ransomware attacks worldwide. 
                    Analyze attack patterns and identify high-risk regions.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-white">{formatNumber(countries.length)}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Countries</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-red-500">{formatNumber(totalAttacks)}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Attacks</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-zinc-400">{topCountry ? getCountryFlag(topCountry.country) : '🌍'}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Most Targeted</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {countries.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {countries.map((country, index) => (
              <Link key={country.country} href={`/country/${country.country}`}>
                <Card className="border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{getCountryFlag(country.country)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-bold">{getCountryName(country.country)}</h3>
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-primary">{formatNumber(country.count)}</div>
                          <div className="text-sm text-muted-foreground">Total Attacks</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${country.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold">{country.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p>No country data available</p>
            <p className="text-sm mt-2">Make sure the API server is running</p>
          </div>
        )}
      </main>
    </div>
  )
}
