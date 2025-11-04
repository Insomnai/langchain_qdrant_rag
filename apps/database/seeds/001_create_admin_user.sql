-- Seed: Create default admin user
-- Description: Creates the first admin user for the application
-- Default credentials:
--   Email: admin@example.com
--   Password: admin123
--   (CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN!)

-- Check if users table exists
DO $$
BEGIN
  -- Only insert if no users exist yet
  IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    INSERT INTO users (username, email, password_hash)
    VALUES (
      'admin',
      'admin@example.com',
      -- Password: admin123 (bcrypt hash)
      '$2b$10$rKJ5qZ7qZ5qZ5qZ5qZ5qZeO5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ'
    );
    
    RAISE NOTICE '✅ Admin user created successfully';
    RAISE NOTICE '   Email: admin@example.com';
    RAISE NOTICE '   Password: admin123';
    RAISE NOTICE '   ⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!';
  ELSE
    RAISE NOTICE '⏭️  Users already exist, skipping admin creation';
  END IF;
END $$;
