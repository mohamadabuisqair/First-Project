require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// GET /api/expenses - Return all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const queryText = `
      SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date
      FROM expenses
      ORDER BY id ASC
    `;
    const { rows } = await pool.query(queryText);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/expenses/:id - Return one expense
app.get('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    const queryText = `
      SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date
      FROM expenses
      WHERE id = $1
    `;
    const { rows } = await pool.query(queryText, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/api/expenses', async (req, res) => {
  const { title, amount, category, date } = req.body;

  if (!title || !amount || !category || !date) {
    return res.status(400).json({ error: 'All fields are required (title, amount, category, date)' });
  }

  try {
    const queryText = `
      INSERT INTO expenses (title, amount, category, date)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date
    `;
    
    const { rows } = await pool.query(queryText, [title, amount, category, date]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
const ALLOWED_CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

// PUT /api/expenses/:id - Update an expense
app.put('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  const { title, amount, category, date } = req.body;

  if (!title || amount === undefined || !category || !date) {
    return res.status(400).json({ error: 'All fields are required (title, amount, category, date)' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a number greater than 0' });
  }

  if (!ALLOWED_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}` });
  }

  try {
    const queryText = `
      UPDATE expenses
      SET title = $1, amount = $2, category = $3, date = $4
      WHERE id = $5
      RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date
    `;

    const { rows } = await pool.query(queryText, [title, amount, category, date, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// DELETE /api/expenses/:id - Delete an expense
app.delete('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    const queryText = 'DELETE FROM expenses WHERE id = $1 RETURNING id';
    const { rows } = await pool.query(queryText, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.status(200).json({ message: 'Expense deleted successfully', id: Number(id) });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});