"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { 
  Crosshair, Search, Download, Copy, Check, Globe, 
  FileText, Shield, Hash, Link as LinkIcon, AlertTriangle,
  Filter, ExternalLink, Loader2
} from "lucide-react"
import { getGroups, getRansomNotes, type Group, type RansomNote } from "@/lib/api"

interface IOC {
  type: 'domain' | 'url' | 'file_extension' | 'filename' | 'hash' | 'email'
  value: string
  group: string
  description?: string
  lastSeen?: string
}

export default function IOCPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [ransomNotes, setRansomNotes] = useState<RansomNote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [groupFilter, setGroupFilter] = useState<string>("all")
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [groupsRes, notesRes] = await Promise.all([
          getGroups(),
          getRansomNotes()
        ])
        setGroups(groupsRes.data)
        setRansomNotes(notesRes.data)
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Generate IOCs from groups and ransom notes
  const generateIOCs = (): IOC[] => {
    const iocs: IOC[] = []

    // Extract domains from group locations
    groups.forEach(group => {
      // Add onion domains from locations (if available in group data)
      // For now, we'll show file extensions from ransom notes
    })

    // Extract file extensions and filenames from ransom notes
    ransomNotes.forEach(note => {
      // File extensions
      note.file_extensions?.forEach(ext => {
        iocs.push({
          type: 'file_extension',
          value: ext,
          group: note.group_name,
          description: `Encrypted file extension used by ${note.group_name}`
        })
      })

      // Ransom note filenames
      if (note.filename) {
        iocs.push({
          type: 'filename',
          value: note.filename,
          group: note.group_name,
          description: `Ransom note filename for ${note.group_name}`
        })
      }
    })

    // Deduplicate by value + type + group
    const uniqueIOCs = iocs.filter((ioc, index, self) =>
      index === self.findIndex(i => 
        i.value === ioc.value && i.type === ioc.type && i.group === ioc.group
      )
    )

    return uniqueIOCs
  }

  const allIOCs = generateIOCs()

  // Filter IOCs
  const filteredIOCs = allIOCs.filter(ioc => {
    const matchesSearch = !search || 
      ioc.value.toLowerCase().includes(search.toLowerCase()) ||
      ioc.group.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || ioc.type === typeFilter
    const matchesGroup = groupFilter === "all" || ioc.group.toLowerCase() === groupFilter.toLowerCase()
    return matchesSearch && matchesType && matchesGroup
  })

  // Get unique groups from IOCs
  const uniqueGroups = [...new Set(allIOCs.map(ioc => ioc.group))].sort()

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedValue(value)
    setTimeout(() => setCopiedValue(null), 2000)
  }

  const exportIOCs = (format: 'csv' | 'json' | 'txt') => {
    let content = ''
    let filename = `dragons-eye-iocs-${new Date().toISOString().split('T')[0]}`
    let mimeType = 'text/plain'

    if (format === 'csv') {
      content = 'Type,Value,Group,Description\n'
      filteredIOCs.forEach(ioc => {
        content += `"${ioc.type}","${ioc.value}","${ioc.group}","${ioc.description || ''}"\n`
      })
      filename += '.csv'
      mimeType = 'text/csv'
    } else if (format === 'json') {
      content = JSON.stringify(filteredIOCs, null, 2)
      filename += '.json'
      mimeType = 'application/json'
    } else {
      // Plain text - one IOC per line for easy import to security tools
      filteredIOCs.forEach(ioc => {
        content += `${ioc.value}\n`
      })
      filename += '.txt'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'domain': return <Globe className="h-4 w-4" />
      case 'url': return <LinkIcon className="h-4 w-4" />
      case 'file_extension': return <FileText className="h-4 w-4" />
      case 'filename': return <FileText className="h-4 w-4" />
      case 'hash': return <Hash className="h-4 w-4" />
      default: return <Crosshair className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      domain: "bg-red-500/20 text-red-400 border-red-500/30",
      url: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      file_extension: "bg-red-600/20 text-red-400 border-red-600/30",
      filename: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      hash: "bg-red-700/20 text-red-300 border-red-700/30",
      email: "bg-orange-600/20 text-orange-400 border-orange-600/30",
    }
    return colors[type] || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
  }

  // Count by type
  const typeCounts = allIOCs.reduce((acc, ioc) => {
    acc[ioc.type] = (acc[ioc.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-950/50 via-zinc-900 to-zinc-950 border border-red-500/20 p-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Crosshair className="h-6 w-6 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Indicators of Compromise</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl mb-6">
                Extracted IOCs from ransomware groups including file extensions, ransom note filenames, 
                and other indicators. Export for use in your security tools and SIEM.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-2xl font-bold text-white">{allIOCs.length}</span>
                  <span className="text-sm text-muted-foreground">Total IOCs</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-2xl font-bold text-red-400">{typeCounts.file_extension || 0}</span>
                  <span className="text-sm text-muted-foreground">File Extensions</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-2xl font-bold text-orange-400">{typeCounts.filename || 0}</span>
                  <span className="text-sm text-muted-foreground">Filenames</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-2xl font-bold text-white">{uniqueGroups.length}</span>
                  <span className="text-sm text-muted-foreground">Groups</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-500">Usage Notice</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    These IOCs are extracted from ransomware samples and leak sites. Use them responsibly 
                    for threat hunting and detection. Some IOCs may generate false positives - always validate 
                    before taking action.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters & Search */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search IOCs..."
                    className="pl-9 bg-secondary"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px] bg-secondary">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="IOC Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="file_extension">File Extensions</SelectItem>
                    <SelectItem value="filename">Filenames</SelectItem>
                    <SelectItem value="domain">Domains</SelectItem>
                    <SelectItem value="url">URLs</SelectItem>
                    <SelectItem value="hash">Hashes</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-[180px] bg-secondary">
                    <Shield className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {uniqueGroups.slice(0, 30).map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Export Buttons */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredIOCs.length} of {allIOCs.length} IOCs
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportIOCs('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportIOCs('json')}>
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportIOCs('txt')}>
                <Download className="h-4 w-4 mr-2" />
                TXT
              </Button>
            </div>
          </div>

          {/* IOC Table */}
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
                      <TableHead className="w-[140px]">Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="w-[150px]">Group</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIOCs.slice(0, 100).map((ioc, index) => (
                      <TableRow key={`${ioc.type}-${ioc.value}-${index}`}>
                        <TableCell>
                          <Badge variant="outline" className={getTypeBadge(ioc.type)}>
                            {getTypeIcon(ioc.type)}
                            <span className="ml-1 capitalize">{ioc.type.replace('_', ' ')}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm font-mono bg-secondary px-2 py-1 rounded">
                            {ioc.value}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/10 text-primary capitalize">
                            {ioc.group}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ioc.description}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(ioc.value)}
                          >
                            {copiedValue === ioc.value ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {filteredIOCs.length > 100 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t border-border">
                  Showing first 100 results. Export to get all {filteredIOCs.length} IOCs.
                </div>
              )}
            </CardContent>
          </Card>

          {filteredIOCs.length === 0 && !loading && (
            <Card className="border-border bg-card">
              <CardContent className="p-8 text-center">
                <Crosshair className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No IOCs found matching your criteria.</p>
              </CardContent>
            </Card>
          )}

          {/* Integration Guide */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary" />
                Integration Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border border-border rounded-lg">
                  <h3 className="font-semibold mb-2">SIEM Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Export as CSV and import into your SIEM for automated detection rules.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <h3 className="font-semibold mb-2">EDR/XDR</h3>
                  <p className="text-sm text-muted-foreground">
                    Use file extensions to create file monitoring rules and alerts.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <h3 className="font-semibold mb-2">Threat Hunting</h3>
                  <p className="text-sm text-muted-foreground">
                    Search for these indicators in your environment logs and file systems.
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

