const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");

const users = [];
let nextId = 1;

class FakeUser {
  static async findOne(query) {
    return users.find((user) => user.email === query.email) || null;
  }

  static async create(data) {
    const user = {
      _id: String(nextId++),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.push(user);
    return user;
  }

  static findById(id) {
    return {
      select: async () => users.find((user) => user._id === String(id)) || null,
    };
  }
}

process.env.JWT_SECRET = "test-only-jwt-secret";
const userModelPath = require.resolve("../models/User");
const mockUserModule = new Module(userModelPath);
mockUserModule.filename = userModelPath;
mockUserModule.loaded = true;
mockUserModule.exports = FakeUser;
require.cache[userModelPath] = mockUserModule;

const express = require("express");
const app = express();
app.use(express.json());
app.use("/api/users", require("../routes/userRoutes"));

let server;
let apiUrl;

before(async () => {
  await new Promise((resolve, reject) => {
    server = app.listen(0, "127.0.0.1", resolve);
    server.once("error", reject);
  });
  apiUrl = `http://127.0.0.1:${server.address().port}/api/users`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  users.length = 0;
  nextId = 1;
});

async function post(path, body) {
  return fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test("registration validates required fields, email, and password strength", async () => {
  let response = await post("/register");
  assert.equal(response.status, 400);

  response = await post("/register", {
    name: "Test User",
    email: "not-an-email",
    password: "strong-pass-1",
  });
  assert.equal(response.status, 400);

  response = await post("/register", {
    name: "Test User",
    email: "test@example.com",
    password: "short",
  });
  assert.equal(response.status, 400);
});

test("registration creates a normalized account and rejects duplicate email", async () => {
  const response = await post("/register", {
    name: "  Test User  ",
    email: " TEST@EXAMPLE.COM ",
    password: "strong-pass-1",
  });
  assert.equal(response.status, 201);
  const registration = await response.json();
  assert.ok(registration.token);
  assert.equal(registration.user.name, "Test User");
  assert.equal(registration.user.email, "test@example.com");
  assert.notEqual(users[0].password, "strong-pass-1");

  const duplicate = await post("/register", {
    name: "Another User",
    email: "test@example.com",
    password: "strong-pass-1",
  });
  assert.equal(duplicate.status, 409);
});

test("login checks credentials and protects the current-user route", async () => {
  await post("/register", {
    name: "Test User",
    email: "test@example.com",
    password: "strong-pass-1",
  });

  let response = await post("/login");
  assert.equal(response.status, 400);

  response = await post("/login", {
    email: "test@example.com",
    password: "wrong-pass-1",
  });
  assert.equal(response.status, 400);

  response = await post("/login", {
    email: " TEST@example.com ",
    password: "strong-pass-1",
  });
  assert.equal(response.status, 200);
  const login = await response.json();
  assert.ok(login.token);

  response = await fetch(`${apiUrl}/me`);
  assert.equal(response.status, 401);

  response = await fetch(`${apiUrl}/me`, {
    headers: { Authorization: `Bearer ${login.token}` },
  });
  assert.equal(response.status, 200);
  const session = await response.json();
  assert.equal(session.user.email, "test@example.com");
  assert.equal("password" in session.user, false);
});
