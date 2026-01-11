import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  History, Sparkles, Bug, Zap, Shield, Globe, 
  Database, FileText, Key, BarChart3, Users, Rocket
} from "lucide-react"

interface ChangelogEntry {
  version: string
  date: string
  type: 'major' | 'minor' | 'patch'
  changes: {
    category: 'feature' | 'improvement' | 'fix' | 'security'
    title: string
    description?: string
  }[]
}

const changelog: ChangelogEntry[] = [
  {
    version: "2.1.0",
    date: "January 2026",
    type: "minor",
    changes: [
      {
        category: "feature",
        title: "FAQ Page",
        description: "Added comprehensive FAQ section with searchable questions"
      },
      {
        category: "feature",
        title: "Changelog Page",
        description: "Track platform updates and new features"
      },
      {
        category: "feature",
        title: "System Status Page",
        description: "Real-time API and system health monitoring"
      },
      {
        category: "feature",
        title: "API Documentation",
        description: "Interactive API documentation in frontend"
      },
      {
        category: "feature",
        title: "STIX Export",
        description: "Export threat data in STIX 2.1 format for SIEM integration"
      },
      {
        category: "feature",
        title: "IOC Page",
        description: "Dedicated page for Indicators of Compromise"
      },
      {
        category: "feature",
        title: "RSS Feed",
        description: "Subscribe to new victim notifications via RSS"
      },
      {
        category: "feature",
        title: "Data Export",
        description: "Export victims and groups data in CSV/JSON formats"
      },
      {
        category: "improvement",
        title: "Disclaimer Banner",
        description: "Added collapsible disclaimer banner on all pages"
      },
    ]
  },
  {
    version: "2.0.0",
    date: "December 2025",
    type: "major",
    changes: [
      {
        category: "feature",
        title: "Complete UI Redesign",
        description: "Modern dark theme with improved user experience"
      },
      {
        category: "feature",
        title: "Interactive World Map",
        description: "Visualize global ransomware attack distribution"
      },
      {
        category: "feature",
        title: "Ransom Notes Database",
        description: "Comprehensive collection of ransom notes from all tracked groups"
      },
      {
        category: "feature",
        title: "Decryptors Catalog",
        description: "Free decryption tools with how-to guides and provider information"
      },
      {
        category: "feature",
        title: "Negotiation Chats",
        description: "Real ransomware negotiation conversations for research"
      },
      {
        category: "feature",
        title: "Admin Panel",
        description: "Manage ransom notes, decryptors, and group profiles"
      },
      {
        category: "feature",
        title: "Group Logos",
        description: "Automatic logo scraping from ransomware leak sites"
      },
      {
        category: "improvement",
        title: "AI Enrichment",
        description: "AI-powered victim descriptions and company information"
      },
      {
        category: "improvement",
        title: "Auto-Update Scheduler",
        description: "Automatic data updates every 30 minutes via Tor"
      },
    ]
  },
  {
    version: "1.5.0",
    date: "October 2025",
    type: "minor",
    changes: [
      {
        category: "feature",
        title: "Country Analysis",
        description: "Dedicated pages for country-specific attack statistics"
      },
      {
        category: "feature",
        title: "Industry Analysis",
        description: "Sector-based threat intelligence and victim tracking"
      },
      {
        category: "feature",
        title: "Statistics Dashboard",
        description: "Comprehensive analytics with trends and charts"
      },
      {
        category: "improvement",
        title: "Search Functionality",
        description: "Enhanced search across victims and groups"
      },
      {
        category: "fix",
        title: "Pagination Issues",
        description: "Fixed edge cases in victim list pagination"
      },
    ]
  },
  {
    version: "1.0.0",
    date: "August 2025",
    type: "major",
    changes: [
      {
        category: "feature",
        title: "Initial Release",
        description: "First public release of Dragons Eye Ransomware Tracker"
      },
      {
        category: "feature",
        title: "Victim Tracking",
        description: "Real-time monitoring of ransomware victims"
      },
      {
        category: "feature",
        title: "Group Profiles",
        description: "Detailed information on ransomware threat actors"
      },
      {
        category: "feature",
        title: "REST API",
        description: "Full API access for programmatic data retrieval"
      },
      {
        category: "feature",
        title: "Tor Integration",
        description: "Automated dark web scraping via Tor network"
      },
    ]
  },
]

const categoryConfig = {
  feature: { icon: Sparkles, color: "bg-red-500/20 text-red-400 border-red-500/30", label: "New" },
  improvement: { icon: Zap, color: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "Improved" },
  fix: { icon: Bug, color: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Fixed" },
  security: { icon: Shield, color: "bg-red-600/20 text-red-400 border-red-600/30", label: "Security" },
}

const versionTypeConfig = {
  major: { color: "bg-red-500 text-white", label: "Major Release" },
  minor: { color: "bg-orange-500 text-white", label: "Minor Release" },
  patch: { color: "bg-zinc-500 text-white", label: "Patch" },
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-950/50 via-zinc-900 to-zinc-950 border border-red-500/20 p-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <History className="h-6 w-6 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Changelog</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                Track all updates, new features, improvements, and bug fixes to the 
                Dragons Eye platform. Stay informed about the latest enhancements.
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-8">
              {changelog.map((release, releaseIndex) => (
                <div key={release.version} className="relative pl-16">
                  {/* Timeline dot */}
                  <div className="absolute left-4 top-3 w-5 h-5 rounded-full bg-primary border-4 border-background" />

                  <Card className="border-border bg-card overflow-hidden">
                    {/* Version Header */}
                    <div className="bg-secondary/30 border-b border-border p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-primary" />
                            <span className="text-2xl font-bold">v{release.version}</span>
                          </div>
                          <Badge className={versionTypeConfig[release.type].color}>
                            {versionTypeConfig[release.type].label}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{release.date}</span>
                      </div>
                    </div>

                    {/* Changes */}
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {release.changes.map((change, changeIndex) => {
                          const config = categoryConfig[change.category]
                          const Icon = config.icon
                          
                          return (
                            <div 
                              key={changeIndex} 
                              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors"
                            >
                              <div className={`p-1.5 rounded-md ${config.color.split(' ')[0]}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className={`text-xs ${config.color}`}>
                                    {config.label}
                                  </Badge>
                                  <span className="font-medium">{change.title}</span>
                                </div>
                                {change.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {change.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Want to suggest a feature or report a bug?{" "}
                <a 
                  href="mailto:support@dragons.community" 
                  className="text-primary hover:underline"
                >
                  Contact us
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

