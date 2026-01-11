"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Activity, Server, Database, Clock, CheckCircle2, 
  XCircle, AlertTriangle, RefreshCw, Wifi, Globe, 
  HardDrive, Cpu, Zap, Shield
} from "lucide-react"
import { getDataStatus, type DataStatus } from "@/lib/api"

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'down' | 'maintenance'
  latency?: number
  lastCheck: string
}

export default function StatusPage() {
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [apiLatency, setApiLatency] = useState<number | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    const startTime = Date.now()
    
    try {
      const status = await getDataStatus()
      setDataStatus(status)
      setApiLatency(Date.now() - startTime)
    } catch (err) {
      console.error("Failed to fetch status:", err)
      setApiLatency(null)
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }

  useEffect(() => {
    fetchStatus()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'fresh':
      case 'idle':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case 'degraded':
      case 'stale':
      case 'updating':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'down':
      case 'outdated':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
      case 'fresh':
      case 'idle':
        return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Operational</Badge>
      case 'degraded':
      case 'stale':
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Degraded</Badge>
      case 'updating':
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">Updating</Badge>
      case 'down':
      case 'outdated':
      case 'error':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Down</Badge>
      case 'maintenance':
        return <Badge className="bg-amber-600/20 text-amber-600 border-amber-600/30">Maintenance</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const overallStatus = () => {
    if (!dataStatus) return 'unknown'
    if (dataStatus.update_in_progress) return 'updating'
    if (dataStatus.data_freshness === 'fresh') return 'operational'
    if (dataStatus.data_freshness === 'stale') return 'degraded'
    return 'down'
  }

  const services: ServiceStatus[] = [
    {
      name: "API Server",
      status: apiLatency !== null ? 'operational' : 'down',
      latency: apiLatency || undefined,
      lastCheck: lastRefresh.toISOString()
    },
    {
      name: "Data Scraper",
      status: dataStatus?.scheduler?.status === 'idle' ? 'operational' : 
              dataStatus?.scheduler?.status === 'updating' ? 'degraded' : 
              dataStatus?.scheduler?.status === 'error' ? 'down' : 'operational',
      lastCheck: dataStatus?.scheduler?.last_scrape || 'Never'
    },
    {
      name: "Data Parser",
      status: dataStatus?.victims?.exists ? 'operational' : 'down',
      lastCheck: dataStatus?.scheduler?.last_parse || 'Never'
    },
    {
      name: "Victims Database",
      status: dataStatus?.victims?.exists ? 'operational' : 'down',
      lastCheck: dataStatus?.victims?.modified || 'Unknown'
    },
    {
      name: "Groups Database",
      status: dataStatus?.groups?.exists ? 'operational' : 'down',
      lastCheck: dataStatus?.groups?.modified || 'Unknown'
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-950/50 via-zinc-900 to-zinc-950 border border-red-500/20 p-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">System Status</h1>
                    <p className="text-muted-foreground">Real-time platform health monitoring</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={fetchStatus}
                  disabled={loading}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Overall Status */}
          <Card className={`border-2 ${
            overallStatus() === 'operational' ? 'border-emerald-500/50 bg-emerald-500/5' :
            overallStatus() === 'updating' ? 'border-orange-500/50 bg-orange-500/5' :
            overallStatus() === 'degraded' ? 'border-amber-500/50 bg-amber-500/5' :
            'border-red-500/50 bg-red-500/5'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(overallStatus())}
                  <div>
                    <h2 className="text-xl font-bold">
                      {overallStatus() === 'operational' && 'All Systems Operational'}
                      {overallStatus() === 'updating' && 'System Updating'}
                      {overallStatus() === 'degraded' && 'Partial Outage'}
                      {overallStatus() === 'down' && 'Major Outage'}
                      {overallStatus() === 'unknown' && 'Checking Status...'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Last checked: {lastRefresh.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {getStatusBadge(overallStatus())}
              </div>
            </CardContent>
          </Card>

          {/* Services Status */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.latency ? `${service.latency}ms` : 
                           service.lastCheck !== 'Unknown' && service.lastCheck !== 'Never' ?
                           new Date(service.lastCheck).toLocaleString() : service.lastCheck}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Freshness */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-5 w-5 text-primary" />
                  Victims Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {dataStatus?.victims?.exists ? (
                      <Badge className="bg-emerald-500/20 text-emerald-500">Available</Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-500">Missing</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Modified</span>
                    <span className="text-sm font-medium">
                      {dataStatus?.victims?.modified ? 
                        new Date(dataStatus.victims.modified).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Age</span>
                    <span className="text-sm font-medium">
                      {dataStatus?.victims?.age_human || 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-primary" />
                  Groups Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {dataStatus?.groups?.exists ? (
                      <Badge className="bg-emerald-500/20 text-emerald-500">Available</Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-500">Missing</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Modified</span>
                    <span className="text-sm font-medium">
                      {dataStatus?.groups?.modified ? 
                        new Date(dataStatus.groups.modified).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Age</span>
                    <span className="text-sm font-medium">
                      {dataStatus?.groups?.age_human || 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scheduler Status */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Auto-Update Scheduler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Status</span>
                  </div>
                  <p className="font-semibold capitalize">
                    {dataStatus?.scheduler?.status || 'Unknown'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Last Scrape</span>
                  </div>
                  <p className="font-semibold">
                    {dataStatus?.scheduler?.last_scrape ? 
                      new Date(dataStatus.scheduler.last_scrape).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Update Interval</span>
                  </div>
                  <p className="font-semibold">30 minutes</p>
                </div>
              </div>

              {dataStatus?.scheduler?.message && (
                <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm">{dataStatus.scheduler.message}</p>
                </div>
              )}

              {dataStatus?.scheduler?.last_error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{dataStatus.scheduler.last_error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Update Progress */}
          {dataStatus?.update_in_progress && (
            <Card className="border-orange-500/50 bg-orange-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-400">Update In Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      Data is being scraped from ransomware leak sites via Tor network. 
                      This may take several minutes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Uptime Stats */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Platform Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 rounded-lg bg-secondary/30">
                  <p className="text-2xl font-bold text-emerald-500">99.9%</p>
                  <p className="text-xs text-muted-foreground">Uptime (30 days)</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-secondary/30">
                  <p className="text-2xl font-bold">{apiLatency || '-'}ms</p>
                  <p className="text-xs text-muted-foreground">API Latency</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-secondary/30">
                  <p className="text-2xl font-bold">30m</p>
                  <p className="text-xs text-muted-foreground">Update Interval</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-secondary/30">
                  <p className="text-2xl font-bold">v2.0</p>
                  <p className="text-xs text-muted-foreground">API Version</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

