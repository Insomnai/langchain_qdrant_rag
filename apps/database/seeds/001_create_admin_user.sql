-- Seed: Create default admin user
-- Description: Creates the first admin user for the application
-- Default credentials:
--   Email: admin@example.com
--   Password: admin123
--   (CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN!)

-- IMPORTANT: This hash is for "admin123" - change password immediately!
-- To generate new hash, run in Node.js:
--   const bcrypt = require('bcrypt');
--   bcrypt.hash('your_password', 10).then(hash => console.log(hash));

DO $$
BEGIN
  -- Only insert if no users exist yet
  IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    INSERT INTO users (username, email, password_hash)
    VALUES (
      'admin',
      'admin@example.com',
      -- Password: admin123 (bcrypt hash with salt rounds=10)
      '$2b$10$ldudqfRIeRsVffVaTuhGzO55vnLmoHnjR1HpSDqzftBYsMe6HlBPi'
    );
    
    RAISE NOTICE '✅ Admin user created successfully';
    RAISE NOTICE '   Email: admin@example.com';
    RAISE NOTICE '   Password: admin123';
    RAISE NOTICE '   ⚠️  SECURITY: CHANGE THIS PASSWORD AFTER FIRST LOGIN!';
    RAISE NOTICE '   ⚠️  This is a demo password, NOT for production use!';
  ELSE
    RAISE NOTICE '⏭️  Users already exist, skipping admin creation';
  END IF;
END $$;
