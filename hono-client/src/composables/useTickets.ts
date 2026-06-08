// composables/useTickets.ts

export interface TicketPriority {
  id: number
  name: string
  color: string | null
}

export interface TicketSummary {
  id: number
  subject: string
  description: string | null
  createdAt: string
  resolvedAt: string | null
  priorityName: string | null
  priorityColor: string | null
}

export interface TicketDetail {
  id: number
  subject: string
  description: string | null
  createdAt: string
  resolvedAt: string | null
  requesterId: number
  requesterName: string
  priorityId: number
  priorityName: string | null
  priorityColor: string | null
  replies: TicketReply[]
}

export interface TicketReply {
  id: number
  content: string
  createdAt: string
  authorId: number
  authorName: string
}

// Admin/support view
export interface OpenTicket {
  id: number
  subject: string
  description: string | null
  createdAt: string
  requesterId: number
  requesterName: string
  priorityId: number
  priorityName: string | null
  priorityColor: string | null
}

async function apiFetch(url: string, options?: RequestInit) {
  const res  = await fetch(url, { credentials: 'include', ...options })
  const data = await res.json()
  if (!res.ok) throw Object.assign(new Error(data.error?.message ?? 'Request failed'), { code: data.error?.code })
  return data
}

export function useTickets() {
  async function getOpenTickets(): Promise<OpenTicket[]> {
    return apiFetch('/api/tickets/open')
  }

  async function getMyTickets(): Promise<TicketSummary[]> {
    return apiFetch('/api/tickets/mine')
  }

  async function getTicket(id: number): Promise<TicketDetail> {
    return apiFetch(`/api/tickets/${id}`)
  }

  async function getPriorities(): Promise<TicketPriority[]> {
    return apiFetch('/api/tickets/priorities')
  }

  async function createTicket(data: { subject: string; description?: string; priorityId?: number }): Promise<TicketSummary> {
    return apiFetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async function postReply(ticketId: number, content: string): Promise<TicketReply> {
    return apiFetch(`/api/tickets/${ticketId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
  }

  async function resolveTicket(id: number): Promise<void> {
    return apiFetch(`/api/tickets/${id}/resolve`, { method: 'POST' })
  }

  return { getOpenTickets, getMyTickets, getTicket, getPriorities, createTicket, postReply, resolveTicket }
}