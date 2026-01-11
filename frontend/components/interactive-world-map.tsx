"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

// Comprehensive ISO 2-letter code to GeoJSON country name mapping
const isoToGeoName: Record<string, string[]> = {
  "US": ["United States of America", "United States", "USA"],
  "CA": ["Canada"],
  "MX": ["Mexico"],
  "GB": ["United Kingdom", "UK", "Great Britain"],
  "DE": ["Germany"],
  "FR": ["France"],
  "IT": ["Italy"],
  "ES": ["Spain"],
  "NL": ["Netherlands"],
  "BE": ["Belgium"],
  "CH": ["Switzerland"],
  "AT": ["Austria"],
  "SE": ["Sweden"],
  "NO": ["Norway"],
  "DK": ["Denmark"],
  "FI": ["Finland"],
  "PL": ["Poland"],
  "CZ": ["Czech Republic", "Czechia"],
  "PT": ["Portugal"],
  "IE": ["Ireland"],
  "GR": ["Greece"],
  "HU": ["Hungary"],
  "RO": ["Romania"],
  "BG": ["Bulgaria"],
  "HR": ["Croatia"],
  "SK": ["Slovakia"],
  "SI": ["Slovenia"],
  "RS": ["Serbia"],
  "BA": ["Bosnia and Herzegovina", "Bosnia and Herz."],
  "AL": ["Albania"],
  "MK": ["North Macedonia", "Macedonia"],
  "ME": ["Montenegro"],
  "XK": ["Kosovo"],
  "EE": ["Estonia"],
  "LV": ["Latvia"],
  "LT": ["Lithuania"],
  "BY": ["Belarus"],
  "MD": ["Moldova"],
  "RU": ["Russia", "Russian Federation"],
  "UA": ["Ukraine"],
  "AU": ["Australia"],
  "NZ": ["New Zealand"],
  "JP": ["Japan"],
  "KR": ["South Korea", "Korea, Republic of", "Republic of Korea"],
  "KP": ["North Korea", "Korea, Democratic People's Republic of"],
  "CN": ["China", "People's Republic of China"],
  "IN": ["India"],
  "TW": ["Taiwan"],
  "HK": ["Hong Kong"],
  "SG": ["Singapore"],
  "MY": ["Malaysia"],
  "TH": ["Thailand"],
  "ID": ["Indonesia"],
  "PH": ["Philippines"],
  "VN": ["Vietnam", "Viet Nam"],
  "MM": ["Myanmar", "Burma"],
  "BD": ["Bangladesh"],
  "PK": ["Pakistan"],
  "LK": ["Sri Lanka"],
  "NP": ["Nepal"],
  "BR": ["Brazil"],
  "AR": ["Argentina"],
  "CL": ["Chile"],
  "CO": ["Colombia"],
  "PE": ["Peru"],
  "VE": ["Venezuela"],
  "EC": ["Ecuador"],
  "BO": ["Bolivia"],
  "PY": ["Paraguay"],
  "UY": ["Uruguay"],
  "ZA": ["South Africa"],
  "EG": ["Egypt"],
  "NG": ["Nigeria"],
  "KE": ["Kenya"],
  "MA": ["Morocco"],
  "DZ": ["Algeria"],
  "TN": ["Tunisia"],
  "LY": ["Libya"],
  "GH": ["Ghana"],
  "ET": ["Ethiopia"],
  "TZ": ["Tanzania", "United Republic of Tanzania"],
  "UG": ["Uganda"],
  "SD": ["Sudan"],
  "SA": ["Saudi Arabia"],
  "AE": ["United Arab Emirates", "UAE"],
  "IL": ["Israel"],
  "TR": ["Turkey", "Türkiye"],
  "IR": ["Iran", "Islamic Republic of Iran"],
  "IQ": ["Iraq"],
  "JO": ["Jordan"],
  "LB": ["Lebanon"],
  "SY": ["Syria", "Syrian Arab Republic"],
  "KW": ["Kuwait"],
  "QA": ["Qatar"],
  "BH": ["Bahrain"],
  "OM": ["Oman"],
  "YE": ["Yemen"],
  "AF": ["Afghanistan"],
  "KZ": ["Kazakhstan"],
  "UZ": ["Uzbekistan"],
  "TM": ["Turkmenistan"],
  "AZ": ["Azerbaijan"],
  "GE": ["Georgia"],
  "AM": ["Armenia"],
  "CY": ["Cyprus"],
  "MT": ["Malta"],
  "IS": ["Iceland"],
  "LU": ["Luxembourg"],
  "MC": ["Monaco"],
  "AD": ["Andorra"],
  "LI": ["Liechtenstein"],
  "SM": ["San Marino"],
  "VA": ["Vatican City", "Holy See"],
  "PA": ["Panama"],
  "CR": ["Costa Rica"],
  "NI": ["Nicaragua"],
  "HN": ["Honduras"],
  "SV": ["El Salvador"],
  "GT": ["Guatemala"],
  "BZ": ["Belize"],
  "CU": ["Cuba"],
  "JM": ["Jamaica"],
  "HT": ["Haiti"],
  "DO": ["Dominican Republic", "Dominican Rep."],
  "PR": ["Puerto Rico"],
  "TT": ["Trinidad and Tobago"],
}

