"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Collapsible, CollapsibleContent, CollapsibleTrigger 
} from "@/components/ui/collapsible"
import { 
  Code, Copy, Check, ChevronDown, ExternalLink, 
  Globe, Database, Users, BarChart3, FileText, Key,
  Shield, Activity, Search, Server
} from "lucide-react"

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  parameters?: { name: string; type: string; required: boolean; description: string }[]
  response?: string
  example?: string
}

interface EndpointGroup {
  name: string
  icon: any
  description: string
  endpoints: Endpoint[]
}

const apiGroups: EndpointGroup[] = [
  {
    name: "Health & Status",
    icon: Activity,
    description: "System health and status endpoints",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "API health check - returns basic status",
        response: '{ "status": "online", "service": "Dragons Eye API", "version": "2.0.0" }'
      },
      {
        method: "GET",
        path: "/health",
        description: "Detailed health check with data counts",
        response: '{ "status": "healthy", "victims_count": 15000, "groups_count": 150 }'
      },
      {
        method: "GET",
        path: "/api/v1/status",
        description: "Get data freshness and scheduler status",
        response: '{ "data_freshness": "fresh", "update_in_progress": false, "victims": {...}, "groups": {...}, "scheduler": {...} }'
      },
    ]
  },
  {
    name: "Statistics",
    icon: BarChart3,
    description: "Statistical data and analytics",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/stats/summary",
        description: "Get summary statistics for dashboard",
        response: '{ "total_victims": 15000, "total_groups": 150, "active_groups": 85, "countries_affected": 120, "today_new": 25 }'
      },
      {
        method: "GET",
        path: "/api/v1/stats/countries",
        description: "Get victim statistics by country",
        parameters: [
          { name: "limit", type: "integer", required: false, description: "Number of countries to return (1-100, default: 20)" }
        ],
        response: '{ "total": 15000, "data": [{ "country": "US", "count": 3500, "percentage": 23.3 }] }'
      },
      {
        method: "GET",
        path: "/api/v1/stats/sectors",
        description: "Get victim statistics by sector/industry",
        parameters: [
          { name: "limit", type: "integer", required: false, description: "Number of sectors to return (1-50, default: 15)" }
        ]
      },
      {
        method: "GET",
        path: "/api/v1/stats/groups",
        description: "Get victim statistics by ransomware group",
        parameters: [
          { name: "limit", type: "integer", required: false, description: "Number of groups to return (1-100, default: 20)" }
        ]
      },
      {
        method: "GET",
        path: "/api/v1/stats/trend",
        description: "Get daily victim trend for specified days",
        parameters: [
          { name: "days", type: "integer", required: false, description: "Number of days (7-365, default: 30)" }
        ],
        response: '{ "start_date": "2025-12-01", "end_date": "2025-12-31", "data": [{ "date": "2025-12-01", "count": 15 }] }'
      },
    ]
  },
  {
    name: "Victims",
    icon: Users,
    description: "Ransomware victim data",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/victims",
        description: "List victims with pagination and filters",
        parameters: [
          { name: "page", type: "integer", required: false, description: "Page number (default: 1)" },
          { name: "limit", type: "integer", required: false, description: "Items per page (1-100, default: 25)" },
          { name: "group", type: "string", required: false, description: "Filter by group name" },
          { name: "country", type: "string", required: false, description: "Filter by country code (e.g., US, GB)" },
          { name: "sector", type: "string", required: false, description: "Filter by sector/industry" },
          { name: "search", type: "string", required: false, description: "Search in victim name" },
          { name: "sort", type: "string", required: false, description: "Sort order: asc or desc (default: desc)" },
        ],
        example: "/api/v1/victims?page=1&limit=10&group=lockbit3&country=US"
      },
      {
        method: "GET",
        path: "/api/v1/victims/{index}",
        description: "Get a specific victim by index",
        parameters: [
          { name: "index", type: "integer", required: true, description: "Victim index (0-based)" }
        ]
      },
      {
        method: "GET",
        path: "/api/v1/victims/search/{query}",
        description: "Search victims by name or website",
        parameters: [
          { name: "query", type: "string", required: true, description: "Search query" },
          { name: "limit", type: "integer", required: false, description: "Max results (1-200, default: 50)" },
        ]
      },
    ]
  },
  {
    name: "Groups",
    icon: Shield,
    description: "Ransomware group information",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/groups",
        description: "List all ransomware groups",
        parameters: [
          { name: "active_only", type: "boolean", required: false, description: "Show only active groups" },
          { name: "search", type: "string", required: false, description: "Search by group name" },
        ]
      },
      {
        method: "GET",
        path: "/api/v1/groups/{name}",
        description: "Get detailed information about a specific group",
        parameters: [
          { name: "name", type: "string", required: true, description: "Group name" }
        ],
        response: '{ "name": "lockbit3", "victim_count": 1500, "recent_victims": [...], "country_distribution": {...} }'
      },
      {
        method: "GET",
        path: "/api/v1/groups/{name}/victims",
        description: "Get all victims of a specific group",
        parameters: [
          { name: "name", type: "string", required: true, description: "Group name" },
          { name: "page", type: "integer", required: false, description: "Page number" },
          { name: "limit", type: "integer", required: false, description: "Items per page" },
        ]
      },
    ]
  },
  {
    name: "Ransom Notes",
    icon: FileText,
    description: "Ransom note samples from groups",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/ransom-notes",
        description: "Get all ransom notes",
        parameters: [
          { name: "group", type: "string", required: false, description: "Filter by group name" }
        ]
      },
      {
        method: "GET",
        path: "/api/v1/ransom-notes/{note_id}",
        description: "Get a specific ransom note by ID"
      },
    ]
  },
  {
    name: "Decryptors",
    icon: Key,
    description: "Free decryption tools",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/decryptors",
        description: "Get all decryptors",
        parameters: [
          { name: "status", type: "string", required: false, description: "Filter by status (active, limited, outdated)" },
          { name: "group", type: "string", required: false, description: "Filter by group name" },
        ]
      },
      {
        method: "GET",
        path: "/api/v1/decryptors/{decryptor_id}",
        description: "Get a specific decryptor by ID"
      },
    ]
  },
  {
    name: "Export",
    icon: Database,
    description: "Data export endpoints",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/export/victims/csv",
        description: "Export victims data as CSV",
        parameters: [
          { name: "group", type: "string", required: false, description: "Filter by group" },
          { name: "country", type: "string", required: false, description: "Filter by country" },
          { name: "days", type: "integer", required: false, description: "Last N days only" },
        ]
      },
      {
        method: "GET",
        path: "/api/v1/export/victims/json",
        description: "Export victims data as JSON"
      },
      {
        method: "GET",
        path: "/api/v1/export/victims/stix",
        description: "Export victims data in STIX 2.1 format"
      },
      {
        method: "GET",
        path: "/api/v1/rss/victims",
        description: "RSS feed for new victims"
      },
    ]
  },
]

