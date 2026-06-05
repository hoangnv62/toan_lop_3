import { getChatStream } from '../services/chat.service.js';

export const chat = async (req, res) => {
  const { messages } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const stream = await getChatStream(messages);
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();
};
