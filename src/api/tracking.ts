export interface TrackRequest {
  awb: string
  courier: string
  lastPhoneNumber?: string
}

export interface TrackSummary {
  courierCode: string
  courierName: string
  waybillNumber: string
  serviceCode: string
  waybillDate: string
  shipperName: string
  receiverName: string
  origin: string
  destination: string
  status: string
}

export interface DeliveryStatus {
  status: string
  podReceiver: string
  podDate: string
  podTime: string
}

export interface ManifestEntry {
  code: string
  description: string
  date: string
  time: string
  cityName: string
}

export interface TrackResult {
  delivered: boolean
  summary: TrackSummary
  deliveryStatus: DeliveryStatus
  manifest: ManifestEntry[]
}

export interface TrackingHistoryItem {
  id: string
  awb: string
  courier: string
  courierName: string
  status: string
  delivered: boolean
  manifest: ManifestEntry[]
  createdAt: string
}

export const trackingApi = {
  getHistory: async (token: string): Promise<TrackingHistoryItem[]> => {
    const res = await fetch('/api/tracking/history', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.message)
    return json.data
  },

  track: async (req: TrackRequest, token: string): Promise<TrackResult> => {
    const res = await fetch('/api/tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(req),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.message ?? 'Tracking failed')
    return json.data
  },
}

export const COURIERS = [
  { code: 'jne', name: 'JNE' },
  { code: 'jnt', name: 'J&T Express' },
  { code: 'sicepat', name: 'SiCepat' },
  { code: 'anteraja', name: 'Anteraja' },
  { code: 'pos', name: 'POS Indonesia' },
  { code: 'tiki', name: 'TIKI' },
  { code: 'lion', name: 'Lion Parcel' },
  { code: 'ninja', name: 'Ninja Xpress' },
  { code: 'ide', name: 'ID Express' },
  { code: 'rpx', name: 'RPX' },
  { code: 'wahana', name: 'Wahana' },
  { code: 'gosend', name: 'GoSend' },
  { code: 'grab', name: 'GrabExpress' },
]
