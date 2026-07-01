// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'CONSUMER' | 'AGENT' | 'MERCHANT'
export type ReportStatus = 'PENDING' | 'VERIFIED' | 'RESOLVED' | 'REJECTED'
export type ReportPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'
export type MissionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'
export type MerchantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

// ─── Entités ──────────────────────────────────────────────────────────────────

export interface User { id: number; name: string; email: string; role: Role; region?: string }
export interface Region { id: number; name: string }
export interface Product { id: number; name: string; category: string; unit: string }

export interface OfficialPrice {
  id: number; productId: number; productName: string; category: string; unit: string
  regionId: number; regionName: string; price: number; currency: string
  validFrom: string; validTo?: string
}

export interface Merchant {
  id: number; name: string; address: string; region: string
  lat?: number; lng?: number; status: MerchantStatus
}

export interface Report {
  id: number; productId: number; productName: string
  merchantId?: number; merchantName?: string
  regionId: number; regionName: string
  priceObserved: number; officialPrice?: number; description?: string
  status: ReportStatus; priority: ReportPriority
  lat?: number; lng?: number; createdAt: string; consumerName?: string
}

export interface Mission {
  id: number; agentId: number; agentName?: string
  regionId: number; regionName: string
  title: string; description?: string
  status: MissionStatus; scheduledDate?: string; createdAt: string
}

export interface Notification { id: number; message: string; type: string; isRead: boolean; createdAt: string }

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface AuthResponse { token: string; user: User }

export interface DashboardStats {
  totalReports: number; criticalReports: number; highReports: number
  resolvedReports: number; totalMerchants: number; totalUsers: number
  totalRegions: number; pendingReports: number
  reportsByRegion: { region: string; count: number }[]
  reportsByPriority: { priority: ReportPriority; count: number }[]
  recentReports: Report[]
}

export interface ReportCreateRequest {
  productId: number; regionId: number; merchantId?: number
  priceObserved: number; description?: string; lat?: number; lng?: number
}

export interface MissionCreateRequest { regionId: number; title: string; description?: string; scheduledDate?: string }
