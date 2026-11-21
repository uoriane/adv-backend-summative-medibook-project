const pool = require('./db');

// Runs `work(connection)` inside one transaction: commit if it resolves,
// roll back if it throws, and always release the connection.
async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = withTransaction;
