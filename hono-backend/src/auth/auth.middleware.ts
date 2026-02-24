import { Request, Response, NextFunction } from 'express'
import { authService } from './auth.service'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token

  if (!token) return res.status(401).json({ message: 'Unauthorized' })

  try {
    const payload = authService.verifyToken(token)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}