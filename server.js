const express = require("express");
require("dotenv").config();
const pool = require("./db");

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "EnkidoLab API" });
});

app.get("/api/tasks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  try {
    const result = await pool.query(
      "INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *",
      [title, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`EnkidoLab API running on port ${PORT}`);
});

app.put("/api/tasks/:id", async (req, res) => {
  const { title, description, completed } = req.body;
  try {
    const result = await pool.query(
      "UPDATE tasks SET title=$1, description=$2, completed=$3 WHERE id=$4 RETURNING *",
      [title, description, completed, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Task not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id=$1 RETURNING *",
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted", task: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
