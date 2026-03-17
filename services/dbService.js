const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'debug_bot',
  waitForConnections: true,
  connectionLimit: 10,
});

async function saveConversation({ sessionId, studentMessage, aiResponse }) {
  const [result] = await pool.query(
    'INSERT INTO conversations (session_id, student_message, ai_response) VALUES (?, ?, ?)',
    [sessionId, studentMessage, aiResponse]
  );
  return result.insertId;
}

async function saveFeedback(conversationId, helpful) {
  await pool.query(
    'UPDATE conversations SET feedback = ? WHERE id = ?',
    [helpful ? 1 : 0, conversationId]
  );
}

// Find past conversations that were marked helpful and are similar to the current query.
// Falls back to most recent helpful ones if no FULLTEXT match.
async function getHelpfulExamples(query, limit = 3) {
  const [rows] = await pool.query(
    `SELECT student_message, ai_response,
            MATCH(student_message) AGAINST (?) AS relevance
     FROM conversations
     WHERE feedback = 1
     ORDER BY relevance DESC, created_at DESC
     LIMIT ?`,
    [query, parseInt(limit, 10)]
  );
  return rows;
}

module.exports = { saveConversation, saveFeedback, getHelpfulExamples };
