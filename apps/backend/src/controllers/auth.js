import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../config/database.js';

/**
 * Login user with email and password
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email i hasło są wymagane'
      });
    }

    const pool = getPool();
    
    // Find user by email
    const userResult = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło'
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło'
      });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Create session token
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
      `INSERT INTO user_sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, sessionToken, expiresAt]
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token: sessionToken
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas logowania'
    });
  }
}

/**
 * Get current user status
 * GET /api/auth/status
 */
export async function getStatus(req, res) {
  try {
    if (!req.user) {
      return res.json({
        authenticated: false,
        user: null
      });
    }

    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email
      }
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      authenticated: false,
      user: null
    });
  }
}

/**
 * Logout user
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const pool = getPool();
      await pool.query(
        'DELETE FROM user_sessions WHERE token_hash = $1',
        [token]
      );
    }

    res.json({
      success: true,
      message: 'Wylogowano pomyślnie'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas wylogowania'
    });
  }
}
