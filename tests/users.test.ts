import { describe, it, expect, beforeEach } from "bun:test";
import { usersRoute } from "../src/routes/users-route";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";

describe("Users API", () => {
  const app = usersRoute;
  
  beforeEach(async () => {
    // Clear sessions first because of foreign key constraint
    await db.delete(sessions);
    await db.delete(users);
  });
  
  // POST /api/users
  describe("POST /api/users", () => {
    it("should successfully register a valid user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            pasword: "password123",
          }),
        })
      );
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ data: "OK" });
    });
    
    it("should fail if email is duplicated", async () => {
      // First registration
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane Doe",
            email: "jane@example.com",
            pasword: "password123",
          }),
        })
      );
      
      // Second registration with same email
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane Clone",
            email: "jane@example.com",
            pasword: "password123",
          }),
        })
      );
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.eror).toBe("email sudah terdaftar");
    });
    
    it("should fail if payload exceeds 255 characters", async () => {
      const longName = "a".repeat(300);
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: longName,
            email: "toolong@example.com",
            pasword: "password123",
          }),
        })
      );
      
      expect(response.status).toBe(400);
    });

    it("should fail if email format is invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Invalid Email",
            email: "not-an-email",
            pasword: "password123",
          }),
        })
      );
      
      expect(response.status).toBe(400);
    });
    
    it("should fail if required fields are missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "missingname@example.com",
            pasword: "password123",
          }), // missing name
        })
      );
      
      expect(response.status).toBe(400);
    });
  });

  // POST /api/users/login
  describe("POST /api/users/login", () => {
    beforeEach(async () => {
      // Register a user for login tests
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Login User",
            email: "login@example.com",
            pasword: "correctpassword",
          }),
        })
      );
    });

    it("should successfully login with valid credentials", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            pasword: "correctpassword",
          }),
        })
      );
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeDefined();
    });
    
    it("should fail login with wrong password", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            pasword: "wrongpassword",
          }),
        })
      );
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.eror).toBe("email atau pasword salah");
    });
    
    it("should fail login with unregistered email", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "notfound@example.com",
            pasword: "anypassword",
          }),
        })
      );
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.eror).toBe("email atau pasword salah");
    });

    it("should fail login with invalid payload", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "not-an-email", 
            pasword: "password123",
          }),
        })
      );
      
      expect(response.status).toBe(400);
    });
  });

  // GET /api/users/current
  describe("GET /api/users/current", () => {
    let validToken = "";

    beforeEach(async () => {
      // Register and login to get a valid token
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Current User",
            email: "current@example.com",
            pasword: "password123",
          }),
        })
      );
      
      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "current@example.com",
            pasword: "password123",
          }),
        })
      );
      
      const loginData = await loginRes.json();
      validToken = loginData.data;
    });

    it("should successfully get current user with valid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${validToken}`
          },
        })
      );
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.username).toBe("Current User");
      expect(data.data.email).toBe("current@example.com");
      expect(data.data.id).toBeDefined();
    });

    it("should fail without Authorization header", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET"
        })
      );
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.eror).toBe("unauthorized");
    });
    
    it("should fail with malformed Authorization header", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            "Authorization": `${validToken}` // missing 'Bearer '
          },
        })
      );
      
      expect(response.status).toBe(401);
    });

    it("should fail with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            "Authorization": "Bearer invalid-token-xyz"
          },
        })
      );
      
      expect(response.status).toBe(401);
    });
  });

  // DELETE /api/users/logout
  describe("DELETE /api/users/logout", () => {
    let validToken = "";

    beforeEach(async () => {
      // Register and login to get a valid token
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Logout User",
            email: "logout@example.com",
            pasword: "password123",
          }),
        })
      );
      
      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "logout@example.com",
            pasword: "password123",
          }),
        })
      );
      
      const loginData = await loginRes.json();
      validToken = loginData.data;
    });

    it("should successfully logout and invalidate token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${validToken}`
          },
        })
      );
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ data: "OK" });
      
      // Token should no longer be valid for /current
      const currentRes = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${validToken}`
          },
        })
      );
      expect(currentRes.status).toBe(401);
    });

    it("should fail logout without Authorization header", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE"
        })
      );
      
      expect(response.status).toBe(401);
    });

    it("should fail logout with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            "Authorization": "Bearer already-invalid-token"
          },
        })
      );
      
      expect(response.status).toBe(401);
    });
  });
});
