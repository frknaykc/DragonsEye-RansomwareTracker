"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search,
  User,
  Skull,
  ExternalLink,
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  X,
  MessageSquare,
  DollarSign,
  Hash,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ChatItem = {
  group: string
  chatId: string
  messages?: number | null
  initialRansom?: string | null
  negotiatedRansom?: string | null
  paid?: boolean | string | null
  link?: string
}

type ChatMessage = {
  role: string
  content: string
  timestamp?: string
}

type Props = {
  chats: ChatItem[]
}

export default function NegotiationClient({ chats }: Props) {
  const [groupFilter, setGroupFilter] = useState("")
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [loadingChat, setLoadingChat] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [entriesPerGroup, setEntriesPerGroup] = useState(10)
  const [groupPages, setGroupPages] = useState<Record<string, number>>({})

  // Group chats by group name
  const groupedChats = useMemo(() => {
    const grouped: Record<string, ChatItem[]> = {}
    chats.forEach((c) => {
      if (!grouped[c.group]) grouped[c.group] = []
      grouped[c.group].push(c)
    })
    // Sort each group's chats by chatId descending
    Object.keys(grouped).forEach((g) => {
      grouped[g].sort((a, b) => b.chatId.localeCompare(a.chatId))
    })
    return grouped
  }, [chats])

  // Get sorted group names
  const groups = useMemo(() => {
    return Object.keys(groupedChats).sort((a, b) => a.localeCompare(b))
  }, [groupedChats])

  // Filter groups by search query
  const filteredGroups = groups.filter((g) =>
    g.toLowerCase().includes(groupFilter.toLowerCase())
  )

  // Calculate stats for each group
  const getGroupStats = (group: string) => {
    const groupChats = groupedChats[group] || []
    const paidCount = groupChats.filter(c => c.paid === true || c.paid === "true").length
    const totalMessages = groupChats.reduce((sum, c) => sum + (c.messages || 0), 0)
    return { total: groupChats.length, paid: paidCount, messages: totalMessages }
  }

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(group)) {
        newSet.delete(group)
      } else {
        newSet.add(group)
      }
      return newSet
    })
  }

  const openChatModal = async (chat: ChatItem) => {
    setSelectedChat(chat)
    setModalOpen(true)
    setLoadingChat(true)
    setChatMessages([])

    if (chat.link) {
      try {
        let rawUrl = chat.link
        if (rawUrl.includes('github.com') && rawUrl.includes('/blob/')) {
          rawUrl = rawUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
        }
        
        const res = await fetch(rawUrl)
        if (res.ok) {
          const data = await res.json()
          const messages = parseMessages(data)
          setChatMessages(messages)
        }
      } catch (e) {
        console.error('Failed to load chat:', e)
      }
    }
    setLoadingChat(false)
  }

  const parseMessages = (data: any): ChatMessage[] => {
    const mapMessage = (m: any) => ({
      role: m.party || m.role || m.sender || m.from || m.type || 'unknown',
      content: m.content || m.message || m.text || m.body || '',
      timestamp: m.timestamp || m.date || m.time || null
    })

    if (data.messages && Array.isArray(data.messages)) {
      return data.messages.map(mapMessage)
    }
    if (data.chat && Array.isArray(data.chat)) {
      return data.chat.map(mapMessage)
    }
    if (Array.isArray(data)) {
      return data.map(mapMessage)
    }
    return []
  }

  const isVictimMessage = (party: string): boolean => {
    return party.toLowerCase() === 'victim'
  }

  const getPagedChats = (group: string) => {
    const allChats = groupedChats[group] || []
    const page = groupPages[group] || 1
    const start = (page - 1) * entriesPerGroup
    const end = start + entriesPerGroup
    
    return {
      chats: allChats.slice(start, end),
      total: allChats.length,
      totalPages: Math.ceil(allChats.length / entriesPerGroup),
      currentPage: page,
      start: start + 1,
      end: Math.min(end, allChats.length)
    }
  }

  const setGroupPage = (group: string, page: number) => {
    setGroupPages(prev => ({ ...prev, [group]: page }))
  }

  return (
    <div className="space-y-4">
      {/* Global Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search threat actors..."
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="pl-10 bg-card border-border text-foreground"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Show</span>
          <Select
            value={String(entriesPerGroup)}
            onValueChange={(v) => setEntriesPerGroup(Number(v))}
          >
            <SelectTrigger className="w-[70px] h-9 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">per group</span>
        </div>
      </div>

      {/* Accordion Groups */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Skull className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No threat actors found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group)
            const stats = getGroupStats(group)
            const { chats: pagedChats, total, totalPages, currentPage, start, end } = getPagedChats(group)
            
            return (
              <Card 
                key={group} 
                className={cn(
                  "border-border bg-card overflow-hidden transition-all duration-200",
                  isExpanded && "ring-1 ring-red-500/30"
                )}
              >
                {/* Accordion Header - Clickable */}
                <CardHeader 
                  className={cn(
                    "cursor-pointer select-none transition-colors p-0",
                    "hover:bg-red-950/20"
                  )}
                  onClick={() => toggleGroup(group)}
                >
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4">
                      {/* Expand/Collapse Icon */}
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                        isExpanded ? "bg-red-500/20 text-red-400" : "bg-zinc-800 text-zinc-400"
                      )}>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </div>
                      
                      {/* Group Icon */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/20 to-red-900/40 flex items-center justify-center">
                        <Skull className="h-5 w-5 text-red-400" />
                      </div>
                      
                      {/* Group Name */}
                      <div>
                        <h3 className="text-lg font-bold text-white capitalize">{group}</h3>
                        <p className="text-sm text-muted-foreground">
                          {stats.total} negotiations • {stats.messages} messages
                        </p>
                      </div>
                    </div>

                    {/* Stats Badges */}
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-zinc-800/50 border-zinc-700 text-zinc-300">
                        <Hash className="h-3 w-3 mr-1" />
                        {stats.total}
                      </Badge>
                      {stats.paid > 0 && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {stats.paid} paid
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Accordion Content - Chat List */}
                {isExpanded && (
                  <CardContent className="px-5 pb-5 pt-0">
                    <div className="border-t border-border pt-4">
                      {/* Chat List */}
                      <div className="space-y-2">
                        {pagedChats.map((chat) => (
                          <div
                            key={chat.chatId}
                            onClick={() => openChatModal(chat)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all",
                              "bg-zinc-900/50 hover:bg-red-950/30 border border-transparent hover:border-red-500/20"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-zinc-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white">{chat.chatId}</p>
                                <p className="text-sm text-muted-foreground">
                                  {chat.messages ? `${chat.messages} messages` : 'No message count'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Ransom Info */}
                              <div className="text-right hidden sm:block">
                                {chat.initialRansom && (
                                  <p className="text-sm">
                                    <span className="text-muted-foreground">Initial: </span>
                                    <span className="text-red-400 font-medium">{chat.initialRansom}</span>
                                  </p>
                                )}
                                {chat.negotiatedRansom && (
                                  <p className="text-sm">
                                    <span className="text-muted-foreground">Final: </span>
                                    <span className="text-yellow-400 font-medium">{chat.negotiatedRansom}</span>
                                  </p>
                                )}
                              </div>

                              {/* Paid Badge */}
                              {(chat.paid === true || chat.paid === "true") ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Paid
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-zinc-800/50 border-zinc-700 text-zinc-400">
                                  Unpaid
                                </Badge>
                              )}

                              <ChevronRight className="h-5 w-5 text-zinc-500" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                          <span className="text-sm text-muted-foreground">
                            Showing {start}-{end} of {total}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage === 1}
                              onClick={(e) => { e.stopPropagation(); setGroupPage(group, currentPage - 1) }}
                              className="h-8"
                            >
                              Previous
                            </Button>
                            <span className="px-3 text-sm text-muted-foreground">
                              {currentPage} / {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage === totalPages}
                              onClick={(e) => { e.stopPropagation(); setGroupPage(group, currentPage + 1) }}
                              className="h-8"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Chat Modal */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          onClick={() => setModalOpen(false)}
        >
          <div 
            className="bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col shadow-2xl"
            style={{ 
              width: 'calc(100vw - 60px)', 
              height: 'calc(100vh - 60px)',
              maxWidth: '1200px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex-shrink-0 px-6 py-5 border-b border-zinc-800 bg-gradient-to-r from-red-950/50 to-zinc-900 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-900 flex items-center justify-center shadow-lg shadow-red-500/20">
                    <Skull className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white capitalize">{selectedChat?.group}</h2>
                    <span className="text-sm text-red-300/70">Chat ID: {selectedChat?.chatId}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedChat?.link && (
                    <a
                      href={selectedChat.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Source
                    </a>
                  )}
                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-red-900/50 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Chat Meta */}
              {selectedChat && (
                <div className="flex items-center gap-4 mt-4 text-sm">
                  {selectedChat.messages && (
                    <Badge variant="outline" className="bg-zinc-800/50 border-zinc-700">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {selectedChat.messages} messages
                    </Badge>
                  )}
                  {selectedChat.initialRansom && (
                    <Badge variant="outline" className="bg-red-900/30 border-red-700/50 text-red-300">
                      Initial: {selectedChat.initialRansom}
                    </Badge>
                  )}
                  {selectedChat.negotiatedRansom && (
                    <Badge variant="outline" className="bg-yellow-900/30 border-yellow-700/50 text-yellow-300">
                      Negotiated: {selectedChat.negotiatedRansom}
                    </Badge>
                  )}
                  {(selectedChat.paid === true || selectedChat.paid === "true") && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle className="h-3 w-3 mr-1" /> Ransom Paid
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingChat ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-red-500 mb-4" />
                  <span className="text-lg text-muted-foreground">Loading conversation...</span>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Skull className="h-20 w-20 mx-auto mb-6 opacity-20" />
                  <p className="text-xl mb-2">Chat content unavailable</p>
                  <p className="text-sm mb-6">The chat may be empty or in an unsupported format.</p>
                  {selectedChat?.link && (
                    <a
                      href={selectedChat.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-900/70 transition-colors"
                    >
                      View source on GitHub <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-5 max-w-4xl mx-auto">
                  {chatMessages.map((msg, idx) => {
                    const isVictim = isVictimMessage(msg.role)
                    
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex gap-4",
                          isVictim ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        {/* Avatar */}
                        <div className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
                          isVictim 
                            ? "bg-gradient-to-br from-blue-500 to-blue-900 shadow-blue-500/20" 
                            : "bg-gradient-to-br from-red-500 to-red-900 shadow-red-500/20"
                        )}>
                          {isVictim ? (
                            <User className="h-5 w-5 text-white" />
                          ) : (
                            <Skull className="h-5 w-5 text-white" />
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-5 py-4",
                          isVictim 
                            ? "bg-blue-950/50 border border-blue-800/30 rounded-tr-md" 
                            : "bg-red-950/50 border border-red-800/30 rounded-tl-md"
                        )}>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={cn(
                              "text-xs font-bold uppercase tracking-wider",
                              isVictim ? "text-blue-400" : "text-red-400"
                            )}>
                              {isVictim ? "Victim" : msg.role}
                            </span>
                            {msg.timestamp && (
                              <span className="text-xs text-muted-foreground">
                                {msg.timestamp}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white/90 whitespace-pre-wrap break-words leading-relaxed">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
