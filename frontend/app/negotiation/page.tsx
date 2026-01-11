"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import NegotiationClient from "./negotiation-client"
import { Loader2 } from "lucide-react"

type ChatItem = {
  group: string
  chatId: string
  messages?: number | null
  initialRansom?: string | null
  negotiatedRansom?: string | null
  paid?: boolean | null
  link?: string
}

type NegotiationsResponse = {
  total_groups: number
  total_chats: number
  paid_count: number
  chats: ChatItem[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname.includes('dragons.community') || window.location.hostname.includes('vercel.app'))
    ? 'https://ransomwareapi.dragons.community'
    : 'http://localhost:8000');

export default function NegotiationPage() {
  const [data, setData] = useState<NegotiationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/negotiations`)
        if (!res.ok) {
          throw new Error('Failed to fetch negotiations data')
        }
        const result = await res.json()
        setData(result)
      } catch (err) {
        console.error('Failed to load negotiations:', err)
        setError('Failed to load negotiations data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
                  <span className="text-2xl font-bold text-white">{loading ? "-" : data?.total_groups || 0}</span>
                  <span className="text-sm text-muted-foreground">Threat Actors</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-2xl font-bold text-white">{loading ? "-" : data?.total_chats || 0}</span>
                  <span className="text-sm text-muted-foreground">Conversations</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-green-900/30 border border-green-700/30">
                  <span className="text-2xl font-bold text-green-400">{loading ? "-" : data?.paid_count || 0}</span>
                  <span className="text-sm text-green-300/70">Paid Ransoms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <Card className="border-border bg-card">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p className="text-lg">Loading negotiations data...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="border-red-500/20 bg-red-950/20">
              <CardContent className="py-12">
                <div className="text-center text-red-400">
                  <p className="text-lg">{error}</p>
                  <p className="text-sm mt-2 text-muted-foreground">Please try again later.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Negotiation List */}
          {!loading && !error && data && data.chats.length === 0 && (
            <Card className="border-border bg-card">
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">No negotiation data available.</p>
                  <p className="text-sm mt-2">Please ensure negotiations_data.json exists in the db folder.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && data && data.chats.length > 0 && (
            <NegotiationClient chats={data.chats} />
          )}
        </div>
      </main>
    </div>
  )
}
