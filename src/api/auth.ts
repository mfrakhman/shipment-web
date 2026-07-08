export interface TokenResponse {
  token: string
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json.data
}

export const authApi = {
  login: (email: string, password: string) =>
    post<TokenResponse>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    post<TokenResponse>('/auth/register', { name, email, password }),
}
