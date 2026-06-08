// composables/useAdmin.ts

export interface AdminUser {
  id: number
  username: string
  email: string
  createdAt: string
  roleId: number
  roleName: string
  roleColor: string | null
}

export interface AdminUserDetail extends AdminUser {
  description: string | null
  notified: boolean
  questionCount: number
  replyCount: number
  ticketCount: number
}

export interface AdminStats {
  users: number
  questions: number
  replies: number
  tickets: number
  openTickets: number
}

export interface AdminQuestion {
  id: number
  title: string
  createdAt: string
  authorId: number
  authorName: string
  replyCount: number
}

export interface AdminTicket {
  id: number
  subject: string
  createdAt: string
  resolvedAt: string | null
  requesterName: string,
  requesterId: number
}

export interface Role {
  id: number
  name: string
  color: string | null
  canReply: boolean
  canDeleteReply: boolean
  canPostTicket: boolean
  canAcceptTicket: boolean
}

async function apiFetch(url: string, options?: RequestInit) {
  const res  = await fetch(url, { credentials: 'include', ...options })
  const data = await res.json()
  if (!res.ok) throw Object.assign(new Error(data.error?.message ?? 'Request failed'), { code: data.error?.code })
  return data
}

export function useAdmin() {
  // ── Stats ────────────────────────────────────────────────────────────────
  async function getStats(): Promise<AdminStats> {
    return apiFetch('/api/admin/stats')
  }

  // ── Users ────────────────────────────────────────────────────────────────
  async function getUsers(q = '', page = 1): Promise<{ users: AdminUser[]; total: number; pages: number }> {
    const params = new URLSearchParams({ page: String(page) })
    if (q) params.set('q', q)
    return apiFetch(`/api/admin/users?${params}`)
  }

  async function getUserDetail(id: number): Promise<AdminUserDetail> {
    return apiFetch(`/api/admin/users/${id}`)
  }

  async function setUserRole(userId: number, roleId: number): Promise<void> {
    return apiFetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId }),
    })
  }

  async function resetPassword(userId: number, password: string): Promise<void> {
    return apiFetch(`/api/admin/users/${userId}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
  }

  async function deleteUser(userId: number): Promise<void> {
    return apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
  }

  // ── Roles ────────────────────────────────────────────────────────────────
  async function getRoles(): Promise<Role[]> {
    return apiFetch('/api/admin/roles')
  }

  async function createRole(data: Omit<Role, 'id'>): Promise<Role> {
    return apiFetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async function updateRole(id: number, data: Partial<Omit<Role, 'id'>>): Promise<Role> {
    return apiFetch(`/api/admin/roles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  // ── Content ──────────────────────────────────────────────────────────────
  async function getQuestions(q = '', page = 1): Promise<{ questions: AdminQuestion[]; total: number; pages: number }> {
    const params = new URLSearchParams({ page: String(page) })
    if (q) params.set('q', q)
    return apiFetch(`/api/admin/content/questions?${params}`)
  }

  async function deleteQuestion(id: number): Promise<void> {
    return apiFetch(`/api/admin/content/questions/${id}`, { method: 'DELETE' })
  }

  async function deleteReply(id: number): Promise<void> {
    return apiFetch(`/api/admin/content/replies/${id}`, { method: 'DELETE' })
  }

  async function getTickets(page = 1): Promise<{ tickets: AdminTicket[]; total: number; pages: number }> {
    return apiFetch(`/api/admin/content/tickets?page=${page}`)
  }

  async function deleteTicket(id: number): Promise<void> {
    return apiFetch(`/api/admin/content/tickets/${id}`, { method: 'DELETE' })
  }

  return {
    getStats,
    getUsers, getUserDetail, setUserRole, resetPassword, deleteUser,
    getRoles, createRole, updateRole,
    getQuestions, deleteQuestion, deleteReply,
    getTickets, deleteTicket,
  }
}