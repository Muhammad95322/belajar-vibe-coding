import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import bcrypt from "bcryptjs";

/**
 * Mendaftarkan (register) pengguna baru ke dalam sistem.
 * 
 * Fungsi ini melakukan validasi untuk memastikan email belum terdaftar,
 * melakukan hashing pada password demi keamanan, lalu menyimpan data 
 * pengguna ke dalam database.
 * 
 * @param data Objek berisi name, email, dan pasword (belum di-hash).
 * @returns Objek dengan pesan sukses jika berhasil.
 * @throws Error jika email sudah terdaftar.
 */
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

/**
 * Mengautentikasi pengguna dan menghasilkan token sesi.
 * 
 * Fungsi ini akan mencari pengguna berdasarkan email, mencocokkan password 
 * menggunakan bcrypt, lalu membuat dan menyimpan UUID sebagai token sesi
 * ke dalam tabel sessions jika autentikasi berhasil.
 * 
 * @param data Objek berisi email dan pasword pengguna.
 * @returns Objek berisi token sesi (UUID).
 * @throws Error jika email tidak ditemukan atau password salah.
 */
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

/**
 * Mengambil data detail pengguna yang sedang login berdasarkan token sesi.
 * 
 * Fungsi ini akan mencari token di tabel sessions, lalu melakukan *join* 
 * dengan tabel users untuk mengembalikan informasi relevan dari pengguna 
 * yang bersangkutan tanpa menyertakan field sensitif seperti password.
 * 
 * @param token String UUID yang melambangkan sesi pengguna.
 * @returns Objek berisi detail pengguna (id, name, email, createdAt).
 * @throws Error jika token tidak ditemukan atau tidak valid.
 */
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

/**
 * Melakukan proses logout dengan menghapus sesi pengguna.
 * 
 * Fungsi ini memvalidasi keberadaan token di dalam database, 
 * kemudian menghapus *record* sesi tersebut agar token tidak 
 * dapat digunakan kembali.
 * 
 * @param token String UUID sesi yang akan dihapus.
 * @returns Objek dengan pesan sukses jika berhasil.
 * @throws Error jika token tidak ditemukan.
 */
export async function logoutUser(token: string) {
  // Find session
  const userSession = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (userSession.length === 0) {
    throw new Error("unauthorized");
  }

  // Delete session from database
  await db.delete(sessions).where(eq(sessions.token, token));

  return { data: "OK" };
}

