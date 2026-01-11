import "server-only"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import NegotiationClient from "./negotiation-client"
import { promises as fs } from 'fs'
import path from 'path'

type ChatItem = {
  group: string
  chatId: string
  messages?: number | null
  initialRansom?: string | null
  negotiatedRansom?: string | null
  paid?: boolean | null
  link?: string
}

type NegotiationData = Record<string, {
  chat_id: string
  messages: number | null
  initial_ransom: string | null
  negotiated_ransom: string | null
  paid: boolean
  link: string | null
}[]>

async function loadNegotiationsData(): Promise<ChatItem[]> {
  try {
    // Load scraped data from ransomware.live
    const filePath = path.join(process.cwd(), '..', 'db', 'negotiations_data.json')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const data: NegotiationData = JSON.parse(fileContent)
    
    const chats: ChatItem[] = []
    
    for (const [groupName, groupChats] of Object.entries(data)) {
      for (const chat of groupChats) {
        // Build raw GitHub URL for chat content
        const rawUrl = `https://raw.githubusercontent.com/Casualtek/Ransomchats/main/${encodeURIComponent(groupName)}/${chat.chat_id}.json`
        
        chats.push({
          group: groupName,
          chatId: chat.chat_id,
          messages: chat.messages,
          initialRansom: chat.initial_ransom,
          negotiatedRansom: chat.negotiated_ransom,
          paid: chat.paid,
          link: rawUrl  // Use GitHub raw URL for chat content
        })
      }
    }
    
    return chats
  } catch (error) {
    console.error('Failed to load negotiations data:', error)
    return []
  }
}

export default async function NegotiationPage() {
  const chats = await loadNegotiationsData()
  
  // Count stats
  const totalGroups = new Set(chats.map(c => c.group)).size
  const totalChats = chats.length
  const paidCount = chats.filter(c => c.paid).length

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
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white">Ransomware Negotiations</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl mb-6">
                Real negotiation conversations between ransomware threat actors and their victims. 
                Analyze tactics, ransom amounts, and outcomes.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-2xl font-bold text-white">{totalGroups}</span>
                  <span className="text-sm text-muted-foreground">Threat Actors</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-2xl font-bold text-white">{totalChats}</span>
                  <span className="text-sm text-muted-foreground">Conversations</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-green-900/30 border border-green-700/30">
                  <span className="text-2xl font-bold text-green-400">{paidCount}</span>
                  <span className="text-sm text-green-300/70">Paid Ransoms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Negotiation List */}
          {chats.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">No negotiation data available.</p>
                  <p className="text-sm mt-2">Please ensure negotiations_data.json exists in the db folder.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <NegotiationClient chats={chats} />
          )}
        </div>
      </main>
    </div>
  )
}
