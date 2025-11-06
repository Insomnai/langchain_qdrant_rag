import { getPool } from '../config/database.js';

/**
 * Middleware to authenticate requests using session token
 * Expects token in Authorization header: "Bearer <token>"
 */
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Brak tokenu uwierzytelniania'
      });
    }

    const pool = getPool();
    
    // Find session and user
    const result = await pool.query(
      `SELECT 
        us.user_id, us.expires_at,
        u.username, u.email
       FROM user_sessions us
       JOIN users u ON us.user_id = u.id
       WHERE us.token_hash = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy token'
      });
    }

    const session = result.rows[0];

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      // Delete expired session
      await pool.query(
        'DELETE FROM user_sessions WHERE token_hash = $1',
        [token]
      );

      return res.status(401).json({
        success: false,
        message: 'Sesja wygasła, zaloguj się ponownie'
      });
    }

    // Attach user to request
    req.user = {
      id: session.user_id,
      username: session.username,
      email: session.email
    };

    next();

  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd uwierzytelniania'
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that work both authenticated and unauthenticated
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace('Bearer ', '');

    if (!token) {
      req.user = null;
      return next();
    }

    const pool = getPool();
    
    const result = await pool.query(
      `SELECT 
        us.user_id, us.expires_at,
        u.username, u.email
       FROM user_sessions us
       JOIN users u ON us.user_id = u.id
       WHERE us.token_hash = $1
         AND us.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length > 0) {
      const session = result.rows[0];
      req.user = {
        id: session.user_id,
        username: session.username,
        email: session.email
      };
    } else {
      req.user = null;
    }

    next();

  } catch (error) {
    console.error('❌ Optional auth error:', error);
    req.user = null;
    next();
  }
}
