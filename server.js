require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const session = require("express-session");
const SQLiteStoreFactory = require("connect-sqlite3");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const { rateLimit } = require("express-rate-limit");
const path = require("path");
const crypto = require("crypto");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3000);
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
  console.error("Set SESSION_SECRET to a random value of at least 32 characters in .env");
  process.exit(1);
}
if (isProduction && process.env.COOKIE_SECURE !== "true") {
  console.error("Production requires COOKIE_SECURE=true and HTTPS.");
  process.exit(1);
}

const db = new Database(process.env.DB_FILE || "veltrix.sqlite");
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

app.disable("x-powered-by");
if (isProduction) app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

const SQLiteStore = SQLiteStoreFactory(session);
app.use(session({
  name: "veltrix.sid",
  store: new SQLiteStore({ db: "sessions.sqlite", dir: process.env.DATA_DIR || "." }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 4
  }
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait and try again." }
});

function cleanText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
function issueCsrf(req) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  return req.session.csrfToken;
}
function csrfCheck(req, res, next) {
  const token = req.get("x-csrf-token");
  if (!token || !req.session.csrfToken) {
    return res.status(403).json({ error: "Session security check failed. Refresh and try again." });
  }
  const supplied = Buffer.from(token);
  const expected = Buffer.from(req.session.csrfToken);
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return res.status(403).json({ error: "Session security check failed. Refresh and try again." });
  }
  next();
}
function safeUser(row) {
  return { id: row.id, name: row.full_name, email: row.email };
}

app.get("/api/csrf", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ csrfToken: issueCsrf(req) });
});

app.post("/api/register", authLimiter, csrfCheck, async (req, res, next) => {
  try {
    const name = cleanText(req.body.name, 100);
    const email = cleanText(req.body.email, 254).toLowerCase();
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (name.length < 2) return res.status(400).json({ error: "Enter your full name." });
    if (!validEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 12 || password.length > 128) {
      return res.status(400).json({ error: "Use a password between 12 and 128 characters." });
    }
    if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare(
      "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)"
    ).run(name, email, passwordHash);
    req.session.regenerate(err => {
      if (err) return next(err);
      req.session.userId = Number(result.lastInsertRowid);
      req.session.csrfToken = crypto.randomBytes(32).toString("hex");
      res.status(201).json({ user: { id: Number(result.lastInsertRowid), name, email }, csrfToken: req.session.csrfToken });
    });
  } catch (err) {
    if (err && err.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ error: "An account with this email already exists." });
    next(err);
  }
});

app.post("/api/login", authLimiter, csrfCheck, async (req, res, next) => {
  try {
    const email = cleanText(req.body.email, 254).toLowerCase();
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    const matches = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!matches) return res.status(401).json({ error: "Email or password is incorrect." });
    req.session.regenerate(err => {
      if (err) return next(err);
      req.session.userId = user.id;
      req.session.csrfToken = crypto.randomBytes(32).toString("hex");
      res.set("Cache-Control", "no-store");
      res.json({ user: safeUser(user), csrfToken: req.session.csrfToken });
    });
  } catch (err) { next(err); }
});

app.get("/api/me", (req, res) => {
  res.set("Cache-Control", "no-store");
  if (!req.session.userId) return res.status(401).json({ error: "Not signed in." });
  const user = db.prepare("SELECT id, full_name, email FROM users WHERE id = ?").get(req.session.userId);
  if (!user) return res.status(401).json({ error: "Not signed in." });
  res.json({ user: safeUser(user), csrfToken: issueCsrf(req) });
});

app.post("/api/logout", csrfCheck, (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie("veltrix.sid", { httpOnly: true, secure: isProduction, sameSite: "strict" });
    res.status(204).end();
  });
});

app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(port, () => console.log(`Veltrix demo running at http://localhost:${port}`));
