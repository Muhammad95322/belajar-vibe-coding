import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import bcrypt from "bcryptjs";

export async function registerUser(data: { name: string; email: string; pasword: string }) {
  // Check if email already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("email sudah terdaftar");
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(data.pasword, 10);

  // Insert user into database
  await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: hashedPassword,
  });

  return { data: "OK" };
}

export async function loginUser(data: { email: string; pasword: string }) {
  // Find user by email
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser.length === 0) {
    throw new Error("email atau pasword salah");
  }

  const user = existingUser[0];

  // Compare bcrypt password hash
  const isPasswordMatch = await bcrypt.compare(data.pasword, user.password);
  if (!isPasswordMatch) {
    throw new Error("email atau pasword salah");
  }

  // Generate new UUID token
  const token = crypto.randomUUID();

  // Save session to database
  await db.insert(sessions).values({
    token: token,
    userId: user.id,
  });

  return { data: token };
}

export async function getCurrentUser(token: string) {
  // Find session and join with users table
  const userSession = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (userSession.length === 0) {
    throw new Error("unauthorized");
  }

  return userSession[0];
}
