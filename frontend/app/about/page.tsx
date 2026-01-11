import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Database, 
  Globe, 
  Activity, 
  Users, 
  Mail, 
  MessageCircle, 
  ExternalLink, 
  Flame,
  Eye,
  Search,
  Server,
  Layers,
  Target,
  FileSearch,
  Building2,
  AtSign,
  User,
  Hash,
  AlertTriangle,
  Zap,
  Lock,
  Network,
  Radar,
  TrendingUp,
  CheckCircle2
} from "lucide-react"
import { getStatsSummary, formatNumber } from "@/lib/api"
import Image from "next/image"
import Link from "next/link"

export const dynamic = 'force-dynamic'

async function getStats() {
  try {
    return await getStatsSummary()
  } catch {
    return null
  }
}

export default async function AboutPage() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Hero Section */}
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
                <Image 
                  src="/hero.svg" 
                  alt="Dragons Eye" 
                  width={140} 
                  height={140}
                  className="relative z-10 drop-shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                />
              </div>
            </div>
            <div>
              <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
                <Zap className="h-3 w-3 mr-1" />
                Platform Ecosystem
              </Badge>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 via-red-400 to-orange-500 bg-clip-text text-transparent">
                Dragons Eye
              </h1>
              <p className="text-2xl font-semibold text-foreground mt-2">
                Ransomware Tracker
              </p>
              <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed">
                Dragons Community's advanced threat intelligence platform for ransomware monitoring
              </p>
            </div>
          </div>

          {/* Platform Overview Card */}
          <Card className="border-border bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 backdrop-blur-sm">
            <CardContent className="p-8">
              <p className="text-lg leading-relaxed text-muted-foreground">
                <span className="text-foreground font-medium">Dragons Eye</span> is the umbrella name for all threat tracking 
                and monitoring tools developed by <span className="text-foreground font-medium">Dragons Community</span>. 
                All modules are built on a shared core infrastructure, delivering centralized access to comprehensive threat intelligence.
              </p>
            </CardContent>
          </Card>

          {/* Live Stats */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-red-500/30 bg-red-500/5">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-red-500">{formatNumber(stats.total_victims)}</div>
                  <div className="text-sm text-muted-foreground">Total Victims Tracked</div>
                </CardContent>
              </Card>
              <Card className="border-red-400/30 bg-red-400/5">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-red-400">{formatNumber(stats.total_groups)}</div>
                  <div className="text-sm text-muted-foreground">Ransomware Groups</div>
                </CardContent>
              </Card>
              <Card className="border-rose-500/30 bg-rose-500/5">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-rose-500">{stats.active_groups}</div>
                  <div className="text-sm text-muted-foreground">Active Groups</div>
                </CardContent>
              </Card>
              <Card className="border-red-300/30 bg-red-300/5">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-red-300">{stats.countries_affected}</div>
                  <div className="text-sm text-muted-foreground">Countries Affected</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Module 1: Ransomware Tracker - LIVE */}
          <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5 overflow-hidden relative">
            <div className="absolute top-4 right-4">
              <Badge className="bg-red-500 text-white">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                LIVE
              </Badge>
            </div>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30">
                  <Target className="h-10 w-10 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-red-400">Ransomware Tracker</CardTitle>
                  <p className="text-muted-foreground">First actively deployed application</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Ransomware Tracker is the first actively deployed application within the Dragons Eye ecosystem, 
                representing the core data collection, processing, and intelligence foundation of the platform.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <Eye className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Dark Web Monitoring</p>
                    <p className="text-sm text-muted-foreground">Monitors ransomware groups' leak sites across the dark web</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <Activity className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Real-time Tracking</p>
                    <p className="text-sm text-muted-foreground">Tracks victims, group activity, and campaign trends in real time</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <Zap className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">AI-Enriched Analysis</p>
                    <p className="text-sm text-muted-foreground">Provides AI-enriched analysis and contextual threat intelligence</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <Globe className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Multi-dimensional Insights</p>
                    <p className="text-sm text-muted-foreground">Geographic, sector-based, and threat actor–centric insights</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Module 2: Leak Tracker - In Development */}
          <Card className="border-red-400/30 bg-gradient-to-br from-red-400/10 to-red-400/5 overflow-hidden relative">
            <div className="absolute top-4 right-4">
              <Badge variant="outline" className="border-red-400/50 text-red-400 bg-red-400/10">
                <Radar className="h-3 w-3 mr-1 animate-pulse" />
                In Development
              </Badge>
            </div>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-red-400/20 border border-red-400/30">
                  <FileSearch className="h-10 w-10 text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-red-300">Leak Tracker & Dark Web Intelligence</CardTitle>
                  <p className="text-muted-foreground">Extending visibility beyond ransomware operations</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Upcoming releases will introduce Leak Tracker and Dark Web Intelligence applications, 
                extending Dragons Eye's visibility beyond ransomware operations.
              </p>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <p className="font-medium mb-3">These modules will focus on monitoring:</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle className="h-4 w-4 text-red-400" />
                    <span>Dark web forums</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-red-400" />
                    <span>Underground marketplaces</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Network className="h-4 w-4 text-red-400" />
                    <span>Threat actor platforms</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">
                The objective is to provide early visibility into data leaks, threat actor activity, and underground ecosystem dynamics.
              </p>
            </CardContent>
          </Card>

          {/* Advanced Search Capabilities */}
          <Card className="border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-500/5">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30">
                  <Search className="h-10 w-10 text-rose-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-rose-400">Advanced Search & Intelligence</CardTitle>
                  <p className="text-muted-foreground">Powerful search across underground sources</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Leak Tracker and Forum / Marketplace modules will support advanced search and monitoring 
                across underground sources using multiple data points.
              </p>
              
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <Hash className="h-5 w-5 text-rose-400" />
                  <span className="text-sm">Keywords</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <Building2 className="h-5 w-5 text-rose-400" />
                  <span className="text-sm">Company names & brands</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <User className="h-5 w-5 text-rose-400" />
                  <span className="text-sm">Usernames</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <AtSign className="h-5 w-5 text-rose-400" />
                  <span className="text-sm">Email addresses</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <Users className="h-5 w-5 text-rose-400" />
                  <span className="text-sm">First & last names</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <Shield className="h-5 w-5 text-rose-400" />
                  <span className="text-sm">Custom IOCs & hashes</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 pt-4">
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <CheckCircle2 className="h-5 w-5 text-rose-400 mb-2" />
                  <p className="font-medium text-sm">Early breach & data leak detection</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <CheckCircle2 className="h-5 w-5 text-rose-400 mb-2" />
                  <p className="font-medium text-sm">Brand & organization monitoring</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <CheckCircle2 className="h-5 w-5 text-rose-400 mb-2" />
                  <p className="font-medium text-sm">Identity & credential exposure tracking</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <CheckCircle2 className="h-5 w-5 text-rose-400 mb-2" />
                  <p className="font-medium text-sm">Proactive threat hunting & correlation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unified Infrastructure */}
          <Card className="border-red-300/30 bg-gradient-to-br from-red-300/10 to-red-300/5">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-red-300/20 border border-red-300/30">
                  <Server className="h-10 w-10 text-red-300" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-red-200">Unified Infrastructure</CardTitle>
                  <p className="text-muted-foreground">Scalable platform architecture</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                All Dragons Eye applications are built on a shared, scalable infrastructure ensuring 
                seamless integration and correlated intelligence.
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <Database className="h-5 w-5 text-red-300 mt-0.5" />
                  <div>
                    <p className="font-medium">Centralized Data Pipelines</p>
                    <p className="text-sm text-muted-foreground">Unified data collection and enrichment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <Layers className="h-5 w-5 text-red-300 mt-0.5" />
                  <div>
                    <p className="font-medium">Correlation Engine</p>
                    <p className="text-sm text-muted-foreground">Unified analysis across data sources</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <Lock className="h-5 w-5 text-red-300 mt-0.5" />
                  <div>
                    <p className="font-medium">Access Control</p>
                    <p className="text-sm text-muted-foreground">Integrated user management</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <Zap className="h-5 w-5 text-red-300 mt-0.5" />
                  <div>
                    <p className="font-medium">API & Automation</p>
                    <p className="text-sm text-muted-foreground">Full API access and automation capabilities</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Long-term Vision */}
          <Card className="border-primary/50 bg-gradient-to-br from-red-500/15 via-red-500/10 to-orange-500/10 overflow-hidden relative">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/30 to-orange-500/30 border border-red-500/30">
                  <Globe className="h-10 w-10 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    One Platform, Full Visibility
                  </CardTitle>
                  <p className="text-muted-foreground">Dragons Community's Long-term Vision</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <p className="text-lg text-muted-foreground leading-relaxed">
                <span className="text-foreground font-medium">Dragons Community</span> is evolving toward a single, 
                unified platform providing access to comprehensive threat intelligence. 
                <span className="text-foreground font-medium"> Dragons Eye</span> is the umbrella name for all tracking 
                and monitoring tools within this ecosystem:
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-300">
                  Ransomware Intelligence
                </Badge>
                <Badge variant="outline" className="border-red-400/30 bg-red-400/10 text-red-300">
                  Data Leak Monitoring
                </Badge>
                <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-300">
                  Dark Web Forums
                </Badge>
                <Badge variant="outline" className="border-red-300/30 bg-red-300/10 text-red-200">
                  Underground Marketplaces
                </Badge>
                <Badge variant="outline" className="border-rose-400/30 bg-rose-400/10 text-rose-300">
                  Threat Actor Ecosystems
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-3 pt-4">
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
                  <Users className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="font-medium text-sm">Community-driven</p>
                  <p className="text-xs text-muted-foreground">Enriched by Dragons Community members</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
                  <TrendingUp className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="font-medium text-sm">Real-world focused</p>
                  <p className="text-xs text-muted-foreground">Shaped by operational needs</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
                  <Shield className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="font-medium text-sm">SOC Ready</p>
                  <p className="text-xs text-muted-foreground">Built for security teams</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 text-center">
                <p className="text-lg font-medium text-white">
                  Dragons Eye is not just a tracking tool — it is being built as a 
                  <span className="text-red-400"> living, community-powered threat intelligence ecosystem</span> by Dragons Community.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dragons Community Section */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Dragons Community</CardTitle>
                  <p className="text-muted-foreground">Where Security Professionals Unite</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Dragons Community</strong> is a private, invitation-only community 
                of cybersecurity professionals, threat researchers, red teamers, and security enthusiasts. Founded with 
                the mission of fostering collaboration and knowledge sharing in the cybersecurity field.
              </p>
              <div className="pt-4">
                <a 
                  href="https://dragons.community" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Globe className="h-5 w-5" />
                  Visit Dragons Community
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-1">Support</p>
                    <a href="mailto:support@dragons.community" className="text-primary hover:underline">
                      support@dragons.community
                    </a>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">Community Channels</p>
                    <div className="flex flex-wrap gap-2">
                      <a 
                        href="https://x.com/DragonsCyberHQ" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                        <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        X (Twitter)
                      </Badge>
                      </a>
                    <a 
                        href="https://github.com/Dragons-Community" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      >
                        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                          <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          GitHub
                        </Badge>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Made by Dragons Community */}
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-muted-foreground flex items-center justify-center gap-2">
                Made with <Flame className="h-4 w-4 text-red-500" /> by
                <a 
                  href="https://dragons.community" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Dragons Community
                </a>
                for the cybersecurity community
              </p>
              <div className="flex items-center justify-center gap-4 pt-2">
                <span className="text-sm text-muted-foreground">Developers:</span>
                <a 
                  href="https://github.com/irem-kaymak" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="text-sm font-medium">I-Rem</span>
                </a>
                <a 
                  href="https://github.com/frknaykc" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="text-sm font-medium">NaxoziwuS</span>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-yellow-500">Disclaimer:</strong> Dragons Eye platform is intended 
                  for authorized cybersecurity research and threat intelligence purposes only. Access is restricted to 
                  Dragons Community members. The developers are not responsible for any misuse of this platform. Always 
                  ensure you comply with all applicable laws and regulations.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
