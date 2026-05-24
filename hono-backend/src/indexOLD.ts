import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as z from 'zod'
import { sValidator } from '@hono/standard-validator'
import 'dotenv/config';
import { getCookie } from 'hono/cookie'

import { authService } from './auth/auth.service.js'
import { dbmanager } from './db-manager.js'

import { login } from './auth/auth.controller.js'

const app = new Hono()
app.use('*', cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

const registerSchema = z.object({
  username: z.string().min(4, { message: "Your username is too short."}),
  email: z.email(),
  password: z.string(),
})

const loginSchema = z.object([]);

app.post('/register', sValidator('json', registerSchema), async (c) => {
  const body = c.req.valid('json');
  const result = dbmanager.users.register(body.username, body.email, body.password);
  return c.json(result);
})

/*app.post('/login', async (c) => {
  //const body = c.req.json();
  //const result = dbmanager.users.register(body.username, body.email, body.password);
  //return c.text("retarfsedrs");
})*/

app.post('/login', login)

app.get('/me', async (c) => {
  const token = getCookie(c, 'token')

  if (!token) {
    return c.json(null, 401)
  }

  const userId = authService.verifyToken(token)
  if (!userId) {
    return c.json(null, 401)
  }

  const user = dbmanager.users.getUserById(userId)
  if (!user) {
    return c.json(null, 401)
  }

  const { password, ...safeUser } = user
  return c.json(safeUser)
})

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.SERVER_PORT || 3000),
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)
