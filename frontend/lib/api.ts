/**
 * 🐉 Dragons-RansomwareMonitoring API Client
 * TypeScript API client for interacting with the backend
 */

// Dynamic API URL - uses same hostname as frontend but port 8000
function getApiBaseUrl(): string {
  // Environment variable override
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Client-side - use same hostname as browser
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:8000`;
  }
  
  // Server-side - try to get from headers or fallback
  return 'http://localhost:8000';
}

// ============================================================================
// Types
// ============================================================================

export interface StatsSummary {
  total_victims: number;
  total_groups: number;
  active_groups: number;
  countries_affected: number;
  today_new: number;
  top_group: string;
  top_group_count: number;
}

export interface CountryStats {
  country: string;
  count: number;
  percentage: number;
}

export interface SectorStats {
  sector: string;
  count: number;
  percentage: number;
}

export interface GroupStats {
  group: string;
  count: number;
  percentage: number;
}

export interface TrendData {
  date: string;
  count: number;
}

export interface Victim {
  post_title: string;
  group_name: string;
  discovered: string;
  description?: string;
  website?: string;
  published?: string;
  post_url?: string;
  country?: string;
  activity?: string;
  duplicates?: any[];
  extrainfos?: any[];
  infostealer?: string[];
  screenshot?: string;
  _index?: number;
}

export interface Group {
  name: string;
  victim_count: number;
  is_active: boolean;
  locations_count: number;
  meta?: string | null;
  description?: string | null;
  has_parser: boolean;
  logo_url?: string | null;
}

export interface GroupDetail extends Group {
  captcha?: boolean;
  parser?: boolean;
  javascript_render?: boolean;
  locations?: any[];
  profile?: any[];
  recent_victims?: Victim[];
  country_distribution?: Record<string, number>;
  sector_distribution?: Record<string, number>;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  pages: number;
  data: T[];
}

export interface StatsListResponse<T> {
  total: number;
  data: T[];
}

export interface TrendResponse {
  start_date: string;
  end_date: string;
  total_days: number;
  data: TrendData[];
}

export interface DataStatus {
  data_freshness: 'fresh' | 'stale' | 'outdated' | 'missing';
  message: string;
  update_in_progress: boolean;
  victims: {
    exists: boolean;
    modified?: string;
    age_hours?: number;
    age_human?: string;
  };
  groups: {
    exists: boolean;
    modified?: string;
    age_hours?: number;
    age_human?: string;
  };
  scheduler: {
    status: string;
    last_update?: string;
    last_scrape?: string;
    last_parse?: string;
    last_error?: string;
    message?: string;
  };
  timestamp: string;
}

export interface UpdateTriggerResponse {
  success: boolean;
  message: string;
  status: string;
  note?: string;
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${endpoint}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Health Check
export async function checkHealth(): Promise<{ status: string; victims_count: number; groups_count: number }> {
  return fetchAPI('/health');
}

// Data Status
export async function getDataStatus(): Promise<DataStatus> {
  return fetchAPI('/api/v1/status');
}

// Trigger Update
export async function triggerUpdate(): Promise<UpdateTriggerResponse> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/update/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  
  return res.json();
}

// Clear Cache
export async function clearCache(): Promise<{ success: boolean; message: string }> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/cache/clear`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  
  return res.json();
}

// ============================================================================
// Statistics API
// ============================================================================

export async function getStatsSummary(): Promise<StatsSummary> {
  return fetchAPI('/api/v1/stats/summary');
}

export async function getCountryStats(limit = 20): Promise<StatsListResponse<CountryStats>> {
  return fetchAPI(`/api/v1/stats/countries?limit=${limit}`);
}

export async function getSectorStats(limit = 15): Promise<StatsListResponse<SectorStats>> {
  return fetchAPI(`/api/v1/stats/sectors?limit=${limit}`);
}

export async function getGroupStats(limit = 20): Promise<StatsListResponse<GroupStats>> {
  return fetchAPI(`/api/v1/stats/groups?limit=${limit}`);
}

export async function getTrendStats(days = 30): Promise<TrendResponse> {
  return fetchAPI(`/api/v1/stats/trend?days=${days}`);
}

