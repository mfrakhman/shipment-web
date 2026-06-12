export interface Province {
  id: string
  name: string
}

export interface City {
  id: string
  name: string
  type: string
}

export interface District {
  id: string
  name: string
}

export interface Subdistrict {
  id: string
  name: string
  postalCode: string
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json.data
}

export const locationApi = {
  getProvinces: () => get<Province[]>('/location/provinces'),
  getCities: (provinceId: string) => get<City[]>(`/location/cities?provinceId=${provinceId}`),
  getDistricts: (cityId: string) => get<District[]>(`/location/districts?cityId=${cityId}`),
  getSubdistricts: (districtId: string) =>
    get<Subdistrict[]>(`/location/subdistricts?districtId=${districtId}`),
}
