import { eq } from 'drizzle-orm'
import { db, users, userRoles } from '../index.js'

export async function getUserById(id: number) {
  const [user] = await db
    .select({
      id:          users.id,
      username:    users.username,
      email:       users.email,
      notified:    users.notified,
      description: users.description,
      createdAt:   users.createdAt,
      roleId:      userRoles.id,
      roleName:    userRoles.name,
      roleColor:   userRoles.color,
      canAsk:      userRoles.canAsk,
      canReply:        userRoles.canReply,
      canDeleteReply:  userRoles.canDeleteReply,
      canPostTicket:   userRoles.canPostTicket,
      canAcceptTicket: userRoles.canAcceptTicket,
    })
    .from(users)
    .leftJoin(userRoles, eq(users.roleId, userRoles.id))
    .where(eq(users.id, id))

  return user ?? null
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
  return user ?? null
}

export async function getUserByUsername(username: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
  return user ?? null
}

export async function updateUserRole(userId: number, roleId: number) {
  const [u] = await db
    .update(users)
    .set({ roleId })
    .where(eq(users.id, userId))
    .returning()
  return u
}

export async function updateUserDescription(userId: number, description: string) {
  const [u] = await db
    .update(users)
    .set({ description })
    .where(eq(users.id, userId))
    .returning()
  return u
}

export async function getAllRoles() {
  return db.select().from(userRoles)
}