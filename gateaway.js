const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const flightApiProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
});

// ✅ Proxy all relevant endpoints
app.use('/query-flight', flightApiProxy);
app.use('/check-in', flightApiProxy);
app.use('/buy-ticket', flightApiProxy);
app.use('/ai-agent', flightApiProxy); // ✅ NEW: Proxy chatbot requests

// Optional: Health check
app.get('/', (req, res) => {
  res.send('API Gateway is running');
});

// Start Gateway server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
