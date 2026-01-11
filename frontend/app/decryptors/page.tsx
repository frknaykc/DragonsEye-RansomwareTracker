"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Key, Shield, ExternalLink, Download, AlertTriangle, CheckCircle2, Info, Unlock, Building2 } from "lucide-react"
import Link from "next/link"
import { getDecryptors, type Decryptor } from "@/lib/api"

export default function DecryptorsPage() {
  const [decryptors, setDecryptors] = useState<Decryptor[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDecryptors() {
      try {
        const res = await getDecryptors()
        setDecryptors(res.data)
      } catch (err) {
        console.error("Failed to fetch decryptors:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDecryptors()
  }, [])

  const filteredDecryptors = decryptors.filter(d => {
    const matchesSearch = 
      d.group_name.toLowerCase().includes(search.toLowerCase()) ||
      d.decryptor_name.toLowerCase().includes(search.toLowerCase()) ||
      d.provider.toLowerCase().includes(search.toLowerCase()) ||
      d.file_extensions.some(ext => ext.toLowerCase().includes(search.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || d.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
      case "limited":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Limited</Badge>
      case "outdated":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30"><Info className="h-3 w-3 mr-1" />Outdated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const activeCount = decryptors.filter(d => d.status === "active").length
  const limitedCount = decryptors.filter(d => d.status === "limited").length
  const providersCount = new Set(decryptors.map(d => d.provider)).size

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-950/50 via-zinc-900 to-zinc-950 border border-green-500/20 p-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Key className="h-6 w-6 text-green-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Decryptors</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl mb-6">
                Free decryption tools for ransomware victims. Always verify downloads from official sources 
                and consult cybersecurity professionals before attempting decryption.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-2xl font-bold text-white">{decryptors.length}</span>
                  <span className="text-sm text-muted-foreground">Total Decryptors</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-green-900/30 border border-green-700/30">
                  <span className="text-2xl font-bold text-green-400">{activeCount}</span>
                  <span className="text-sm text-green-300/70">Active</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-yellow-900/30 border border-yellow-700/30">
                  <span className="text-2xl font-bold text-yellow-400">{limitedCount}</span>
                  <span className="text-sm text-yellow-300/70">Limited</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-2xl font-bold text-white">{providersCount}</span>
                  <span className="text-sm text-muted-foreground">Providers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-500">Important Notice</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Always download decryptors from official sources. Verify the provider and URL before downloading. 
                    Some decryptors only work for specific versions or time periods.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by group, provider, or file extension..."
                    className="pl-9 bg-secondary"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                  >
                    All
                  </Button>
                  <Button 
                    variant={statusFilter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("active")}
                    className={statusFilter === "active" ? "bg-green-600" : ""}
                  >
                    Active
                  </Button>
                  <Button 
                    variant={statusFilter === "limited" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("limited")}
                    className={statusFilter === "limited" ? "bg-yellow-600" : ""}
                  >
                    Limited
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Decryptors Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDecryptors.map((decryptor, index) => (
              <Card key={index} className="border-border bg-card overflow-hidden hover:border-green-500/50 transition-colors">
                <CardHeader className="border-b border-border bg-secondary/30 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Unlock className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <Link href={`/decryptors/${decryptor.id}`}>
                          <CardTitle className="text-base hover:text-green-500 cursor-pointer transition-colors">
                            {decryptor.decryptor_name}
                          </CardTitle>
                        </Link>
                        <Link href={`/groups/${decryptor.group_name}`}>
                          <p className="text-sm text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {decryptor.group_name.toUpperCase()}
                          </p>
                        </Link>
                      </div>
                    </div>
                    {getStatusBadge(decryptor.status)}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{decryptor.description}</p>
                  
                  {/* File Extensions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {decryptor.file_extensions.slice(0, 4).map((ext, i) => (
                      <Badge key={i} variant="outline" className="font-mono text-xs bg-destructive/10 text-destructive border-destructive/30">
                        {ext}
                      </Badge>
                    ))}
                    {decryptor.file_extensions.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{decryptor.file_extensions.length - 4} more
                      </Badge>
                    )}
                  </div>

                  {/* Provider */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> Provider:
                    </span>
                    <span className="text-primary font-medium">{decryptor.provider}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/decryptors/${decryptor.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Info className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </Link>
                    <a 
                      href={decryptor.download_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDecryptors.length === 0 && (
            <Card className="border-border bg-card">
              <CardContent className="p-8 text-center">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No decryptors found matching your search.</p>
              </CardContent>
            </Card>
          )}

          {/* Resources Section */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <a 
                  href="https://www.nomoreransom.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 border border-border rounded-lg hover:border-green-500/50 hover:bg-green-950/20 transition-colors"
                >
                  <h3 className="font-semibold mb-2">No More Ransom</h3>
                  <p className="text-sm text-muted-foreground">Initiative by Europol and security companies with free decryption tools.</p>
                </a>
                <a 
                  href="https://id-ransomware.malwarehunterteam.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 border border-border rounded-lg hover:border-green-500/50 hover:bg-green-950/20 transition-colors"
                >
                  <h3 className="font-semibold mb-2">ID Ransomware</h3>
                  <p className="text-sm text-muted-foreground">Upload a ransom note or encrypted file to identify the ransomware.</p>
                </a>
                <a 
                  href="https://www.emsisoft.com/ransomware-decryption-tools/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 border border-border rounded-lg hover:border-green-500/50 hover:bg-green-950/20 transition-colors"
                >
                  <h3 className="font-semibold mb-2">Emsisoft Decryptors</h3>
                  <p className="text-sm text-muted-foreground">Collection of free decryption tools from Emsisoft.</p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
