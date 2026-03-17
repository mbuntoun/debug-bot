const OLLAMA_URL = process.env.OLLAMA_URL;
const MODEL = process.env.OLLAMA_MODEL;

const BASE_SYSTEM_PROMPT = `You are a helpful teaching assistant for an undergraduate back-end web development course (INFO 653) that uses Node.js, Express.js, and MySQL.

Your role is to help students understand and debug their code — NOT to write code for them.

Guidelines:
- Explain what the error message means in plain language
- Identify the likely root cause and explain why it happens
- Point to the relevant concept (e.g., "this is a common issue with async/await", "Express middleware order matters here")
- Ask the student a guiding question to help them find the solution themselves
- If they share code, point out what to look at — do not rewrite it for them
- Reference official docs or concepts when helpful (Express docs, Node.js docs, MySQL2 docs)
- Keep responses clear and encouraging — debugging is a skill that takes practice
- If the question is not related to back-end web development with Node.js, Express, or MySQL, politely redirect

Never:
- Write complete working solutions to assignments
- Hand over fixed code without explanation
- Be condescending about mistakes — errors are how we learn
- Mention, reference, or allude to previous students, past examples, or prior conversations`;

function buildSystemPrompt(helpfulExamples) {
  if (!helpfulExamples || helpfulExamples.length === 0) {
    return BASE_SYSTEM_PROMPT;
  }

  const exampleBlock = helpfulExamples
    .map((ex, i) =>
      `Example ${i + 1}:\nStudent: ${ex.student_message.slice(0, 300)}\nAssistant: ${ex.ai_response.slice(0, 600)}`
    )
    .join('\n\n');

  return `${BASE_SYSTEM_PROMPT}

---
INTERNAL CONTEXT (do not reference this in your response — use it only to inform your explanation style):
${exampleBlock}`;
}

async function streamChatResponse(message, history, helpfulExamples, onChunk, onDone) {
  const messages = [
    { role: 'system', content: buildSystemPrompt(helpfulExamples) },
    ...history,
    { role: 'user', content: message },
  ];

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, stream: true, think: false }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  let fullResponse = '';
  let buffer = '';
  let inThinkBlock = false;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          buffer += json.message.content;

          // Strip <think>...</think> blocks that may span chunks
          let visible = '';
          let i = 0;
          while (i < buffer.length) {
            if (!inThinkBlock) {
              const start = buffer.indexOf('<think>', i);
              if (start === -1) {
                visible += buffer.slice(i);
                buffer = '';
                break;
              }
              visible += buffer.slice(i, start);
              inThinkBlock = true;
              i = start + 7;
            } else {
              const end = buffer.indexOf('</think>', i);
              if (end === -1) {
                // Keep partial think block in buffer until we see the closing tag
                buffer = buffer.slice(i);
                i = buffer.length;
                break;
              }
              inThinkBlock = false;
              i = end + 8;
            }
          }

          if (visible) {
            fullResponse += visible;
            onChunk(visible);
          }
        }
        if (json.done) {
          onDone(fullResponse);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return fullResponse;
}

module.exports = { streamChatResponse };
