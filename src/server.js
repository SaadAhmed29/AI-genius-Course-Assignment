// Load environment variables from .env before anything else
require('dotenv').config();

// Trigger the DB connection pool (logs ✅ or ❌ on startup)
require('./config/db');

const app  = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀  AI-Genius server running on http://localhost:${PORT}`);
  console.log(`    Environment: ${process.env.NODE_ENV || 'development'}`);
});
