const fs = require('fs');
const path = require('path');

const logDirectory = process.env.AUDIT_LOG_DIR
  ? path.resolve(process.env.AUDIT_LOG_DIR)
  : path.join(__dirname, '..', '..', 'logs');
const logFile = path.join(logDirectory, 'audit.log');

async function appendAudit(event) {
  try {
    await fs.promises.mkdir(logDirectory, { recursive: true });
    await fs.promises.appendFile(logFile, `${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n`);
  } catch (error) {
    console.error('Audit logging failed:', error.message);
  }
}

module.exports = { appendAudit };
