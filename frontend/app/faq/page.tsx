"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Collapsible, CollapsibleContent, CollapsibleTrigger 
} from "@/components/ui/collapsible"
import { 
  HelpCircle, Search, ChevronDown, Shield, Database, 
  Globe, Key, FileText, AlertTriangle, Zap, Lock, Users
} from "lucide-react"

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  // Platform General
  {
    category: "Platform",
    question: "What is Dragons Eye Ransomware Tracker?",
    answer: "Dragons Eye is a comprehensive threat intelligence platform developed by Dragons Community. It monitors ransomware groups' leak sites across the dark web, tracks victims, and provides real-time intelligence on ransomware operations. The platform offers AI-enriched analysis, geographic insights, and sector-based threat intelligence."
  },
  {
    category: "Platform",
    question: "Who can use this platform?",
    answer: "Dragons Eye is designed for cybersecurity professionals, threat researchers, SOC analysts, incident responders, and security teams. The platform provides valuable intelligence for understanding the ransomware landscape and protecting organizations from threats."
  },
  {
    category: "Platform",
    question: "How often is the data updated?",
    answer: "The platform automatically updates data every 30 minutes by scraping ransomware leak sites via the Tor network. You can see the last update time on the dashboard and various pages throughout the platform."
  },
  {
    category: "Platform",
    question: "Is this platform free to use?",
    answer: "Dragons Eye is a community project by Dragons Community. Access and pricing details can be obtained by contacting the team at support@dragons.community."
  },
  
  // Data & Intelligence
  {
    category: "Data",
    question: "Where does the data come from?",
    answer: "All data is collected from publicly available sources, primarily ransomware groups' leak sites on the dark web. The platform uses automated scraping via Tor network to gather information about victims, threat actors, and their operations."
  },
  {
    category: "Data",
    question: "What is AI-enriched data?",
    answer: "Some victim descriptions and company information are enriched using AI analysis. These entries are marked with a sparkle icon (✨) and '[AI generated]' prefix. AI enrichment helps provide context when original data is limited."
  },
  {
    category: "Data",
    question: "How accurate is the data?",
    answer: "While we strive for accuracy, the data comes from threat actor sources and may contain errors or misinformation. We recommend verifying critical information through multiple sources. Country and industry classifications are determined through automated analysis and may occasionally be incorrect."
  },
  {
    category: "Data",
    question: "Can I export data from the platform?",
    answer: "Yes! You can export data in multiple formats including CSV, JSON, and STIX (Structured Threat Information Expression). Export buttons are available on victim lists, group pages, and the dedicated export section."
  },
  {
    category: "Data",
    question: "What is STIX format?",
    answer: "STIX (Structured Threat Information Expression) is a standardized language for sharing cyber threat intelligence. Exporting in STIX format allows you to import the data into other security tools and SIEM platforms that support the STIX/TAXII standard."
  },
  
  // Ransomware Groups
  {
    category: "Groups",
    question: "What does 'Active' group status mean?",
    answer: "A group is marked as 'Active' if at least one of their known leak site URLs is currently accessible. Groups can become inactive if their sites are seized by law enforcement, taken down, or if they cease operations."
  },
  {
    category: "Groups",
    question: "What are ransom notes?",
    answer: "Ransom notes are the text files or messages left by ransomware on infected systems. They typically contain payment instructions and threats. We collect these for research and identification purposes - they can help identify which ransomware variant infected a system."
  },
  {
    category: "Groups",
    question: "How can I identify which ransomware attacked me?",
    answer: "You can use the file extension of encrypted files or the ransom note filename to search our database. Additionally, tools like ID Ransomware (id-ransomware.malwarehunterteam.com) can help identify the specific ransomware variant."
  },
  
  // Decryptors
  {
    category: "Decryptors",
    question: "What are decryptors?",
    answer: "Decryptors are tools that can recover files encrypted by ransomware without paying the ransom. They are typically developed by security researchers or law enforcement after obtaining encryption keys or finding vulnerabilities in the ransomware."
  },
  {
    category: "Decryptors",
    question: "Are decryptors safe to use?",
    answer: "Only download decryptors from official sources listed on our platform (such as No More Ransom, Emsisoft, Avast). Never download decryptors from unofficial sources as they may contain malware. Always verify the provider before downloading."
  },
  {
    category: "Decryptors",
    question: "What does 'Limited' decryptor status mean?",
    answer: "'Limited' means the decryptor only works for specific versions or time periods of the ransomware. Check the notes and description to understand the limitations before attempting decryption."
  },
  
  // Security & Legal
  {
    category: "Security",
    question: "Is it legal to access this platform?",
    answer: "Yes, accessing and using this platform for research and defensive purposes is legal. The platform only aggregates publicly available information. However, attempting to access the original dark web leak sites may have legal implications in some jurisdictions."
  },
  {
    category: "Security",
    question: "Should I pay the ransom if attacked?",
    answer: "Law enforcement agencies generally advise against paying ransoms as it funds criminal operations and doesn't guarantee data recovery. Instead, contact your local cybersecurity authority, engage professional incident response services, and check if a decryptor is available."
  },
  {
    category: "Security",
    question: "What should I do if my organization appears on the platform?",
    answer: "If you see your organization listed, immediately engage your incident response team and legal counsel. Contact law enforcement and your local CERT (Computer Emergency Response Team). The presence on a leak site typically means data has been exfiltrated."
  },
  
  // Technical
  {
    category: "Technical",
    question: "What is the API and how can I use it?",
    answer: "Dragons Eye provides a REST API for programmatic access to the data. The API supports queries for victims, groups, statistics, and more. Documentation is available at /api-docs or through the Swagger UI at /docs endpoint."
  },
  {
    category: "Technical",
    question: "Is there an RSS feed for new victims?",
    answer: "Yes! An RSS feed is available at /api/v1/rss/victims which provides real-time updates on newly discovered victims. You can subscribe to this feed in any RSS reader or integrate it into your monitoring workflows."
  },
  {
    category: "Technical",
    question: "What is Hudson Rock infostealer data?",
    answer: "Some victim entries include infostealer data from Hudson Rock, showing if employee credentials from the affected organization were found in infostealer logs. This can indicate potential initial access vectors used by attackers."
  },
]

