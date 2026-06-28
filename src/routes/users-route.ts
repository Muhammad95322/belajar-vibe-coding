import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-services";

export const usersRoute = new Elysia({ prefix: "/api" })
  .post("/users", async ({ body, set }) => {
    try {
      const result = await registerUser(body);
      return result;
    } catch (error: any) {
      if (error.message === "email sudah terdaftar") {
        set.status = 400;
        return { eror: "email sudah terdaftar" };
      }
      set.status = 500;
      return { eror: error.message };
    }
  }, {
    body: t.Object({
      name: t.String({ maxLength: 255 }),
      email: t.String({ maxLength: 255, format: "email" }),
      pasword: t.String({ maxLength: 255 })
    })
  })
  .post("/users/login", async ({ body, set }) => {
    try {
      const result = await loginUser(body);
      return result;
    } catch (error: any) {
      if (error.message === "email atau pasword salah") {
        set.status = 400;
        return { eror: "email atau pasword salah" };
      }
      set.status = 500;
      return { eror: error.message };
    }
  }, {
    body: t.Object({
      email: t.String({ maxLength: 255, format: "email" }),
      pasword: t.String({ maxLength: 255 })
    })
  })
  .get("/users/current", async ({ headers, set }) => {
    try {
      const authHeader = headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { eror: "unauthorized" };
      }

      const token = authHeader.substring(7);
      const user = await getCurrentUser(token);

      return {
        data: {
          id: user.id,
          username: user.name,
          email: user.email,
          created_at: user.createdAt,
        }
      };
    } catch (error: any) {
      if (error.message === "unauthorized") {
        set.status = 401;
        return { eror: "unauthorized" };
      }
      set.status = 500;
      return { eror: error.message || "Internal server error" };
    }
  })
  .delete("/users/logout", async ({ headers, set }) => {
    try {
      const authHeader = headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { eror: "unauthorized" };
      }

      const token = authHeader.substring(7);
      const result = await logoutUser(token);
      return result;
    } catch (error: any) {
      if (error.message === "unauthorized") {
        set.status = 401;
        return { eror: "unauthorized" };
      }
      set.status = 500;
      return { eror: error.message || "Internal server error" };
    }
  });