const methodColors = {
  GET: "bg-red-500/20 text-red-400 border-red-500/30",
  POST: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-600/20 text-red-300 border-red-600/30",
}

export default function APIDocsPage() {
  const [copiedPath, setCopiedPath] = useState<string | null>(null)
  const [baseUrl, setBaseUrl] = useState("http://localhost:8000")
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["Statistics"]))
  const [searchQuery, setSearchQuery] = useState("")

  // Set correct base URL based on environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname.includes('dragons.community') || 
          window.location.hostname.includes('vercel.app')) {
        setBaseUrl('https://ransomwareapi.dragons.community')
      }
    }
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPath(text)
    setTimeout(() => setCopiedPath(null), 2000)
  }

  const toggleGroup = (name: string) => {
    const newOpen = new Set(openGroups)
    if (newOpen.has(name)) {
      newOpen.delete(name)
    } else {
      newOpen.add(name)
    }
    setOpenGroups(newOpen)
  }

  const filteredGroups = apiGroups.map(group => ({
    ...group,
    endpoints: group.endpoints.filter(ep =>
      !searchQuery ||
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.endpoints.length > 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-950/50 via-zinc-900 to-zinc-950 border border-red-500/20 p-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Code className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">API Documentation</h1>
                    <p className="text-muted-foreground">REST API reference for Dragons Eye</p>
                  </div>
                </div>
                <a 
                  href={`${baseUrl}/docs`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Swagger UI
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Base URL */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Server className="h-4 w-4" />
                  Base URL:
                </div>
                <div className="flex-1">
                  <Input 
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="font-mono text-sm bg-secondary"
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(baseUrl)}
                >
                  {copiedPath === baseUrl ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search endpoints..."
              className="pl-9 bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Endpoint Groups */}
          <div className="space-y-4">
            {filteredGroups.map((group) => {
              const Icon = group.icon
              
              return (
                <Collapsible
                  key={group.name}
                  open={openGroups.has(group.name)}
                  onOpenChange={() => toggleGroup(group.name)}
                >
                  <Card className="border-border bg-card overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold">{group.name}</h3>
                            <p className="text-sm text-muted-foreground">{group.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{group.endpoints.length} endpoints</Badge>
                          <ChevronDown className={`h-5 w-5 transition-transform ${openGroups.has(group.name) ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-border">
                        {group.endpoints.map((endpoint, index) => (
                          <div 
                            key={index}
                            className="p-4 border-b border-border last:border-b-0 hover:bg-secondary/20"
                          >
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <Badge className={methodColors[endpoint.method]}>
                                  {endpoint.method}
                                </Badge>
                                <code className="text-sm font-mono bg-secondary px-2 py-1 rounded">
                                  {endpoint.path}
                                </code>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(`${baseUrl}${endpoint.path}`)}
                              >
                                {copiedPath === `${baseUrl}${endpoint.path}` ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {endpoint.description}
                            </p>
                            
                            {endpoint.parameters && endpoint.parameters.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">PARAMETERS</p>
                                <div className="space-y-1">
                                  {endpoint.parameters.map((param, pIndex) => (
                                    <div key={pIndex} className="flex items-start gap-2 text-sm">
                                      <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">
                                        {param.name}
                                      </code>
                                      <span className="text-muted-foreground text-xs">
                                        ({param.type})
                                      </span>
                                      {param.required && (
                                        <Badge variant="outline" className="text-xs h-5">required</Badge>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        - {param.description}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {endpoint.example && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">EXAMPLE</p>
                                <code className="text-xs bg-secondary px-2 py-1 rounded block">
                                  {baseUrl}{endpoint.example}
                                </code>
                              </div>
                            )}

                            {endpoint.response && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">RESPONSE</p>
                                <pre className="text-xs bg-zinc-900 text-green-400 p-2 rounded overflow-x-auto">
                                  {endpoint.response}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })}
          </div>

          {/* Quick Examples */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Quick Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="curl">
                <TabsList>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>
                <TabsContent value="curl" className="mt-4">
                  <pre className="bg-zinc-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`# Get latest victims
curl "${baseUrl}/api/v1/victims?limit=10"

# Get specific group
curl "${baseUrl}/api/v1/groups/lockbit3"

# Get statistics
curl "${baseUrl}/api/v1/stats/summary"

# Export as CSV
curl "${baseUrl}/api/v1/export/victims/csv" -o victims.csv`}
                  </pre>
                </TabsContent>
                <TabsContent value="python" className="mt-4">
                  <pre className="bg-zinc-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`import requests

BASE_URL = "${baseUrl}"

# Get latest victims
response = requests.get(f"{BASE_URL}/api/v1/victims", params={
    "limit": 10,
    "sort": "desc"
})
victims = response.json()

# Get group details
group = requests.get(f"{BASE_URL}/api/v1/groups/lockbit3").json()

# Get statistics
stats = requests.get(f"{BASE_URL}/api/v1/stats/summary").json()
print(f"Total victims: {stats['total_victims']}")`}
                  </pre>
                </TabsContent>
                <TabsContent value="javascript" className="mt-4">
                  <pre className="bg-zinc-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`const BASE_URL = "${baseUrl}";

// Get latest victims
const victimsRes = await fetch(\`\${BASE_URL}/api/v1/victims?limit=10\`);
const victims = await victimsRes.json();

// Get group details
const groupRes = await fetch(\`\${BASE_URL}/api/v1/groups/lockbit3\`);
const group = await groupRes.json();

// Get statistics
const statsRes = await fetch(\`\${BASE_URL}/api/v1/stats/summary\`);
const stats = await statsRes.json();
console.log(\`Total victims: \${stats.total_victims}\`);`}
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Rate Limits */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-400">Rate Limiting</p>
                  <p className="text-sm text-muted-foreground">
                    API requests are rate limited. If you receive a 429 status code, please wait before making additional requests.
                    For higher rate limits, contact us at support@dragons.community.
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