const categoryIcons: Record<string, any> = {
  "Platform": Globe,
  "Data": Database,
  "Groups": Shield,
  "Decryptors": Key,
  "Security": Lock,
  "Technical": Zap,
}

const categoryColors: Record<string, string> = {
  "Platform": "bg-red-500/20 text-red-400 border-red-500/30",
  "Data": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Groups": "bg-red-600/20 text-red-400 border-red-600/30",
  "Decryptors": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Security": "bg-red-700/20 text-red-300 border-red-700/30",
  "Technical": "bg-orange-600/20 text-orange-400 border-orange-600/30",
}

export default function FAQPage() {
  const [search, setSearch] = useState("")
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const categories = [...new Set(faqData.map(f => f.category))]

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = !search || 
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !activeCategory || item.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const toggleItem = (index: number) => {
    const newOpen = new Set(openItems)
    if (newOpen.has(index)) {
      newOpen.delete(index)
    } else {
      newOpen.add(index)
    }
    setOpenItems(newOpen)
  }

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
                  <HelpCircle className="h-6 w-6 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Frequently Asked Questions</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                Find answers to common questions about Dragons Eye Ransomware Tracker, 
                data sources, decryptors, and platform usage.
              </p>
            </div>
          </div>

          {/* Search */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  className="pl-9 bg-secondary"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveCategory(null)}
            >
              All ({faqData.length})
            </Badge>
            {categories.map(cat => {
              const Icon = categoryIcons[cat] || HelpCircle
              const count = faqData.filter(f => f.category === cat).length
              return (
                <Badge
                  key={cat}
                  variant="outline"
                  className={`cursor-pointer ${activeCategory === cat ? categoryColors[cat] : ''}`}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {cat} ({count})
                </Badge>
              )
            })}
          </div>

          {/* FAQ Items */}
          <div className="space-y-3">
            {filteredFAQ.map((item, index) => {
              const Icon = categoryIcons[item.category] || HelpCircle
              const originalIndex = faqData.indexOf(item)
              
              return (
                <Collapsible
                  key={originalIndex}
                  open={openItems.has(originalIndex)}
                  onOpenChange={() => toggleItem(originalIndex)}
                >
                  <Card className="border-border bg-card overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-start gap-4 p-4 hover:bg-secondary/50 transition-colors cursor-pointer text-left">
                        <div className={`p-2 rounded-lg ${categoryColors[item.category]?.split(' ')[0]} mt-0.5`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-xs ${categoryColors[item.category]}`}>
                              {item.category}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-left">{item.question}</h3>
                        </div>
                        <ChevronDown 
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            openItems.has(originalIndex) ? 'rotate-180' : ''
                          }`} 
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pl-14">
                        <p className="text-muted-foreground leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })}
          </div>

          {filteredFAQ.length === 0 && (
            <Card className="border-border bg-card">
              <CardContent className="p-8 text-center">
                <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No questions found matching your search.</p>
              </CardContent>
            </Card>
          )}

          {/* Contact Section */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Still have questions?</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Can't find what you're looking for? Reach out to our team.
                  </p>
                  <a 
                    href="mailto:support@dragons.community" 
                    className="text-primary hover:underline text-sm"
                  >
                    support@dragons.community
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

