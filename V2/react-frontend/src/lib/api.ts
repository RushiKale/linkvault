const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request failed: ${res.status}`)
  }
  return res.json()
}

export function login(email: string, password: string) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function register(email: string, password: string, firstName: string, lastName: string) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, firstName, lastName }),
  })
}

export function getMe() {
  return request('/auth/me')
}

export function getLinks(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request('/links' + qs)
}

export function searchLinks(params: Record<string, string>) {
  return request('/search?' + new URLSearchParams(params).toString())
}

export function createLink(data: {
  url: string
  title: string
  description?: string
  collectionId: string
  tags?: string[]
}) {
  return request('/links', { method: 'POST', body: JSON.stringify(data) })
}

export function updateLink(id: string, data: {
  title?: string
  description?: string
  notes?: string
  collectionId?: string
  tags?: string[]
}) {
  return request(`/links/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteLink(id: string) {
  return request(`/links/${id}`, { method: 'DELETE' })
}

export function getCollections() {
  return request('/collections')
}

export function createCollection(data: { name: string; color?: string; teamId?: string }) {
  return request('/collections', { method: 'POST', body: JSON.stringify(data) })
}

export function updateCollection(id: string, data: { name?: string; color?: string; order?: number }) {
  return request(`/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteCollection(id: string) {
  return request(`/collections/${id}`, { method: 'DELETE' })
}

export function getTags(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : ''
  return request('/tags' + qs)
}

export function toggleFavorite(linkId: string) {
  return request(`/favorites/${linkId}`, { method: 'POST' })
}

export function getFavorites() {
  return request('/favorites')
}

export function getActivity() {
  return request('/activity')
}

export function exportData() {
  return request('/export')
}

export function importData(data: { links: Array<{ url: string; title?: string; collection?: string; tags?: string[] }> }) {
  return request('/import', { method: 'POST', body: JSON.stringify(data) })
}

// --- Teams ---

export function getOrganizations() {
  return request('/organizations')
}

export function createOrganization(data: { name: string; slug: string }) {
  return request('/organizations', { method: 'POST', body: JSON.stringify(data) })
}

export function getTeams() {
  return request('/teams')
}

export function getTeam(id: string) {
  return request(`/teams/${id}`)
}

export function createTeam(data: { orgId: string; name: string; slug: string; description?: string }) {
  return request('/teams', { method: 'POST', body: JSON.stringify(data) })
}

export function renameTeam(id: string, name: string) {
  return request(`/teams/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) })
}

export function getTeamMembers(teamId: string) {
  return request(`/teams/${teamId}/members`)
}

export function updateMemberRole(teamId: string, userId: string, role: string) {
  return request(`/teams/${teamId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) })
}

export function removeMember(teamId: string, userId: string) {
  return request(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' })
}

export function createInvite(teamId: string) {
  return request(`/teams/${teamId}/invite`, { method: 'POST' })
}

export function joinTeam(token: string) {
  return request('/teams/join', { method: 'POST', body: JSON.stringify({ token }) })
}

export function getTeamProject(teamId: string) {
  return request(`/teams/${teamId}/project`)
}

export function renameProject(teamId: string, name: string) {
  return request(`/teams/${teamId}/project`, { method: 'PATCH', body: JSON.stringify({ name }) })
}

export function deleteProject(teamId: string, force = false) {
  return request(`/teams/${teamId}/project?force=${force}`, { method: 'DELETE' })
}
