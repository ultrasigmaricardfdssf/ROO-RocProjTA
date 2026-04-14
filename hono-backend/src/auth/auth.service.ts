import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'super-secret-key'

export type User = {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  notified: boolean;
  description: string;
  created_at: number;
}

export class AuthService {
  async hash(password: string) {
    return bcrypt.hash(password, 10)
  }

  async verify(password: string, hash: string) {
    return bcrypt.compare(password, hash)
  }

  generateToken(userId: number) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
  }

  verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET)
  }
}

export const authService = new AuthService()