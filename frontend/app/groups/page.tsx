"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Skull, Shield, Activity, Globe } from "lucide-react"
import Link from "next/link"
import { getGroups, formatNumber, type Group } from "@/lib/api"
import { GroupLogo } from "@/components/group-logo"

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeOnly, setActiveOnly] = useState(false)

  useEffect(() => {
    async function fetchGroups() {
      setLoading(true)
      try {
        const res = await getGroups(activeOnly, search || undefined)
        setGroups(res.data)
      } catch (err) {
        console.error("Failed to fetch groups:", err)
      } finally {
        setLoading(false)
      }
    }
    
    const debounce = setTimeout(fetchGroups, 300)
    return () => clearTimeout(debounce)
  }, [activeOnly, search])

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
                  <Shield className="h-10 w-10 text-red-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Ransomware Groups</h1>
                  <p className="text-zinc-400 max-w-xl">
                    Comprehensive database of ransomware threat actors and their operations. 
                    Track group activity, victim counts, and operational status.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-white">{loading ? "..." : formatNumber(groups.length)}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Groups</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-green-500">{loading ? "..." : groups.filter(g => g.is_active).length}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Active</div>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-3xl font-bold text-zinc-400">{loading ? "..." : groups.filter(g => !g.is_active).length}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Inactive</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search groups..." 
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            variant={activeOnly ? "default" : "outline"}
            onClick={() => setActiveOnly(!activeOnly)}
          >
            {activeOnly ? "🟢 Active Only" : "All Groups"}
          </Button>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groups.map((group) => (
              <Link key={group.name} href={`/groups/${group.name}`}>
                <Card className="border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      {/* Group Icon - Logo or initials fallback */}
                      <GroupLogo groupName={group.name} size="lg" />
                      <Badge 
                        variant={group.is_active ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {group.is_active ? "🟢 Active" : "🔴 Inactive"}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-2 capitalize">{group.name}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        Victims: <span className="text-foreground font-medium">{formatNumber(group.victim_count)}</span>
                      </p>
                      <p>
                        Sites: <span className="text-foreground font-medium">{group.locations_count}</span>
                      </p>
                      {group.has_parser && (
                        <p className="text-xs text-green-500">✓ Parser Available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p>No groups found matching your criteria</p>
          </div>
        )}
      </main>
    </div>
  )
}
