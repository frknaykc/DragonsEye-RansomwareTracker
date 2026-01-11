"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Settings, FileText, Key, Plus, Pencil, Trash2, RefreshCw, 
  Shield, Save, AlertTriangle, CheckCircle2, Lock, LogOut, Eye, EyeOff,
  Users, LayoutDashboard, Globe, BarChart3, Map, List, Image
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { DataStatusBadge } from "@/components/data-status"

// Dynamic API URL
function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('dragons.community') || 
        window.location.hostname.includes('vercel.app')) {
      return 'https://ransomwareapi.dragons.community';
    }
    return `http://${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
}

// Admin authentication is now handled server-side via API
// Never store credentials in frontend code!

interface RansomNote {
  id: string
  group_name: string
  note_title: string
  note_content: string
  filename: string
  file_extensions: string[]
  created_at: string
  updated_at: string
}

interface Decryptor {
  id: string
  group_name: string
  decryptor_name: string
  provider: string
  provider_url: string
  download_url: string
  description: string
  detailed_description?: string
  file_extensions: string[]
  status: string
  release_date: string
  notes: string
  how_to_guide_type?: 'none' | 'url' | 'text' | 'pdf'
  how_to_guide_url?: string
  how_to_guide_text?: string
  created_at: string
  updated_at: string
}

interface Group {
  name: string
  description?: string
  meta?: string
  captcha?: boolean
  parser?: boolean
  javascript_render?: boolean
  profile?: string[]
  locations?: any[]
  logo_url?: string
}

interface AboutContent {
  hero_title: string
  hero_subtitle: string
  hero_description: string
  main_description: string
  secondary_description: string
  community_description: string
  contact_email: string
  security_email: string
  partners_email: string
  website_url: string
  discord_url: string
  telegram_url: string
  twitter_url: string
}

interface DashboardWidget {
  id: string
  type: string
  title: string
  enabled: boolean
  order: number
}

// Analytics types
interface AnalyticsSummary {
  total_requests: number
  unique_visitors: number
  today_requests: number
  this_hour_requests: number
  last_24h_requests: number
  last_7d_requests: number
  top_pages: Record<string, number>
  top_api_endpoints: Record<string, number>
  user_agent_breakdown: Record<string, number>
  top_referrers: Record<string, number>
  tracking_since: string
}

interface TrafficData {
  period: string
  granularity: string
  data: Record<string, number>
}

interface Visitor {
  ip: string
  path: string
  time: string
  ua: string
}

export default function AdminPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [loginAttempts, setLoginAttempts] = useState(0)
  
  // OTP state
  const [requiresOtp, setRequiresOtp] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [tempToken, setTempToken] = useState("")
  const [otpSetupData, setOtpSetupData] = useState<any>(null)
  const [showOtpSetup, setShowOtpSetup] = useState(false)
  
  // Analytics state
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null)
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null)
  const [recentVisitors, setRecentVisitors] = useState<Visitor[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [trafficPeriod, setTrafficPeriod] = useState("24h")

  const [activeTab, setActiveTab] = useState("analytics")
  const [ransomNotes, setRansomNotes] = useState<RansomNote[]>([])
  const [decryptors, setDecryptors] = useState<Decryptor[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  
  // System/Update state
  const [updateStatus, setUpdateStatus] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  
  // Groups state
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    meta: "",
    first_seen: "",
    country_origin: "",
    targets: "",
    extensions: "",
    logo_url: ""
  })
  const [groupSearch, setGroupSearch] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  
  // Content state
  const [aboutContent, setAboutContent] = useState<AboutContent>({
    hero_title: "", hero_subtitle: "", hero_description: "",
    main_description: "", secondary_description: "", community_description: "",
    contact_email: "", security_email: "", partners_email: "",
    website_url: "", discord_url: "", telegram_url: "", twitter_url: ""
  })
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])

  // Ransom Note Form State
  const [noteForm, setNoteForm] = useState({
    id: "",
    group_name: "",
    note_title: "",
    note_content: "",
    filename: "",
    file_extensions: ""
  })
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(false)

  // Decryptor Form State
  const [decryptorForm, setDecryptorForm] = useState({
    id: "",
    group_name: "",
    decryptor_name: "",
    provider: "",
    provider_url: "",
    download_url: "",
    description: "",
    detailed_description: "",
    file_extensions: "",
    status: "active",
    release_date: "",
    notes: "",
    how_to_guide_type: "none" as 'none' | 'url' | 'text' | 'pdf',
    how_to_guide_url: "",
    how_to_guide_text: ""
  })
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [decryptorDialogOpen, setDecryptorDialogOpen] = useState(false)
  const [editingDecryptor, setEditingDecryptor] = useState(false)

  // Check session on mount
  useEffect(() => {
    const session = sessionStorage.getItem("adminAuth")
    if (session === "authenticated") {
      setIsAuthenticated(true)
    }
  }, [])

  // Handle login - Now uses backend API for authentication with OTP support
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    if (loginAttempts >= 5) {
      setLoginError("Too many failed attempts. Please try again later.")
      return
    }

    try {
      const response = await fetch(`${getApiBase()}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${username}:${password}`),
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.requires_otp) {
          // OTP required - show OTP input
          setRequiresOtp(true)
          setTempToken(data.temp_token)
          setLoginError("")
        } else {
          // No OTP required - login successful
          setIsAuthenticated(true)
          sessionStorage.setItem("adminAuth", "authenticated")
          sessionStorage.setItem("adminCredentials", btoa(`${username}:${password}`))
          setLoginAttempts(0)
        }
      } else {
        setLoginAttempts(prev => prev + 1)
        setLoginError(`Invalid credentials. ${5 - loginAttempts - 1} attempts remaining.`)
      }
    } catch (err) {
      setLoginError("Connection error. Please check if the API is running.")
    }
  }
  
  // Handle OTP verification
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    
    try {
      const response = await fetch(
        `${getApiBase()}/api/v1/auth/verify-otp?temp_token=${tempToken}&otp_code=${otpCode}`,
        { method: "POST" }
      )
      
      if (response.ok) {
        setIsAuthenticated(true)
        sessionStorage.setItem("adminAuth", "authenticated")
        sessionStorage.setItem("adminCredentials", btoa(`${username}:${password}`))
        setLoginAttempts(0)
        setRequiresOtp(false)
        setOtpCode("")
        setTempToken("")
      } else {
        const data = await response.json()
        setLoginError(data.detail || "Invalid OTP code")
      }
    } catch (err) {
      setLoginError("Connection error. Please try again.")
    }
  }
  
  // Fetch OTP setup data
  const fetchOtpSetup = async () => {
    try {
      const creds = sessionStorage.getItem("adminCredentials") || btoa(`${username}:${password}`)
      const response = await fetch(`${getApiBase()}/api/v1/auth/otp-setup`, {
        headers: { "Authorization": "Basic " + creds }
      })
      if (response.ok) {
        const data = await response.json()
        setOtpSetupData(data)
        setShowOtpSetup(true)
      }
    } catch (err) {
      console.error("Failed to fetch OTP setup:", err)
    }
  }
  
  // Fetch analytics data
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const creds = sessionStorage.getItem("adminCredentials")
      const headers = { "Authorization": "Basic " + creds }
      
      const [summaryRes, trafficRes, visitorsRes] = await Promise.all([
        fetch(`${getApiBase()}/api/v1/analytics/summary`, { headers }),
        fetch(`${getApiBase()}/api/v1/analytics/traffic?period=${trafficPeriod}`, { headers }),
        fetch(`${getApiBase()}/api/v1/analytics/visitors?limit=50`, { headers })
      ])
      
      if (summaryRes.ok) {
        setAnalyticsSummary(await summaryRes.json())
      }
      if (trafficRes.ok) {
        setTrafficData(await trafficRes.json())
      }
      if (visitorsRes.ok) {
        const data = await visitorsRes.json()
        setRecentVisitors(data.visitors || [])
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err)
    } finally {
      setAnalyticsLoading(false)
    }
  }
  
  // Reset analytics
  const resetAnalytics = async () => {
    if (!confirm("Are you sure you want to reset all analytics data?")) return
    
    try {
      const creds = sessionStorage.getItem("adminCredentials")
      const response = await fetch(`${getApiBase()}/api/v1/analytics/reset`, {
        method: "POST",
        headers: { "Authorization": "Basic " + creds }
      })
      if (response.ok) {
        setMessage({ type: "success", text: "Analytics data reset successfully" })
        fetchAnalytics()
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to reset analytics" })
    }
  }

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem("adminAuth")
    setUsername("")
    setPassword("")
  }

  // Fetch data
  const fetchRansomNotes = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/ransom-notes`)
      const data = await res.json()
      setRansomNotes(data.data || [])
    } catch (err) {
      console.error("Failed to fetch ransom notes:", err)
    }
  }

  const fetchDecryptors = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/decryptors`)
      const data = await res.json()
      setDecryptors(data.data || [])
    } catch (err) {
      console.error("Failed to fetch decryptors:", err)
    }
  }

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/groups`)
      const data = await res.json()
      setGroups(data.data || [])
    } catch (err) {
      console.error("Failed to fetch groups:", err)
    }
  }

  const fetchSiteContent = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/site-content`)
      const data = await res.json()
      if (data.about) setAboutContent(data.about)
      if (data.dashboard_widgets) setWidgets(data.dashboard_widgets)
    } catch (err) {
      console.error("Failed to fetch site content:", err)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchRansomNotes()
      fetchDecryptors()
      fetchGroups()
      fetchSiteContent()
      fetchAnalytics()
    }
  }, [isAuthenticated])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // Ransom Note CRUD
  const handleSaveNote = async () => {
    setLoading(true)
    try {
      const url = editingNote 
        ? `${getApiBase()}/api/v1/ransom-notes/${noteForm.id}`
        : `${getApiBase()}/api/v1/ransom-notes`
      
      const params = new URLSearchParams({
        group_name: noteForm.group_name,
        note_title: noteForm.note_title,
        note_content: noteForm.note_content,
        filename: noteForm.filename,
        file_extensions: noteForm.file_extensions
      })

      const res = await fetch(`${url}?${params}`, {
        method: editingNote ? 'PUT' : 'POST'
      })
      
      if (res.ok) {
        showMessage('success', editingNote ? 'Note updated!' : 'Note created!')
        fetchRansomNotes()
        setNoteDialogOpen(false)
        resetNoteForm()
      } else {
        showMessage('error', 'Failed to save note')
      }
    } catch (err) {
      showMessage('error', 'Error saving note')
    }
    setLoading(false)
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return
    
    try {
      const res = await fetch(`${getApiBase()}/api/v1/ransom-notes/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        showMessage('success', 'Note deleted!')
        fetchRansomNotes()
      }
    } catch (err) {
      showMessage('error', 'Error deleting note')
    }
  }

  const editNote = (note: RansomNote) => {
    setNoteForm({
      id: note.id,
      group_name: note.group_name,
      note_title: note.note_title,
      note_content: note.note_content,
      filename: note.filename,
      file_extensions: note.file_extensions.join(", ")
    })
    setEditingNote(true)
    setNoteDialogOpen(true)
  }

  const resetNoteForm = () => {
    setNoteForm({
      id: "",
      group_name: "",
      note_title: "",
      note_content: "",
      filename: "",
      file_extensions: ""
    })
    setEditingNote(false)
  }

  // Decryptor CRUD
  const handleSaveDecryptor = async () => {
    setLoading(true)
    try {
      const url = editingDecryptor 
        ? `${getApiBase()}/api/v1/decryptors/${decryptorForm.id}`
        : `${getApiBase()}/api/v1/decryptors`
      
      const params = new URLSearchParams({
        group_name: decryptorForm.group_name,
        decryptor_name: decryptorForm.decryptor_name,
        provider: decryptorForm.provider,
        provider_url: decryptorForm.provider_url,
        download_url: decryptorForm.download_url,
        description: decryptorForm.description,
        detailed_description: decryptorForm.detailed_description,
        file_extensions: decryptorForm.file_extensions,
        status: decryptorForm.status,
        release_date: decryptorForm.release_date,
        notes: decryptorForm.notes,
        how_to_guide_type: decryptorForm.how_to_guide_type,
        how_to_guide_url: decryptorForm.how_to_guide_url,
        how_to_guide_text: decryptorForm.how_to_guide_text
      })

      const res = await fetch(`${url}?${params}`, {
        method: editingDecryptor ? 'PUT' : 'POST'
      })
      
      if (res.ok) {
        showMessage('success', editingDecryptor ? 'Decryptor updated!' : 'Decryptor created!')
        fetchDecryptors()
        setDecryptorDialogOpen(false)
        resetDecryptorForm()
      } else {
        showMessage('error', 'Failed to save decryptor')
      }
    } catch (err) {
      showMessage('error', 'Error saving decryptor')
    }
    setLoading(false)
  }

  const handleDeleteDecryptor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this decryptor?')) return
    
    try {
      const res = await fetch(`${getApiBase()}/api/v1/decryptors/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        showMessage('success', 'Decryptor deleted!')
        fetchDecryptors()
      }
    } catch (err) {
      showMessage('error', 'Error deleting decryptor')
    }
  }

  const editDecryptor = (d: Decryptor) => {
    setDecryptorForm({
      id: d.id,
      group_name: d.group_name,
      decryptor_name: d.decryptor_name,
      provider: d.provider,
      provider_url: d.provider_url,
      download_url: d.download_url,
      description: d.description,
      detailed_description: d.detailed_description || "",
      file_extensions: d.file_extensions.join(", "),
      status: d.status,
      release_date: d.release_date,
      notes: d.notes,
      how_to_guide_type: d.how_to_guide_type || "none",
      how_to_guide_url: d.how_to_guide_url || "",
      how_to_guide_text: d.how_to_guide_text || ""
    })
    setEditingDecryptor(true)
    setDecryptorDialogOpen(true)
  }

  const resetDecryptorForm = () => {
    setDecryptorForm({
      id: "",
      group_name: "",
      decryptor_name: "",
      provider: "",
      provider_url: "",
      download_url: "",
      description: "",
      detailed_description: "",
      file_extensions: "",
      status: "active",
      release_date: "",
      notes: "",
      how_to_guide_type: "none",
      how_to_guide_url: "",
      how_to_guide_text: ""
    })
    setEditingDecryptor(false)
  }

  // PDF Upload handler
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showMessage('error', 'Only PDF files are allowed')
      return
    }

    setUploadingPdf(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${getApiBase()}/api/v1/upload/pdf`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setDecryptorForm({
          ...decryptorForm,
          how_to_guide_url: `${getApiBase()}${data.url}`
        })
        showMessage('success', 'PDF uploaded successfully!')
      } else {
        showMessage('error', 'Failed to upload PDF')
      }
    } catch (err) {
      showMessage('error', 'Error uploading PDF')
    }
    setUploadingPdf(false)
  }

  // Group handlers
  const handleEditGroup = async (group: Group) => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/groups/${encodeURIComponent(group.name)}/details`)
      if (res.ok) {
        const data = await res.json()
        setSelectedGroup(data)
        
        // Parse profile data
        const profile = data.profile || []
        let firstSeen = "", countryOrigin = "", targets = "", extensions = ""
        profile.forEach((entry: string) => {
          if (entry.startsWith("First Seen:")) firstSeen = entry.replace("First Seen:", "").trim()
          if (entry.startsWith("Country of Origin:")) countryOrigin = entry.replace("Country of Origin:", "").trim()
          if (entry.startsWith("Targets:")) targets = entry.replace("Targets:", "").trim()
          if (entry.startsWith("File Extensions:")) extensions = entry.replace("File Extensions:", "").trim()
        })
        
        setGroupForm({
          name: data.name,
          description: data.description || "",
          meta: data.meta || "",
          first_seen: firstSeen,
          country_origin: countryOrigin,
          targets: targets,
          extensions: extensions,
          logo_url: data.logo_url || ""
        })
        setGroupDialogOpen(true)
      }
    } catch (err) {
      showMessage('error', 'Failed to load group details')
    }
  }

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !groupForm.name) return

    const allowedTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(ext)) {
      showMessage('error', 'Invalid file type. Allowed: PNG, JPG, GIF, WEBP, SVG, ICO')
      return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${getApiBase()}/api/v1/groups/${encodeURIComponent(groupForm.name)}/logo`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setGroupForm({ ...groupForm, logo_url: `${getApiBase()}${data.url}` })
        showMessage('success', 'Logo uploaded successfully!')
        fetchGroups()
      } else {
        showMessage('error', 'Failed to upload logo')
      }
    } catch (err) {
      showMessage('error', 'Error uploading logo')
    }
    setUploadingLogo(false)
  }

  // Logo delete handler
  const handleDeleteLogo = async () => {
    if (!groupForm.name) return
    
    try {
      const res = await fetch(`${getApiBase()}/api/v1/groups/${encodeURIComponent(groupForm.name)}/logo`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setGroupForm({ ...groupForm, logo_url: "" })
        showMessage('success', 'Logo deleted')
        fetchGroups()
      } else {
        showMessage('error', 'Failed to delete logo')
      }
    } catch (err) {
      showMessage('error', 'Error deleting logo')
    }
  }

  const handleSaveGroup = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (groupForm.description) params.append('description', groupForm.description)
      if (groupForm.meta) params.append('meta', groupForm.meta)
      if (groupForm.first_seen) params.append('first_seen', groupForm.first_seen)
      if (groupForm.country_origin) params.append('country_origin', groupForm.country_origin)
      if (groupForm.targets) params.append('targets', groupForm.targets)
      if (groupForm.extensions) params.append('extensions', groupForm.extensions)

      const res = await fetch(`${getApiBase()}/api/v1/groups/${encodeURIComponent(groupForm.name)}/profile?${params}`, {
        method: 'PUT'
      })
      
      if (res.ok) {
        showMessage('success', 'Group updated!')
        fetchGroups()
        setGroupDialogOpen(false)
      } else {
        showMessage('error', 'Failed to save group')
      }
    } catch (err) {
      showMessage('error', 'Error saving group')
    }
    setLoading(false)
  }

  // About content handler
  const handleSaveAbout = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(aboutContent).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const res = await fetch(`${getApiBase()}/api/v1/site-content/about?${params}`, {
        method: 'PUT'
      })
      
      if (res.ok) {
        showMessage('success', 'About content updated!')
      } else {
        showMessage('error', 'Failed to save about content')
      }
    } catch (err) {
      showMessage('error', 'Error saving about content')
    }
    setLoading(false)
  }

  // Widget toggle handler
  const handleToggleWidget = async (widgetId: string, enabled: boolean) => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/site-content/widgets/${widgetId}?enabled=${enabled}`, {
        method: 'PUT'
      })
      
      if (res.ok) {
        setWidgets(widgets.map(w => w.id === widgetId ? {...w, enabled} : w))
        showMessage('success', `Widget ${enabled ? 'enabled' : 'disabled'}`)
      }
    } catch (err) {
      showMessage('error', 'Error updating widget')
    }
  }

  // Filtered groups for search
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(groupSearch.toLowerCase())
  )

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {requiresOtp ? "Enter your 6-digit authenticator code" : "Enter your credentials to access the admin panel"}
            </p>
          </CardHeader>
          <CardContent>
            {!requiresOtp ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="mt-1"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                {loginError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {loginError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loginAttempts >= 5}>
                  <Lock className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpVerify} className="space-y-4">
                <div>
                  <Label htmlFor="otp">Authenticator Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="mt-1 text-center text-2xl tracking-widest font-mono"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
                
                {loginError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {loginError}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setRequiresOtp(false)
                      setOtpCode("")
                      setTempToken("")
                    }}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={otpCode.length !== 6}>
                    <Shield className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin Panel (authenticated)
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground">
              Manage ransom notes and decryptors
            </p>
          </div>
          <div className="flex items-center gap-4">
            <DataStatusBadge />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Message Toast */}
        {message && (
          <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            {message.text}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="ransom-notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes ({ransomNotes.length})
            </TabsTrigger>
            <TabsTrigger value="decryptors" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Decryptors ({decryptors.length})
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Groups ({groups.length})
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border bg-card">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-primary">
                      {analyticsSummary?.total_requests?.toLocaleString() || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-500">
                      {analyticsSummary?.unique_visitors?.toLocaleString() || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Unique Visitors</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-500">
                      {analyticsSummary?.today_requests?.toLocaleString() || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Today</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-500">
                      {analyticsSummary?.last_24h_requests?.toLocaleString() || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Last 24h</p>
                  </CardContent>
                </Card>
              </div>

              {/* Traffic Chart & Top Pages */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-border bg-card">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Traffic Overview</CardTitle>
                    <div className="flex gap-2">
                      <Select value={trafficPeriod} onValueChange={(v) => { setTrafficPeriod(v); fetchAnalytics(); }}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24h">24h</SelectItem>
                          <SelectItem value="7d">7 days</SelectItem>
                          <SelectItem value="30d">30 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={fetchAnalytics}>
                        <RefreshCw className={`h-4 w-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {trafficData?.data && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {Object.entries(trafficData.data).slice(-12).map(([time, count]) => (
                          <div key={time} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-32 truncate">
                              {trafficData.granularity === 'hourly' ? time.split(' ')[1] : time}
                            </span>
                            <div className="flex-1 bg-muted rounded-full h-4">
                              <div 
                                className="bg-primary h-4 rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(100, (count / Math.max(...Object.values(trafficData.data))) * 100)}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm font-mono w-12 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Top Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {analyticsSummary?.top_pages && Object.entries(analyticsSummary.top_pages).map(([page, count]) => (
                        <div key={page} className="flex items-center justify-between text-sm">
                          <span className="truncate flex-1 font-mono text-xs">{page}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Visitors & Referrers */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-border bg-card">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Recent Visitors</CardTitle>
                    <Button variant="outline" size="sm" onClick={resetAnalytics}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {recentVisitors.map((visitor, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50">
                          <span className="font-mono text-muted-foreground">{visitor.ip}</span>
                          <span className="truncate max-w-[150px]">{visitor.path}</span>
                          <Badge variant={visitor.ua === 'bot' ? 'destructive' : 'secondary'} className="text-xs">
                            {visitor.ua}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Top Referrers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {analyticsSummary?.top_referrers && Object.entries(analyticsSummary.top_referrers).map(([ref, count]) => (
                        <div key={ref} className="flex items-center justify-between text-sm">
                          <span className="truncate flex-1">{ref}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Tracking since: {analyticsSummary?.tracking_since ? new Date(analyticsSummary.tracking_since).toLocaleString() : 'N/A'}
              </p>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Two-Factor Authentication (2FA)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enable TOTP-based two-factor authentication using Google Authenticator or similar apps.
                  </p>
                  
                  <Button onClick={fetchOtpSetup} variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Setup / View 2FA
                  </Button>
                  
                  {otpSetupData && (
                    <div className="mt-4 p-4 border border-border rounded-lg space-y-4">
                      <div className="flex justify-center">
                        <img src={otpSetupData.qr_code} alt="QR Code" className="w-48 h-48" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Or enter this secret manually:</p>
                        <code className="px-3 py-1 bg-muted rounded text-sm font-mono">
                          {otpSetupData.secret}
                        </code>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                        <h4 className="font-semibold text-amber-500 mb-2">⚠️ Important</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Add these lines to your <code>.env</code> file on the server:
                        </p>
                        <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                          {otpSetupData.env_config}
                        </pre>
                        <p className="text-xs text-muted-foreground mt-2">
                          Then restart the API server for changes to take effect.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Admin Username</p>
                      <p className="text-sm text-muted-foreground">Current: {username || 'admin'}</p>
                    </div>
                    <Badge variant="secondary">Set in .env</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-muted-foreground">SHA256 hashed in .env</p>
                    </div>
                    <Badge variant="secondary">Set in .env</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">CORS Origins</p>
                      <p className="text-sm text-muted-foreground">Allowed domains for API access</p>
                    </div>
                    <Badge variant="secondary">Set in .env</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ransom Notes Tab */}
          <TabsContent value="ransom-notes">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Ransom Notes</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchRansomNotes}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button type="button" size="sm" onClick={() => setNoteDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </CardHeader>
              
              {/* Ransom Notes Dialog - Outside of CardHeader */}
              <Dialog open={noteDialogOpen} modal={true}>
                <DialogContent 
                  className="max-w-2xl max-h-[90vh] overflow-y-auto" 
                  onPointerDownOutside={(e) => e.preventDefault()} 
                  onInteractOutside={(e) => e.preventDefault()}
                  onEscapeKeyDown={(e) => e.preventDefault()}
                  showCloseButton={false}
                  aria-describedby="note-dialog-description"
                >
                  <DialogHeader className="flex flex-row items-center justify-between">
                    <div>
                      <DialogTitle>{editingNote ? 'Edit Ransom Note' : 'Add New Ransom Note'}</DialogTitle>
                      <p id="note-dialog-description" className="text-sm text-muted-foreground mt-1">
                        {editingNote ? 'Update ransom note content' : 'Add a new ransom note'}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setNoteDialogOpen(false); resetNoteForm(); }} className="h-8 w-8 p-0">
                      ✕
                    </Button>
                  </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Group Name</Label>
                            <Input 
                              placeholder="lockbit3" 
                              value={noteForm.group_name}
                              onChange={(e) => setNoteForm({...noteForm, group_name: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Note Title</Label>
                            <Input 
                              placeholder="LockBit 3.0 Standard Note" 
                              value={noteForm.note_title}
                              onChange={(e) => setNoteForm({...noteForm, note_title: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Filename</Label>
                            <Input 
                              placeholder="README.txt" 
                              value={noteForm.filename}
                              onChange={(e) => setNoteForm({...noteForm, filename: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>File Extensions (comma-separated)</Label>
                            <Input 
                              placeholder=".lockbit, .lock" 
                              value={noteForm.file_extensions}
                              onChange={(e) => setNoteForm({...noteForm, file_extensions: e.target.value})}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Note Content</Label>
                          <Textarea 
                            placeholder="Enter ransom note content..." 
                            className="min-h-[200px] font-mono text-sm"
                            value={noteForm.note_content}
                            onChange={(e) => setNoteForm({...noteForm, note_content: e.target.value})}
                          />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setNoteDialogOpen(false)
                      resetNoteForm()
                    }}>Cancel</Button>
                    <Button type="button" onClick={handleSaveNote} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Extensions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ransomNotes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/10">
                            <Shield className="h-3 w-3 mr-1" />
                            {note.group_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{note.note_title}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-secondary px-2 py-1 rounded">{note.filename}</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {note.file_extensions.map((ext, i) => (
                              <Badge key={i} variant="destructive" className="text-xs">{ext}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => editNote(note)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteNote(note.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Decryptors Tab */}
          <TabsContent value="decryptors">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Decryptors</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchDecryptors}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setDecryptorDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Decryptor
                  </Button>
                </div>
              </CardHeader>
              
              {/* Decryptor Dialog - Outside of CardHeader */}
              <Dialog open={decryptorDialogOpen} modal={true}>
                <DialogContent 
                  className="max-w-2xl max-h-[90vh] overflow-y-auto" 
                  onPointerDownOutside={(e) => e.preventDefault()} 
                  onInteractOutside={(e) => e.preventDefault()}
                  onEscapeKeyDown={(e) => e.preventDefault()}
                  showCloseButton={false}
                  aria-describedby="decryptor-dialog-description"
                >
                  <DialogHeader className="flex flex-row items-center justify-between">
                    <div>
                      <DialogTitle>{editingDecryptor ? 'Edit Decryptor' : 'Add New Decryptor'}</DialogTitle>
                      <p id="decryptor-dialog-description" className="text-sm text-muted-foreground mt-1">
                        {editingDecryptor ? 'Update decryptor information' : 'Add a new decryptor tool'}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setDecryptorDialogOpen(false); resetDecryptorForm(); }} className="h-8 w-8 p-0">
                      ✕
                    </Button>
                  </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Group Name</Label>
                            <Input 
                              placeholder="hive" 
                              value={decryptorForm.group_name}
                              onChange={(e) => setDecryptorForm({...decryptorForm, group_name: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Decryptor Name</Label>
                            <Input 
                              placeholder="Hive Decryptor" 
                              value={decryptorForm.decryptor_name}
                              onChange={(e) => setDecryptorForm({...decryptorForm, decryptor_name: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Provider</Label>
                            <Input 
                              placeholder="Emsisoft" 
                              value={decryptorForm.provider}
                              onChange={(e) => setDecryptorForm({...decryptorForm, provider: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Provider URL</Label>
                            <Input 
                              placeholder="https://www.emsisoft.com" 
                              value={decryptorForm.provider_url}
                              onChange={(e) => setDecryptorForm({...decryptorForm, provider_url: e.target.value})}
                              autoComplete="off"
                              data-lpignore="true"
                              data-form-type="other"
                              onFocus={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Download URL</Label>
                          <Input 
                            placeholder="https://www.emsisoft.com/ransomware-decryption/..." 
                            value={decryptorForm.download_url}
                            onChange={(e) => setDecryptorForm({...decryptorForm, download_url: e.target.value})}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            data-lpignore="true"
                            data-form-type="other"
                            onFocus={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <Label>Short Description</Label>
                          <Textarea 
                            placeholder="Brief description (shown in cards)..." 
                            className="min-h-[80px]"
                            value={decryptorForm.description}
                            onChange={(e) => setDecryptorForm({...decryptorForm, description: e.target.value})}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Shown in the decryptor cards list</p>
                        </div>
                        <div>
                          <Label>Detailed Description (optional)</Label>
                          <Textarea 
                            placeholder="Full detailed description (shown in detail page when expanded)..." 
                            className="min-h-[120px]"
                            value={decryptorForm.detailed_description}
                            onChange={(e) => setDecryptorForm({...decryptorForm, detailed_description: e.target.value})}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Expandable content on the detail page</p>
                        </div>
                        <div>
                          <Label>File Extensions</Label>
                          <Input 
                            placeholder=".hive, .key.hive, .encrypted" 
                            value={decryptorForm.file_extensions}
                            onChange={(e) => setDecryptorForm({...decryptorForm, file_extensions: e.target.value})}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Comma-separated</p>
                        </div>
                        
                        {/* How-To Guide Section */}
                        <div className="border border-border rounded-lg p-4 space-y-4">
                          <div>
                            <Label className="text-base font-semibold">How-To Guide</Label>
                            <p className="text-xs text-muted-foreground mt-1">Choose how to provide the guide</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={decryptorForm.how_to_guide_type === "none" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setDecryptorForm({...decryptorForm, how_to_guide_type: "none"})}
                            >
                              None
                            </Button>
                            <Button
                              type="button"
                              variant={decryptorForm.how_to_guide_type === "url" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setDecryptorForm({...decryptorForm, how_to_guide_type: "url"})}
                            >
                              External Link
                            </Button>
                            <Button
                              type="button"
                              variant={decryptorForm.how_to_guide_type === "pdf" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setDecryptorForm({...decryptorForm, how_to_guide_type: "pdf"})}
                            >
                              Upload PDF
                            </Button>
                            <Button
                              type="button"
                              variant={decryptorForm.how_to_guide_type === "text" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setDecryptorForm({...decryptorForm, how_to_guide_type: "text"})}
                            >
                              Write Text
                            </Button>
                          </div>

                          {decryptorForm.how_to_guide_type === "url" && (
                            <div>
                              <Label>Guide URL</Label>
                              <Input 
                                placeholder="https://example.com/guide" 
                                value={decryptorForm.how_to_guide_url}
                                onChange={(e) => setDecryptorForm({...decryptorForm, how_to_guide_url: e.target.value})}
                                autoComplete="off"
                                data-lpignore="true"
                                data-form-type="other"
                                onFocus={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}

                          {decryptorForm.how_to_guide_type === "pdf" && (
                            <div className="space-y-2">
                              <Label>Upload PDF</Label>
                              <Input 
                                type="file"
                                accept=".pdf"
                                onChange={handlePdfUpload}
                                disabled={uploadingPdf}
                              />
                              {uploadingPdf && <p className="text-xs text-primary">Uploading...</p>}
                              {decryptorForm.how_to_guide_url && (
                                <div className="flex items-center gap-2 text-sm text-green-500">
                                  <CheckCircle2 className="h-4 w-4" />
                                  PDF uploaded successfully
                                </div>
                              )}
                            </div>
                          )}

                          {decryptorForm.how_to_guide_type === "text" && (
                            <div>
                              <Label>Guide Content</Label>
                              <Textarea 
                                placeholder="Write your how-to guide here... (Markdown supported)"
                                className="min-h-[200px] font-mono text-sm"
                                value={decryptorForm.how_to_guide_text}
                                onChange={(e) => setDecryptorForm({...decryptorForm, how_to_guide_text: e.target.value})}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                You can use markdown formatting
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <Select value={decryptorForm.status} onValueChange={(v) => setDecryptorForm({...decryptorForm, status: v})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="limited">Limited</SelectItem>
                                <SelectItem value="outdated">Outdated</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Release Date</Label>
                            <Input 
                              type="date"
                              value={decryptorForm.release_date}
                              onChange={(e) => setDecryptorForm({...decryptorForm, release_date: e.target.value})}
                            />
                          </div>
                        </div>
                    <div>
                      <Label>Notes / Warnings (optional)</Label>
                      <Textarea 
                        placeholder="Important notes, warnings, or limitations..." 
                        className="min-h-[80px]"
                        value={decryptorForm.notes}
                        onChange={(e) => setDecryptorForm({...decryptorForm, notes: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Displayed as a warning on the detail page</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setDecryptorDialogOpen(false)
                      resetDecryptorForm()
                    }}>Cancel</Button>
                    <Button type="button" onClick={handleSaveDecryptor} disabled={loading} className="bg-green-600 hover:bg-green-700">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group</TableHead>
                      <TableHead>Decryptor</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {decryptors.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/10">
                            <Shield className="h-3 w-3 mr-1" />
                            {d.group_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{d.decryptor_name}</TableCell>
                        <TableCell>{d.provider}</TableCell>
                        <TableCell>
                          <Badge className={
                            d.status === 'active' ? 'bg-green-500/20 text-green-500' :
                            d.status === 'limited' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-red-500/20 text-red-500'
                          }>
                            {d.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => editDecryptor(d)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteDecryptor(d.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Groups Management</CardTitle>
                <div className="flex gap-2 items-center">
                  <Input 
                    placeholder="Search groups..." 
                    className="w-64"
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={fetchGroups}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Logo</TableHead>
                        <TableHead>Group Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGroups.slice(0, 50).map((group) => (
                        <TableRow key={group.name}>
                          <TableCell>
                            {group.logo_url ? (
                              <img 
                                src={`${getApiBase()}${group.logo_url}`} 
                                alt={group.name} 
                                className="w-8 h-8 object-contain rounded bg-zinc-800"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-zinc-800/50 flex items-center justify-center text-muted-foreground text-xs">
                                💀
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{group.name}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {group.description || group.meta || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={group.parser ? 'bg-green-500/20 text-green-500' : 'bg-zinc-500/20 text-zinc-400'}>
                              {group.parser ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEditGroup(group)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredGroups.length > 50 && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Showing 50 of {filteredGroups.length} groups. Use search to filter.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Group Edit Dialog */}
            <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Group: {groupForm.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Logo Upload Section */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Group Logo
                    </Label>
                    <div className="flex items-center gap-4">
                      {groupForm.logo_url ? (
                        <div className="relative">
                          <img 
                            src={groupForm.logo_url} 
                            alt={groupForm.name} 
                            className="w-16 h-16 object-contain rounded-lg border border-border bg-zinc-800"
                          />
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm" 
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                            onClick={handleDeleteLogo}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-dashed border-border bg-zinc-800/50 flex items-center justify-center text-muted-foreground">
                          <Image className="h-6 w-6" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input 
                          type="file"
                          accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.ico"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, GIF, WEBP, SVG, ICO (recommended: 128x128px)
                        </p>
                        {uploadingLogo && <p className="text-xs text-primary">Uploading...</p>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Seen</Label>
                      <Input 
                        placeholder="e.g., March 2023"
                        value={groupForm.first_seen}
                        onChange={(e) => setGroupForm({...groupForm, first_seen: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country of Origin</Label>
                      <Input 
                        placeholder="e.g., Russia"
                        value={groupForm.country_origin}
                        onChange={(e) => setGroupForm({...groupForm, country_origin: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Targets</Label>
                    <Input 
                      placeholder="e.g., Healthcare, Finance, Manufacturing"
                      value={groupForm.targets}
                      onChange={(e) => setGroupForm({...groupForm, targets: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>File Extensions</Label>
                    <Input 
                      placeholder="e.g., .locked, .encrypted"
                      value={groupForm.extensions}
                      onChange={(e) => setGroupForm({...groupForm, extensions: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Short Description (Meta)</Label>
                    <Input 
                      placeholder="Brief description for search/preview"
                      value={groupForm.meta}
                      onChange={(e) => setGroupForm({...groupForm, meta: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Description</Label>
                    <Textarea 
                      placeholder="Detailed description of the ransomware group..."
                      className="min-h-[120px]"
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setGroupDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveGroup} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <div className="grid gap-6">
              {/* About Page Content */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    About Page Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hero Title</Label>
                      <Input 
                        value={aboutContent.hero_title}
                        onChange={(e) => setAboutContent({...aboutContent, hero_title: e.target.value})}
                        placeholder="Dragons Eye"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hero Subtitle</Label>
                      <Input 
                        value={aboutContent.hero_subtitle}
                        onChange={(e) => setAboutContent({...aboutContent, hero_subtitle: e.target.value})}
                        placeholder="Ransomware Tracker"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Description</Label>
                    <Textarea 
                      value={aboutContent.hero_description}
                      onChange={(e) => setAboutContent({...aboutContent, hero_description: e.target.value})}
                      placeholder="Short description for hero section"
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Main Description</Label>
                    <Textarea 
                      value={aboutContent.main_description}
                      onChange={(e) => setAboutContent({...aboutContent, main_description: e.target.value})}
                      placeholder="Main description about the platform"
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Community Description</Label>
                    <Textarea 
                      value={aboutContent.community_description}
                      onChange={(e) => setAboutContent({...aboutContent, community_description: e.target.value})}
                      placeholder="Description about Dragons Community"
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Contact Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contact Email</Label>
                        <Input 
                          value={aboutContent.contact_email}
                          onChange={(e) => setAboutContent({...aboutContent, contact_email: e.target.value})}
                          placeholder="info@dragons.community"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Security Email</Label>
                        <Input 
                          value={aboutContent.security_email}
                          onChange={(e) => setAboutContent({...aboutContent, security_email: e.target.value})}
                          placeholder="security@dragons.community"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Website URL</Label>
                        <Input 
                          value={aboutContent.website_url}
                          onChange={(e) => setAboutContent({...aboutContent, website_url: e.target.value})}
                          placeholder="https://dragons.community"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Partners Email</Label>
                        <Input 
                          value={aboutContent.partners_email}
                          onChange={(e) => setAboutContent({...aboutContent, partners_email: e.target.value})}
                          placeholder="partners@dragons.community"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Social Links</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Discord URL</Label>
                        <Input 
                          value={aboutContent.discord_url}
                          onChange={(e) => setAboutContent({...aboutContent, discord_url: e.target.value})}
                          placeholder="https://discord.gg/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telegram URL</Label>
                        <Input 
                          value={aboutContent.telegram_url}
                          onChange={(e) => setAboutContent({...aboutContent, telegram_url: e.target.value})}
                          placeholder="https://t.me/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Twitter/X URL</Label>
                        <Input 
                          value={aboutContent.twitter_url}
                          onChange={(e) => setAboutContent({...aboutContent, twitter_url: e.target.value})}
                          placeholder="https://x.com/..."
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveAbout} disabled={loading} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save About Content'}
                  </Button>
                </CardContent>
              </Card>

              {/* Dashboard Widgets */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Dashboard Widgets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enable or disable widgets on the main dashboard
                  </p>
                  <div className="space-y-4">
                    {widgets.map((widget) => (
                      <div key={widget.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {widget.type === 'stats' && <BarChart3 className="h-5 w-5 text-primary" />}
                          {widget.type === 'list' && <List className="h-5 w-5 text-primary" />}
                          {widget.type === 'chart' && <BarChart3 className="h-5 w-5 text-primary" />}
                          {widget.type === 'map' && <Map className="h-5 w-5 text-primary" />}
                          <div>
                            <p className="font-medium">{widget.title}</p>
                            <p className="text-sm text-muted-foreground">Type: {widget.type}</p>
                          </div>
                        </div>
                        <Switch 
                          checked={widget.enabled}
                          onCheckedChange={(checked) => handleToggleWidget(widget.id, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="grid gap-6">
              {/* Data Update Card */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Data Update
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="font-medium">Manual Update</p>
                      <p className="text-sm text-muted-foreground">
                        Trigger a manual data update from ransomware leak sites via Tor
                      </p>
                    </div>
                    <Button 
                      onClick={async () => {
                        setUpdating(true)
                        try {
                          const res = await fetch(`${getApiBase()}/api/v1/update/trigger`, { method: 'POST' })
                          if (res.ok) {
                            showMessage('success', 'Update started!')
                          } else {
                            showMessage('error', 'Failed to start update')
                          }
                        } catch (err) {
                          showMessage('error', 'Error triggering update')
                        }
                        setTimeout(() => setUpdating(false), 3000)
                      }}
                      disabled={updating}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {updating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Update Now
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-4 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <p className="font-medium">Auto-Update Scheduler</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Data is automatically updated every <strong className="text-primary">1 hour</strong> from ransomware leak sites via Tor network.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Logo Scraping Card */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Logo Scraping
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="font-medium">Scrape Group Logos</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically fetch logos/favicons from ransomware group sites via Tor
                      </p>
                    </div>
                    <Button 
                      onClick={async () => {
                        setLoading(true)
                        try {
                          const res = await fetch(`${getApiBase()}/api/v1/scrape-logos`, { method: 'POST' })
                          if (res.ok) {
                            showMessage('success', 'Logo scraping started! This may take a while.')
                          } else {
                            showMessage('error', 'Failed to start logo scraping')
                          }
                        } catch (err) {
                          showMessage('error', 'Error starting logo scraping')
                        }
                        setLoading(false)
                      }}
                      disabled={loading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Scrape Logos
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Logos are automatically detected from favicon and header images. You can also manually upload logos in the Groups tab.
                  </p>
                </CardContent>
              </Card>

              {/* System Info Card */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-zinc-800/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Application</p>
                      <p className="font-medium">Dragons Eye - Ransomware Tracker</p>
                    </div>
                    <div className="p-4 bg-zinc-800/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Version</p>
                      <p className="font-medium">1.0.0</p>
                    </div>
                    <div className="p-4 bg-zinc-800/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Ransom Notes</p>
                      <p className="font-medium">{ransomNotes.length} entries</p>
                    </div>
                    <div className="p-4 bg-zinc-800/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Decryptors</p>
                      <p className="font-medium">{decryptors.length} entries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