// Create reverse mapping: geo name -> ISO code
const geoNameToIso: Record<string, string> = {}
Object.entries(isoToGeoName).forEach(([iso, names]) => {
  names.forEach(name => {
    geoNameToIso[name.toLowerCase()] = iso
  })
})

interface CountryData {
  iso: string
  count: number
}

function getApiBase(): string {
  // Environment variable override
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Production check
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('dragons.community') || 
        window.location.hostname.includes('vercel.app')) {
      return 'https://ransomwareapi.dragons.community';
    }
    // Local development
    return `http://${window.location.hostname}:8000`;
  }
  
  return "http://localhost:8000";
}

export function InteractiveWorldMap() {
  const router = useRouter()
  const [hoveredCountry, setHoveredCountry] = useState<{ name: string; count: number; iso: string } | null>(null)
  const [countryData, setCountryData] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // Fetch country stats (get all countries, not just top 20)
  useEffect(() => {
    fetch(`${getApiBase()}/api/v1/stats/countries?limit=100`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
          const stats: Record<string, number> = {}
            data.data.forEach((item: { country: string; count: number }) => {
              if (item.country && item.country !== 'Unknown' && item.country !== 'N/A') {
              // Store by ISO code
              stats[item.country.toUpperCase()] = item.count
              }
            })
          setCountryData(stats)
          }
        })
        .catch(err => console.error('Failed to fetch country stats:', err))
        .finally(() => setLoading(false))
  }, [])

  const maxCount = useMemo(() => {
    const counts = Object.values(countryData)
    return counts.length > 0 ? Math.max(...counts) : 100
  }, [countryData])

  // Get count for a geography name
  const getCountForGeo = (geoName: string): number => {
    // Find ISO code from geo name
    const iso = geoNameToIso[geoName.toLowerCase()]
    if (iso && countryData[iso]) {
      return countryData[iso]
    }
    return 0
  }

  // Get ISO code for a geography name
  const getIsoForGeo = (geoName: string): string | null => {
    return geoNameToIso[geoName.toLowerCase()] || null
  }

  // Handle country click
  const handleCountryClick = (geoName: string) => {
    const iso = getIsoForGeo(geoName)
    const count = getCountForGeo(geoName)
    if (iso && count > 0) {
      router.push(`/country/${iso}`)
    }
  }

  const getCountryColor = (geoName: string) => {
    const count = getCountForGeo(geoName)
    
    if (count === 0) return "#18181b" // zinc-900 - no data (matches card bg)
    
    const ratio = count / maxCount
    if (ratio >= 0.3) return "#dc2626" // red-600 - Critical
    if (ratio >= 0.15) return "#ea580c" // orange-600 - High
    if (ratio >= 0.05) return "#f59e0b" // amber-500 - Medium
    return "#eab308" // yellow-500 - Low
  }

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Geographic Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px]">
          <div className="text-muted-foreground text-sm">Loading map...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Geographic Distribution
          {hoveredCountry && (
            <span className="ml-auto text-xs font-normal bg-primary/20 text-primary px-2 py-0.5 rounded">
              {hoveredCountry.name}: <strong>{hoveredCountry.count.toLocaleString()}</strong> victims
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {/* Map Container */}
        <div className="relative rounded-lg overflow-hidden">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 100,
              center: [0, 40],
            }}
            width={800}
            height={400}
            style={{
              width: "100%",
              height: "auto",
              aspectRatio: "2/1",
            }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName = geo.properties.name || ""
                  const count = getCountForGeo(geoName)
                  const hasData = count > 0
                  const fillColor = getCountryColor(geoName)

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke="#09090b"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: {
                          fill: hasData ? "#ef4444" : "#3f3f46", 
                          outline: "none",
                          cursor: hasData ? "pointer" : "default"
                        },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={() => {
                        if (hasData) {
                          const iso = geoNameToIso[geoName.toLowerCase()] || ''
                          setHoveredCountry({ name: geoName, count, iso })
                        }
                      }}
                      onMouseLeave={() => setHoveredCountry(null)}
                      onClick={() => handleCountryClick(geoName)}
                    />
                  )
                })
              }
            </Geographies>
          </ComposableMap>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded border border-zinc-700" style={{ backgroundColor: "#18181b" }} />
            <span className="text-muted-foreground">No Data</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: "#eab308" }} />
            <span className="text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: "#f59e0b" }} />
            <span className="text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: "#ea580c" }} />
            <span className="text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: "#dc2626" }} />
            <span className="text-muted-foreground">Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
