-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Create Admin User
-- Description: إنشاء حساب Super Admin مباشرة في قاعدة البيانات
-- ═══════════════════════════════════════════════════════════════════════════════

-- First, ensure the handle_new_user function exists
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    role = COALESCE(EXCLUDED.role, user_profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- Create Admin User
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create the admin user directly in auth.users
DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'admin@saasfa.st';
  admin_password TEXT := 'Mm12345132';
  admin_name TEXT := 'Super Admin';
BEGIN
  -- Check if user already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      app_metadata,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      NOW(),
      jsonb_build_object('full_name', admin_name, 'is_super_admin', true, 'role', 'super_admin'),
      jsonb_build_object('is_super_admin', true, 'role', 'super_admin'),
      NOW(),
      NOW()
    )
    RETURNING id INTO admin_user_id;
    
    RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
  ELSE
    -- Update existing user
    UPDATE auth.users
    SET
      encrypted_password = crypt(admin_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = jsonb_build_object('full_name', admin_name, 'is_super_admin', true, 'role', 'super_admin'),
      app_metadata = jsonb_build_object('is_super_admin', true, 'role', 'super_admin'),
      updated_at = NOW()
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Admin user updated: %', admin_user_id;
  END IF;
  
  -- Ensure user profile exists
  INSERT INTO public.user_profiles (user_id, email, full_name, role)
  VALUES (
    admin_user_id,
    admin_email,
    admin_name,
    'super_admin'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = admin_email,
    full_name = admin_name,
    role = 'super_admin';
  
  RAISE NOTICE 'User profile created/updated for admin user';
END $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
