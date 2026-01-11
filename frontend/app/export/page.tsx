"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { 
  Download, FileJson, FileText, Shield, Database, 
  Globe, Rss, ExternalLink, Copy, Check, AlertTriangle,
  FileSpreadsheet, Code
} from "lucide-react"

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:8000`
  }
  return "http://localhost:8000"
}

export default function ExportPage() {
  const [victimFilters, setVictimFilters] = useState({
    group: "",
    country: "",
    days: "all"
  })
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const buildUrl = (base: string, params: Record<string, string>) => {
    const url = new URL(base)
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== "all") url.searchParams.set(key, value)
    })
    return url.toString()
  }

  const apiBase = getApiBase()

  const exportOptions = [
    {
      title: "Victims CSV",
      description: "Export victim data in CSV format for spreadsheet analysis",
      icon: FileSpreadsheet,
      format: "CSV",
      bgColor: "bg-red-500/20",
      textColor: "text-red-400",
      endpoint: "/api/v1/export/victims/csv",
      filterable: true
    },
    {
      title: "Victims JSON",
      description: "Export victim data in JSON format for programmatic use",
      icon: FileJson,
      format: "JSON",
      bgColor: "bg-orange-500/20",
      textColor: "text-orange-400",
      endpoint: "/api/v1/export/victims/json",
      filterable: true
    },
    {
      title: "Victims STIX",
      description: "Export in STIX 2.1 format for SIEM and threat intelligence platforms",
      icon: Shield,
      format: "STIX",
      bgColor: "bg-red-600/20",
      textColor: "text-red-400",
      endpoint: "/api/v1/export/victims/stix",
      filterable: true
    },
    {
      title: "Groups CSV",
      description: "Export ransomware group information in CSV format",
      icon: FileSpreadsheet,
      format: "CSV",
      bgColor: "bg-amber-500/20",
      textColor: "text-amber-400",
      endpoint: "/api/v1/export/groups/csv",
      filterable: false
    },
  ]

  const rssFeeds = [
    {
      title: "Victims RSS Feed",
      description: "Subscribe to new victim notifications",
      icon: Rss,
      url: `${apiBase}/api/v1/rss/victims`
    },
    {
      title: "Groups RSS Feed",
      description: "Subscribe to group activity updates",
      icon: Rss,
      url: `${apiBase}/api/v1/rss/groups`
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-950/50 via-zinc-900 to-zinc-950 border border-red-500/20 p-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Download className="h-6 w-6 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Export & Feeds</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                Export ransomware threat intelligence data in CSV, JSON, or STIX formats. 
                Subscribe to RSS feeds for real-time updates.
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Export Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Apply filters to customize your export. Leave empty to export all data.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="group">Group Name</Label>
                  <Input
                    id="group"
                    placeholder="e.g., lockbit3"
                    value={victimFilters.group}
                    onChange={(e) => setVictimFilters({ ...victimFilters, group: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country Code</Label>
                  <Input
                    id="country"
                    placeholder="e.g., US, GB, DE"
                    value={victimFilters.country}
                    onChange={(e) => setVictimFilters({ ...victimFilters, country: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Time Range (days)</Label>
                  <Select 
                    value={victimFilters.days} 
                    onValueChange={(v) => setVictimFilters({ ...victimFilters, days: v })}
                  >
                    <SelectTrigger id="days">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <div className="grid gap-6 md:grid-cols-2">
            {exportOptions.map((option, index) => {
              const Icon = option.icon
              const url = option.filterable
                ? buildUrl(`${apiBase}${option.endpoint}`, {
                    group: victimFilters.group,
                    country: victimFilters.country,
                    days: victimFilters.days
                  })
                : `${apiBase}${option.endpoint}`

              return (
                <Card key={index} className="border-border bg-card hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${option.bgColor}`}>
                          <Icon className={`h-6 w-6 ${option.textColor}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{option.title}</h3>
                          <Badge variant="outline" className="mt-1">{option.format}</Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {option.description}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(url)}
                      >
                        {copiedUrl === url ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* RSS Feeds */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rss className="h-5 w-5 text-orange-500" />
                RSS Feeds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Subscribe to RSS feeds to receive real-time updates in your feed reader or integrate with your tools.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {rssFeeds.map((feed, index) => (
                  <div key={index} className="flex flex-col p-4 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <Rss className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">{feed.title}</h4>
                        <p className="text-xs text-muted-foreground">{feed.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-800/50 rounded px-2 py-1 mb-3">
                      <code className="text-xs text-orange-300 flex-1 truncate">{feed.url}</code>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(feed.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(feed.url)}
                      >
                        {copiedUrl === feed.url ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* STIX Information */}
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <Code className="h-5 w-5" />
                About STIX Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                STIX (Structured Threat Information Expression) is a standardized language for sharing 
                cyber threat intelligence. Our STIX 2.1 exports include:
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="font-medium text-sm">Threat Actors</p>
                  <p className="text-xs text-muted-foreground">Ransomware groups as threat actors</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="font-medium text-sm">Incidents</p>
                  <p className="text-xs text-muted-foreground">Victim listings as incidents</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="font-medium text-sm">Relationships</p>
                  <p className="text-xs text-muted-foreground">Attribution between incidents and actors</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Compatible with SIEM platforms, TAXII servers, and threat intelligence platforms that support STIX 2.1.
              </p>
            </CardContent>
          </Card>

          {/* API Integration */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                API Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                For automated exports, use our REST API directly:
              </p>
              <pre className="bg-zinc-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`# Export latest victims as CSV
curl "${apiBase}/api/v1/export/victims/csv" -o victims.csv

# Export with filters
curl "${apiBase}/api/v1/export/victims/json?group=lockbit3&days=30"

# Get STIX bundle
curl "${apiBase}/api/v1/export/victims/stix?days=7" -o threats.json`}
              </pre>
              <p className="text-xs text-muted-foreground mt-4">
                See <a href="/api-docs" className="text-primary hover:underline">API Documentation</a> for more details.
              </p>
            </CardContent>
          </Card>

          {/* Usage Notice */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-400">Data Usage Notice</p>
                  <p className="text-sm text-muted-foreground">
                    Exported data is for authorized cybersecurity research and threat intelligence purposes only. 
                    Please ensure compliance with your organization's policies and applicable regulations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

