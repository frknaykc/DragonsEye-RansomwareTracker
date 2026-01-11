"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Key, Shield, ExternalLink, Download, AlertTriangle, CheckCircle2, 
  Info, ArrowLeft, FileText, Book, Calendar, Building2, ChevronDown, ChevronUp
} from "lucide-react"
import Link from "next/link"
import { getDecryptorById, type Decryptor } from "@/lib/api"

export default function DecryptorDetailPage() {
  const params = useParams()
  const [decryptor, setDecryptor] = useState<Decryptor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFullDescription, setShowFullDescription] = useState(false)

  useEffect(() => {
    async function fetchDecryptor() {
      try {
        const id = params.id as string
        const data = await getDecryptorById(id)
        setDecryptor(data)
      } catch (err) {
        console.error("Failed to fetch decryptor:", err)
        setError("Decryptor not found")
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchDecryptor()
    }
  }, [params.id])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-lg px-4 py-1"><CheckCircle2 className="h-4 w-4 mr-2" />Active</Badge>
      case "limited":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-lg px-4 py-1"><AlertTriangle className="h-4 w-4 mr-2" />Limited</Badge>
      case "outdated":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-lg px-4 py-1"><Info className="h-4 w-4 mr-2" />Outdated</Badge>
      default:
        return <Badge variant="outline" className="text-lg px-4 py-1">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !decryptor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8">
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Decryptor Not Found</h2>
              <p className="text-muted-foreground mb-4">The requested decryptor could not be found.</p>
              <Link href="/decryptors">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Decryptors
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        {/* Back Button */}
        <Link href="/decryptors">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Decryptors
          </Button>
        </Link>

        {/* Hero Section */}
        <Card className="border-green-500/30 bg-gradient-to-r from-green-500/5 to-transparent mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="h-20 w-20 rounded-2xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Key className="h-10 w-10 text-green-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{decryptor.decryptor_name}</h1>
                  <Link href={`/groups/${decryptor.group_name}`}>
                    <Badge variant="outline" className="text-base px-3 py-1 hover:bg-primary/10 cursor-pointer">
                      <Shield className="h-4 w-4 mr-2" />
                      {decryptor.group_name.toUpperCase()}
                    </Badge>
                  </Link>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                {getStatusBadge(decryptor.status)}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">{decryptor.description}</p>
                
                {/* Expandable Detailed Description */}
                {decryptor.detailed_description && (
                  <div className="mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-primary"
                    >
                      {showFullDescription ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Read More
                        </>
                      )}
                    </Button>
                    
                    {showFullDescription && (
                      <div className="mt-4 p-4 bg-secondary/30 rounded-lg border border-border">
                        <p className="whitespace-pre-wrap text-muted-foreground">
                          {decryptor.detailed_description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How-To Guide */}
            {decryptor.how_to_guide_type && decryptor.how_to_guide_type !== 'none' && (
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-500">
                    <Book className="h-5 w-5" />
                    How-To Guide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* External URL */}
                  {decryptor.how_to_guide_type === 'url' && decryptor.how_to_guide_url && (
                    <>
                      <p className="text-muted-foreground mb-4">
                        For detailed instructions on how to use this decryptor, please refer to the official guide.
                      </p>
                      <a 
                        href={decryptor.how_to_guide_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View How-To Guide
                        </Button>
                      </a>
                    </>
                  )}

                  {/* PDF */}
                  {decryptor.how_to_guide_type === 'pdf' && decryptor.how_to_guide_url && (
                    <>
                      <p className="text-muted-foreground mb-4">
                        Download the PDF guide for detailed instructions on how to use this decryptor.
                      </p>
                      <a 
                        href={decryptor.how_to_guide_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF Guide
                        </Button>
                      </a>
                    </>
                  )}

                  {/* Text/Markdown Content */}
                  {decryptor.how_to_guide_type === 'text' && decryptor.how_to_guide_text && (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                        {decryptor.how_to_guide_text}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Legacy support for old how_to_guide_url without type */}
            {(!decryptor.how_to_guide_type || decryptor.how_to_guide_type === 'none') && decryptor.how_to_guide_url && (
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-500">
                    <Book className="h-5 w-5" />
                    How-To Guide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    For detailed instructions on how to use this decryptor, please refer to the official guide.
                  </p>
                  <a 
                    href={decryptor.how_to_guide_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View How-To Guide
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )}

            {/* File Extensions */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-destructive" />
                  Supported File Extensions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {decryptor.file_extensions.length > 0 ? (
                    decryptor.file_extensions.map((ext, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="font-mono text-base px-4 py-2 bg-destructive/10 text-destructive border-destructive/30"
                      >
                        {ext}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No specific extensions listed</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {decryptor.notes && (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-500">
                    <AlertTriangle className="h-5 w-5" />
                    Important Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{decryptor.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Download Card */}
            <Card className="border-green-500/50 bg-green-500/5">
              <CardHeader>
                <CardTitle className="text-green-500">Download</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <a 
                  href={decryptor.download_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-lg py-6">
                    <Download className="h-5 w-5 mr-2" />
                    Download Decryptor
                  </Button>
                </a>
                <p className="text-xs text-muted-foreground text-center">
                  Always verify downloads from official sources
                </p>
              </CardContent>
            </Card>

            {/* Provider Info */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Provider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold mb-2">{decryptor.provider}</p>
                <a 
                  href={decryptor.provider_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Visit Provider Website
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>

            {/* Release Date */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Release Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">
                  {decryptor.release_date || "Not specified"}
                </p>
              </CardContent>
            </Card>

            {/* Tool Credit */}
            <Card className="border-border bg-card">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Tool made by <span className="font-semibold text-primary">{decryptor.provider}</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Warning Banner */}
        <Card className="border-yellow-500/50 bg-yellow-500/10 mt-8">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-yellow-500">Important Notice</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Always download decryptors from official sources. Verify the provider and URL before downloading. 
                  Some decryptors only work for specific versions or time periods. 
                  Consider consulting with cybersecurity professionals before attempting decryption.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

