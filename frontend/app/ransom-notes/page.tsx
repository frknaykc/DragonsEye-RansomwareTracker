"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog"
import { 
  Collapsible, CollapsibleContent, CollapsibleTrigger 
} from "@/components/ui/collapsible"
import { Search, FileText, Shield, ChevronDown, ChevronRight, Copy, Check, AlertCircle, ScrollText } from "lucide-react"
import { getRansomNotes, getGroups, type RansomNote, type Group } from "@/lib/api"
import Link from "next/link"

export default function RansomNotesPage() {
  const [notes, setNotes] = useState<RansomNote[]>([])
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [selectedNote, setSelectedNote] = useState<RansomNote | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [notesRes, groupsRes] = await Promise.all([
          getRansomNotes(),
          getGroups()
        ])
        setNotes(notesRes.data)
        setAllGroups(groupsRes.data)
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Group notes by group_name
  const notesByGroup = notes.reduce((acc, note) => {
    const group = note.group_name.toLowerCase()
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(note)
    return acc
  }, {} as Record<string, RansomNote[]>)

  // Combine all groups with their notes
  const groupsWithNotes = allGroups.map(group => ({
    name: group.name.toLowerCase(),
    displayName: group.name,
    notes: notesByGroup[group.name.toLowerCase()] || [],
    hasNotes: (notesByGroup[group.name.toLowerCase()] || []).length > 0,
    isActive: group.locations?.some((loc: any) => loc.available) || false
  })).sort((a, b) => {
    if (a.hasNotes && !b.hasNotes) return -1
    if (!a.hasNotes && b.hasNotes) return 1
    return a.name.localeCompare(b.name)
  })

  // Filter groups based on search
  const filteredGroups = groupsWithNotes.filter(group => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      group.name.includes(searchLower) ||
      group.notes.some(note => 
        note.note_title?.toLowerCase().includes(searchLower) ||
        note.filename?.toLowerCase().includes(searchLower) ||
        note.file_extensions?.some(ext => ext.toLowerCase().includes(searchLower))
      )
    )
  })

  const toggleGroup = (groupName: string) => {
    const newOpen = new Set(openGroups)
    if (newOpen.has(groupName)) {
      newOpen.delete(groupName)
    } else {
      newOpen.add(groupName)
    }
    setOpenGroups(newOpen)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const groupsWithNotesCount = groupsWithNotes.filter(g => g.hasNotes).length
  const totalNotes = notes.length
  const totalGroups = allGroups.length

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
                  <ScrollText className="h-6 w-6 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Ransom Notes</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl mb-6">
                Collection of ransom notes from ransomware groups. Analyze threat actor communication patterns, 
                payment demands, and encryption indicators.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-2xl font-bold text-white">{totalGroups}</span>
                  <span className="text-sm text-muted-foreground">Total Groups</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-red-900/30 border border-red-700/30">
                  <span className="text-2xl font-bold text-red-400">{groupsWithNotesCount}</span>
                  <span className="text-sm text-red-300/70">Groups with Notes</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-2xl font-bold text-white">{totalNotes}</span>
                  <span className="text-sm text-muted-foreground">Total Notes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by group name, note title, or file extension..."
                  className="pl-9 bg-secondary"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <Card className="border-border bg-card">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Loading groups and ransom notes...</p>
              </CardContent>
            </Card>
          )}

          {/* Groups List */}
          {!loading && (
            <div className="space-y-2">
              {filteredGroups.map((group) => (
                <Collapsible
                  key={group.name}
                  open={openGroups.has(group.name)}
                  onOpenChange={() => toggleGroup(group.name)}
                >
                  <Card className={`border-border bg-card overflow-hidden ${!group.hasNotes ? 'opacity-60' : ''}`}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover:bg-red-950/20 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          {group.hasNotes ? (
                            openGroups.has(group.name) ? (
                              <ChevronDown className="h-5 w-5 text-red-400" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )
                          ) : (
                            <div className="w-5" />
                          )}
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <Shield className={`h-4 w-4 ${group.isActive ? 'text-red-500' : 'text-muted-foreground'}`} />
                          </div>
                          <span className="font-semibold text-lg capitalize">{group.displayName}</span>
                          {group.isActive && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {group.hasNotes ? (
                            <>
                              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                                {group.notes.length} {group.notes.length === 1 ? 'note' : 'notes'}
                              </Badge>
                              <div className="flex gap-1">
                                {[...new Set(group.notes.flatMap(n => n.file_extensions || []))].slice(0, 3).map((ext, i) => (
                                  <Badge key={i} variant="destructive" className="font-mono text-xs">
                                    {ext}
                                  </Badge>
                                ))}
                                {[...new Set(group.notes.flatMap(n => n.file_extensions || []))].length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{[...new Set(group.notes.flatMap(n => n.file_extensions || []))].length - 3}
                                  </Badge>
                                )}
                              </div>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              No notes yet
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    {group.hasNotes && (
                      <CollapsibleContent>
                        <div className="border-t border-border bg-secondary/20">
                          {group.notes.map((note, idx) => (
                            <div
                              key={note.id || idx}
                              className="flex items-center justify-between p-4 hover:bg-red-950/20 cursor-pointer border-b border-border last:border-b-0 transition-colors"
                              onClick={() => setSelectedNote(note)}
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-red-400" />
                                <div>
                                  <p className="font-medium">{note.note_title || 'Untitled Note'}</p>
                                  <p className="text-sm text-muted-foreground">{note.filename}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {note.file_extensions?.map((ext, i) => (
                                  <Badge key={i} variant="outline" className="font-mono text-xs">
                                    {ext}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    )}

                    {!group.hasNotes && openGroups.has(group.name) && (
                      <CollapsibleContent>
                        <div className="border-t border-border bg-secondary/20 p-6 text-center">
                          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground mb-2">No ransom notes available for this group yet.</p>
                          <Link href={`/groups/${group.name}`}>
                            <Badge variant="outline" className="cursor-pointer hover:bg-red-500/10">
                              View Group Profile →
                            </Badge>
                          </Link>
                        </div>
                      </CollapsibleContent>
                    )}
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredGroups.length === 0 && (
            <Card className="border-border bg-card">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No groups found matching your search.</p>
              </CardContent>
            </Card>
          )}

          {/* Note Detail Modal */}
          <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="bg-gradient-to-r from-red-950/50 to-zinc-900 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <span className="text-red-400 capitalize">{selectedNote?.group_name}</span>
                    <p className="text-sm font-normal text-muted-foreground mt-1">{selectedNote?.note_title}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              {selectedNote && (
                <div className="flex-1 overflow-y-auto pt-4">
                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="bg-secondary">
                      <FileText className="h-3 w-3 mr-1" />
                      {selectedNote.filename}
                    </Badge>
                    {selectedNote.file_extensions?.map((ext, i) => (
                      <Badge key={i} variant="destructive" className="font-mono text-xs">
                        {ext}
                      </Badge>
                    ))}
                  </div>

                  {/* Note Content */}
                  <div className="relative">
                    <pre className="bg-black/90 text-green-400 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-x-auto max-h-[50vh] overflow-y-auto border border-green-900/30">
                      {selectedNote.note_content}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(selectedNote.note_content)}
                      className="absolute top-3 right-3 p-2 bg-secondary/80 rounded hover:bg-secondary transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {/* Timestamps */}
                  {(selectedNote.created_at || selectedNote.updated_at) && (
                    <div className="mt-4 text-xs text-muted-foreground">
                      {selectedNote.created_at && (
                        <p>Created: {new Date(selectedNote.created_at).toLocaleDateString()}</p>
                      )}
                      {selectedNote.updated_at && selectedNote.updated_at !== selectedNote.created_at && (
                        <p>Updated: {new Date(selectedNote.updated_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}
