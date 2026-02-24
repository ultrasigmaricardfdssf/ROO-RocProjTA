import { Request, Response } from 'express'
import { authService } from './auth.service'

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  // Fetch user from DB (example)
  const user = getUserByEmail(email)

  if (!user) return res.status(401).json({ message: 'Invalid credentials' })

  const valid = await authService.verify(password, user.password)

  if (!valid) return res.status(401).json({ message: 'Invalid credentials' })

  const token = authService.generateToken(user.id)

  res.cookie('token', token, {
    httpOnly: true,
    secure: false, // true in production (HTTPS)
  })

  res.json({ id: user.id, email: user.email })
}