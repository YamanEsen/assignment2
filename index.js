require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const { OpenAI } = require('openai');

const app = express();
app.use(bodyParser.json());

// PostgreSQL setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // e.g., postgres://user:pass@host:port/dbname
});

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Flight Query Endpoint
app.get('/query-flight', async (req, res) => {
  const { origin, destination, date } = req.query;

  try {
    const result = await pool.query(
      'SELECT * FROM flights WHERE origin = $1 AND destination = $2 AND date = $3',
      [origin, destination, date]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Query Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check-in Endpoint
app.post('/check-in', async (req, res) => {
  const { ticket_id, passenger_name } = req.body;

  try {
    await pool.query(
      'UPDATE tickets SET checked_in = true WHERE id = $1 AND passenger_name = $2',
      [ticket_id, passenger_name]
    );
    res.json({ message: 'Check-in successful' });
  } catch (error) {
    console.error('Check-in Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Buy Ticket Endpoint
app.post('/buy-ticket', async (req, res) => {
  const { flight_id, passenger_name } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO tickets (flight_id, passenger_name, checked_in) VALUES ($1, $2, false) RETURNING *',
      [flight_id, passenger_name]
    );
    res.json({ message: 'Ticket purchased successfully', ticket: result.rows[0] });
  } catch (error) {
    console.error('Buy Ticket Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Chatbot Endpoint
app.post('/ai-agent', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // You can use 'gpt-3.5-turbo' if preferred
      messages: [
        {
          role: 'system',
          content: 'You are a helpful airline assistant. Help users with flight search, check-in, and ticket booking.',
        },
        { role: 'user', content: message },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('AI Agent Error:', error);
    res.status(500).json({ error: 'AI agent failed to respond' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Flight API is running');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
