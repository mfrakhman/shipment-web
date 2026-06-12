export interface SavedAddress {
  id: string
  label: string
  provinceId: string
  provinceLabel: string
  cityId: string
  cityLabel: string
  districtId: string
  districtLabel: string
  subdistrictId: number
  subdistrictLabel: string
  street?: string
}

export interface SavedAddressRequest {
  label: string
  provinceId: string
  provinceLabel: string
  cityId: string
  cityLabel: string
  districtId: string
  districtLabel: string
  subdistrictId: number
  subdistrictLabel: string
  street?: string
}

async function authedGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${token}` } })
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json.data
}

async function authedPost<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json.data
}

async function authedDelete(path: string, token: string): Promise<void> {
  const res = await fetch(`/api${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
}

export const addressApi = {
  getAll: (token: string) => authedGet<SavedAddress[]>('/address', token),
  save: (req: SavedAddressRequest, token: string) =>
    authedPost<SavedAddress>('/address', req, token),
  delete: (id: string, token: string) => authedDelete(`/address/${id}`, token),
}
