import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Clock } from "lucide-react"

// Mock data
const negotiations = [
  {
    id: "1",
    group: "LockBit3",
    victim: "Acme Corporation",
    status: "ongoing",
    messages: 24,
    lastActivity: "2 hours ago",
    demand: "$5,000,000",
  },
  {
    id: "2",
    group: "BlackBasta",
    victim: "HealthCare Plus",
    status: "stalled",
    messages: 18,
    lastActivity: "1 day ago",
    demand: "$3,500,000",
  },
  {
    id: "3",
    group: "Play",
    victim: "ManuTech Industries",
    status: "completed",
    messages: 42,
    lastActivity: "3 days ago",
    demand: "$2,000,000",
  },
  {
    id: "4",
    group: "Akira",
    victim: "UniTech College",
    status: "ongoing",
    messages: 15,
    lastActivity: "5 hours ago",
    demand: "$1,500,000",
  },
  {
    id: "5",
    group: "Hunters",
    victim: "Finance Inc",
    status: "ongoing",
    messages: 31,
    lastActivity: "1 hour ago",
    demand: "$4,200,000",
  },
  {
    id: "6",
    group: "Medusa",
    victim: "Global Logistics",
    status: "refused",
    messages: 8,
    lastActivity: "2 weeks ago",
    demand: "$2,800,000",
  },
]

export default function NegotiationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Negotiations</h1>
          <p className="text-muted-foreground">Track ransom negotiation communications</p>
        </div>

        <div className="grid gap-4">
          {negotiations.map((negotiation) => (
            <Card key={negotiation.id} className="border-border bg-card hover:bg-secondary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">{negotiation.victim}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="default">{negotiation.group}</Badge>
                          <Badge
                            variant={
                              negotiation.status === "ongoing"
                                ? "default"
                                : negotiation.status === "completed"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {negotiation.status === "ongoing" && "🟢"}
                            {negotiation.status === "stalled" && "🟡"}
                            {negotiation.status === "completed" && "✅"}
                            {negotiation.status === "refused" && "❌"}
                            {" " + negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Demand</div>
                        <div className="font-semibold text-primary">{negotiation.demand}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Messages</div>
                        <div className="font-semibold">{negotiation.messages}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last Activity
                        </div>
                        <div className="font-semibold">{negotiation.lastActivity}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
