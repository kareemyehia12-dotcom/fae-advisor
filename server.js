require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
const client = new Anthropic();

app.use(express.json());
app.use(express.static('public'));

const SYSTEM_PROMPT = `You are an experienced Field Applications Engineer (FAE) with deep expertise across electronic components, mechanical components, fluid handling, adhesives, and industrial hardware.

Your job is to help engineers and technical buyers find the right component for their application.

When a user describes their problem:
1. Ask 2-3 focused clarifying questions to understand: operating conditions, performance requirements, environmental constraints, and integration requirements
2. Once you have enough information, provide a structured recommendation with:
   - Component Type: The specific type of component they need
   - Reasoning: Why this component type fits their application
   - Key Specs to Look For: Only the datasheet parameters relevant to their use case
   - What to Avoid: Common mistakes or wrong choices for this application

Be concise, technical, and practical. Think like an FAE who has seen hundreds of applications.`;

let conversationHistory = [];

app.post('/api/chat', async (req, res) => {
  try {
    const { message, reset } = req.body;
    
    if (reset) {
      conversationHistory = [];
      return res.json({ response: 'Conversation reset.' });
    }

    conversationHistory.push({ role: 'user', content: message });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: conversationHistory
    });

    const assistantMessage = response.content[0].text;
    conversationHistory.push({ role: 'assistant', content: assistantMessage });

    res.json({ response: assistantMessage });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FAE Advisor running on http://localhost:${PORT}`);
});