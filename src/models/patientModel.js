const pool = require('../config/db');

async function findAll() {
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, created_at FROM patients ORDER BY id'
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, created_at FROM patients WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function create({ name, email, phone }) {
  const [result] = await pool.query(
    'INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)',
    [name, email, phone]
  );
  return result.insertId;
}

async function update(id, { name, email, phone }) {
  await pool.query(
    'UPDATE patients SET name = ?, email = ?, phone = ? WHERE id = ?',
    [name, email, phone, id]
  );
}

async function remove(id) {
  await pool.query('DELETE FROM patients WHERE id = ?', [id]);
}

module.exports = { findAll, findById, create, update, remove };
