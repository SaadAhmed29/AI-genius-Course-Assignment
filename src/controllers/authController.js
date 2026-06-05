const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

// Helper: sign tokens

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN, // e.g. "15m"
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN, // e.g. "7d"
  });
}

// Helper: attach the refresh token as an httpOnly cookie

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,   // JS cannot read this cookie — protects against XSS
    secure:   false,  // set to true when behind HTTPS in production
    sameSite: 'Strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
}

// POST /api/auth/login

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
  }

  // Look up the user
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];

  // Always run bcrypt.compare even if the user doesn't exist — prevents timing attacks
  const dummyHash = '$2a$12$invalidhashusedtopreventimingtattack0000000000000000000';
  const isMatch   = user
    ? await bcrypt.compare(password, user.password)
    : await bcrypt.compare(password, dummyHash);

  if (!user || !isMatch) {
    return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
  }

  // Build the JWT payload — include only what downstream code actually needs
  const tokenPayload = { id: user.id, email: user.email, role: user.role };

  const accessToken  = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  // Persist the refresh token so we can invalidate it on logout
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshToken, expiresAt]
  );

  setRefreshCookie(res, refreshToken);

  return res.status(200).json({
    status: 'success',
    accessToken,
    user: { id: user.id, email: user.email, role: user.role },
  });
}

// POST /api/auth/refresh ───────────────────────────────────────────────────

async function refresh(req, res) {
  const incomingToken = req.cookies?.refreshToken;

  if (!incomingToken) {
    return res.status(401).json({ status: 'error', message: 'Refresh token not found in cookies.' });
  }

  // Verify the token signature before touching the database
  let decoded;
  try {
    decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ status: 'error', message: 'Refresh token is invalid or has expired. Please log in again.' });
  }

  // Check the whitelist — this lets us do server-side logout / revocation
  const { rows } = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = $1',
    [incomingToken]
  );

  if (!rows.length) {
    return res.status(401).json({ status: 'error', message: 'Refresh token has been revoked. Please log in again.' });
  }

  // Issue a fresh access token with the same payload
  const newAccessToken = signAccessToken({ id: decoded.id, email: decoded.email, role: decoded.role });

  return res.status(200).json({
    status: 'success',
    accessToken: newAccessToken,
  });
}

// POST /api/auth/logout

async function logout(req, res) {
  const token = req.cookies?.refreshToken;

  if (token) {
    // Remove from whitelist so the token can never be used again
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  }

  res.clearCookie('refreshToken');

  return res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
}

module.exports = { login, refresh, logout };
