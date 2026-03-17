const express = require('express');
const router = express.Router();
const { streamChatResponse } = require('../services/aiService');
const { saveConversation, saveFeedback, getHelpfulExamples } = require('../services/dbService');

router.post('/', async (req, res) => {
  const { message, sessionId, history = [] } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'message and sessionId are required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const helpfulExamples = await getHelpfulExamples(message);

    let fullResponse = '';

    await streamChatResponse(
      message,
      history,
      helpfulExamples,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      },
      (complete) => {
        fullResponse = complete;
      }
    );

    const conversationId = await saveConversation({ sessionId, studentMessage: message, aiResponse: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true, conversationId })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Chat error:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

router.post('/feedback', async (req, res) => {
  const { conversationId, helpful } = req.body;

  if (conversationId === undefined || helpful === undefined) {
    return res.status(400).json({ error: 'conversationId and helpful are required' });
  }

  try {
    await saveFeedback(conversationId, helpful);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
