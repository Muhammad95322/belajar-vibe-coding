import { Elysia, t } from "elysia";
import { registerUser, loginUser } from "../services/users-services";

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
      name: t.String(),
      email: t.String(),
      pasword: t.String()
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
      email: t.String(),
      pasword: t.String()
    })
  });