// ============================================================================
// Victims API
// ============================================================================

export interface VictimsParams {
  page?: number;
  limit?: number;
  group?: string;
  country?: string;
  sector?: string;
  search?: string;
  sort?: 'asc' | 'desc';
}

export async function getVictims(params: VictimsParams = {}): Promise<PaginatedResponse<Victim>> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.group) searchParams.set('group', params.group);
  if (params.country) searchParams.set('country', params.country);
  if (params.sector) searchParams.set('sector', params.sector);
  if (params.search) searchParams.set('search', params.search);
  if (params.sort) searchParams.set('sort', params.sort);
  
  const query = searchParams.toString();
  return fetchAPI(`/api/v1/victims${query ? `?${query}` : ''}`);
}

export async function getVictimById(index: number): Promise<Victim> {
  return fetchAPI(`/api/v1/victims/${index}`);
}

export async function searchVictims(query: string, limit = 50): Promise<{ total: number; data: Victim[] }> {
  return fetchAPI(`/api/v1/victims/search/${encodeURIComponent(query)}?limit=${limit}`);
}

// ============================================================================
// Groups API
// ============================================================================

export async function getGroups(activeOnly = false, search?: string): Promise<{ total: number; data: Group[] }> {
  const params = new URLSearchParams();
  if (activeOnly) params.set('active_only', 'true');
  if (search) params.set('search', search);
  
  const query = params.toString();
  return fetchAPI(`/api/v1/groups${query ? `?${query}` : ''}`);
}

export async function getGroupByName(name: string): Promise<GroupDetail> {
  return fetchAPI(`/api/v1/groups/${encodeURIComponent(name)}`);
}

export async function getGroupVictims(
  name: string, 
  page = 1, 
  limit = 25
): Promise<{ group: string; total: number; page: number; limit: number; pages: number; data: Victim[] }> {
  return fetchAPI(`/api/v1/groups/${encodeURIComponent(name)}/victims?page=${page}&limit=${limit}`);
}

// ============================================================================
// Utilities
// ============================================================================

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return 'Unknown';
  
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}

export function getCountryName(countryCode: string): string {
  if (!countryCode) return 'Unknown';
  
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(countryCode.toUpperCase()) || countryCode;
  } catch {
    return countryCode;
  }
}

// ============================================================================
// Ransom Notes API
// ============================================================================

export interface RansomNote {
  id: string;
  group_name: string;
  note_title: string;
  note_content: string;
  filename: string;
  file_extensions: string[];
  created_at: string;
  updated_at: string;
}

export async function getRansomNotes(group?: string): Promise<{ total: number; data: RansomNote[] }> {
  const params = group ? `?group=${group}` : '';
  return fetchAPI(`/api/v1/ransom-notes${params}`);
}

export async function getRansomNotesByGroup(groupName: string): Promise<RansomNote[]> {
  const res = await getRansomNotes(groupName);
  return res.data;
}

// ============================================================================
// Decryptors API
// ============================================================================

export interface Decryptor {
  id: string;
  group_name: string;
  decryptor_name: string;
  provider: string;
  provider_url: string;
  download_url: string;
  description: string;
  detailed_description?: string;
  file_extensions: string[];
  status: string;
  release_date: string;
  notes: string;
  how_to_guide_type?: 'none' | 'url' | 'text' | 'pdf';
  how_to_guide_url?: string;
  how_to_guide_text?: string;
  created_at: string;
  updated_at: string;
}

export async function getDecryptors(status?: string, group?: string): Promise<{ total: number; data: Decryptor[] }> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (group) params.set('group', group);
  const query = params.toString();
  return fetchAPI(`/api/v1/decryptors${query ? `?${query}` : ''}`);
}

export async function getDecryptorById(id: string): Promise<Decryptor> {
  return fetchAPI(`/api/v1/decryptors/${id}`);
}

export async function getDecryptorByGroup(groupName: string): Promise<Decryptor | null> {
  const res = await getDecryptors(undefined, groupName);
  return res.data.length > 0 ? res.data[0] : null;
}

