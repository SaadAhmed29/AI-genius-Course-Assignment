const express      = require('express');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const authRoutes   = require('./routes/authRoutes');
const aiRoutes     = require('./routes/aiRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS — allow the frontend HTML file to call the API
app.use(cors({
  origin:      true,        // allow any origin (fine for local dev)
  credentials: true,        // required so the refresh cookie is sent/received
}));

// Built-in middleware
app.use(express.json());           // parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());           // parse cookies (needed for the refresh token)

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai',   aiRoutes);

// Health check — useful for deployment environments
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404 catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found.` });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
