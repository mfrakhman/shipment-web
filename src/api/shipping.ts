export interface CostRequest {
  originId: number
  originLabel: string
  originStreet?: string
  destinationId: number
  destinationLabel: string
  destinationStreet?: string
  weight: number
}

export interface CourierResult {
  name: string
  code: string
  service: string
  description: string
  cost: number
  etd: string
}

export interface CostResult {
  historyId: string
  fromCache: boolean
  origin: string
  destination: string
  weight: number
  couriers: CourierResult[]
}

export interface HistoryItem {
  id: string
  origin: string
  destination: string
  weight: number
  createdAt: string
}

async function authedGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json.data
}

async function authedPost<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json.data
}

export const shippingApi = {
  calculateCost: (req: CostRequest, token: string) =>
    authedPost<CostResult>('/shipping/cost', req, token),
  getHistory: (token: string) => authedGet<HistoryItem[]>('/shipping/history', token),
  getHistoryById: (id: string, token: string) =>
    authedGet<CostResult>(`/shipping/history/${id}`, token),
}
