import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL || "mysql://root:password@127.0.0.1:3306/belajar_vibe_coding";

const connection = mysql.createPool(databaseUrl);

export const db = drizzle(connection, { schema, mode: "default" });
