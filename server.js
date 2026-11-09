const express = require("express");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const bcrypt = require("bcryptjs");
require("dotenv").config();
const pool = require("./db");

const app = express();
app.set("trust proxy", 1);
app.use(express.json());

app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "سجّل الدخول أولاً" });
  }
  next();
}

function saveLogin(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate(error => {
      if (error) return reject(error);
      req.session.user = { id: user.id, username: user.username };
      req.session.save(error => error ? reject(error) : resolve());
    });
  });
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "EnkidoLab API" });
});

app.post("/api/auth/register", async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return res.status(400).json({ error: "اسم المستخدم: 3 إلى 30 حرفًا إنكليزيًا أو رقمًا أو _" });
  }
  if (password.length < 10) {
    return res.status(400).json({ error: "كلمة المرور لازم تكون 10 أحرف على الأقل" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO app_users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
      [username, passwordHash]
    );
    const user = result.rows[0];

    const users = await pool.query("SELECT COUNT(*)::int AS count FROM app_users");
    if (users.rows[0].count === 1) {
      await pool.query(
        "UPDATE tasks SET user_id = $1 WHERE user_id IS NULL",
        [user.id]
      );
    }

    await saveLogin(req, user);
    res.status(201).json({ user });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "اسم المستخدم مستخدم مسبقًا" });
    }
    console.error(error);
    res.status(500).json({ error: "تعذر إنشاء الحساب" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  try {
    const result = await pool.query(
      "SELECT id, username, password_hash FROM app_users WHERE username = $1",
      [username]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }

    await saveLogin(req, user);
    res.json({ user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "تعذر تسجيل الدخول" });
  }
});

app.get("/api/auth/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(error => {
    if (error) return res.status(500).json({ error: "تعذر تسجيل الخروج" });
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

app.get("/api/tasks", requireLogin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY id ASC",
      [req.session.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "تعذر جلب المهام" });
  }
});

app.post("/api/tasks", requireLogin, async (req, res) => {
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim() || null;

  if (!title) return res.status(400).json({ error: "عنوان المهمة مطلوب" });

  try {
    const result = await pool.query(
      "INSERT INTO tasks (title, description, user_id) VALUES ($1, $2, $3) RETURNING *",
      [title, description, req.session.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "تعذر إضافة المهمة" });
  }
});

app.put("/api/tasks/:id", requireLogin, async (req, res) => {
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim() || null;
  const completed = req.body.completed;

  if (!title || typeof completed !== "boolean") {
    return res.status(400).json({ error: "بيانات المهمة غير مكتملة" });
  }

  try {
    const result = await pool.query(
      `UPDATE tasks SET title = $1, description = $2, completed = $3
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [title, description, completed, req.params.id, req.session.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "المهمة غير موجودة" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "تعذر تحديث المهمة" });
  }
});

app.delete("/api/tasks/:id", requireLogin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.session.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "المهمة غير موجودة" });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "تعذر حذف المهمة" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`EnkidoLab API running on port ${PORT}`);
});
