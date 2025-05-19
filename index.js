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

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (error) {
    console.error('Test DB Error:', error);
    res.status(500).json({ error: 'Cannot connect to DB' });
  }
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
// Buy Ticket Endpoint
app.post('/buy-ticket', async (req, res) => {
  const { flight_id, passenger_name } = req.body;

  try {
    // Optional: Generate random seat (e.g., A1 to F6)
    const seatLetter = String.fromCharCode(65 + Math.floor(Math.random() * 6)); // A-F
    const seatNumber = `${seatLetter}${Math.floor(Math.random() * 6) + 1}`; // 1-6

    const result = await pool.query(
      'INSERT INTO tickets (flight_id, passenger_name, seat_number, checked_in) VALUES ($1, $2, $3, false) RETURNING *',
      [flight_id, passenger_name, seatNumber]
    );

    const ticket = result.rows[0];

    res.json({
      message: 'Ticket purchased successfully',
      ticket: {
        ticket_id: ticket.id,
        flight_id: ticket.flight_id,
        passenger_name: ticket.passenger_name,
        seat_number: ticket.seat_number,
        checked_in: ticket.checked_in,
      },
    });
  } catch (error) {
    console.error('Buy Ticket Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// AI Chatbot Endpoint
// AI Chatbot Endpoint
app.post('/ai-agent', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Fetch latest 5 flights
    const flightsQuery = await pool.query(
      `SELECT id, origin, destination, date, departure_time, arrival_time, price 
       FROM flights 
       ORDER BY date DESC, departure_time DESC 
       LIMIT 5`
    );

    const flightsContext = flightsQuery.rows.map(f =>
      `Flight ID ${f.id}: ${f.origin} → ${f.destination} on ${f.date} | Departure: ${f.departure_time}, Arrival: ${f.arrival_time}, Price: $${f.price}`
    ).join('\n');

    // Fetch latest 5 tickets
    const ticketsQuery = await pool.query(
      `SELECT id, flight_id, passenger_name, seat_number, checked_in 
       FROM tickets 
       ORDER BY id DESC 
       LIMIT 5`
    );

    const ticketsContext = ticketsQuery.rows.map(t =>
      `Ticket ID ${t.id}: Passenger ${t.passenger_name} on Flight ${t.flight_id}, Seat: ${t.seat_number}, Checked-in: ${t.checked_in}`
    ).join('\n');

    // Combine both contexts
    const systemMessage = `
You are a helpful airline assistant. Use the following flight and ticket data to answer questions, help users search for flights, book tickets, or check in.

Recent Flights:
${flightsContext}

Recent Tickets:
${ticketsContext}
    `.trim();

    // Send request to OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
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
