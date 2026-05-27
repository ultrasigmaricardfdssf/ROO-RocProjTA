import { sign, verify } from 'hono/jwt'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Context } from 'hono'

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production'
const COOKIE_NAME = 'auth_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export interface SessionPayload {
  userId: number
  email: string
  roleId: number,
  roleName: string,
  canAsk: boolean,
  canReply: boolean,
  canDeleteReply: boolean,
  canPostTicket: boolean,
  canAcceptTicket: boolean,
  exp?: number
}

export async function createSession(c: Context, payload: Omit<SessionPayload, 'exp'>) {
  const token = await sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE },
    JWT_SECRET,
    'HS256'
  )

  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function getSession(c: Context): Promise<SessionPayload | null> {
  const token = getCookie(c, COOKIE_NAME)
  if (!token) return null

  try {
    const payload = await verify(token, JWT_SECRET, 'HS256')
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export function clearSession(c: Context) {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
}