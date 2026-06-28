import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
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
