import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as z from 'zod'
import { sValidator } from '@hono/standard-validator'
import 'dotenv/config';

import { dbmanager } from './db-manager.js'

const app = new Hono()
app.use(cors())

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

app.post('/login', async (c) => {
  const body = c.req.json();
  //const result = dbmanager.users.register(body.username, body.email, body.password);
  return c.json(body);
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
