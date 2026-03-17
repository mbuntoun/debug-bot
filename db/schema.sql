CREATE DATABASE IF NOT EXISTS debug_bot;
USE debug_bot;

CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  student_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  feedback TINYINT DEFAULT NULL COMMENT '1 = helpful, 0 = not helpful',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at),
  INDEX idx_feedback (feedback),
  FULLTEXT INDEX ft_student_message (student_message)
);
