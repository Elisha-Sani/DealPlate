-- ==============================================================================
-- NO-AUTH PROTOTYPE OVERRIDE SCRIPT
-- Run this in your Supabase SQL Editor.
-- It safely drops auth dependencies and RLS policies on existing tables
-- and seeds the database with mock users and deals using auto-generated UUIDs.
-- ==============================================================================

-- 1. DROP FOREIGN KEY CONSTRAINTS TO AUTH.USERS
-- Since we are bypassing Supabase Auth, we can't reference auth.users.
ALTER TABLE student_profiles DROP CONSTRAINT IF EXISTS student_profiles_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- 2. DISABLE RLS RESTRICTIONS (Bypass for prototype)
DROP POLICY IF EXISTS "Deals are viewable by everyone" ON deals;
DROP POLICY IF EXISTS "Vendors can manage their own deals" ON deals;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can manage their own profile" ON student_profiles;
DROP POLICY IF EXISTS "Vendors are viewable by everyone" ON vendors;
DROP POLICY IF EXISTS "Vendors can update their own profile" ON vendors;

-- Create fully open policies for the prototype
CREATE POLICY "Prototype ALLOW ALL on deals" ON deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Prototype ALLOW ALL on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Prototype ALLOW ALL on student_profiles" ON student_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Prototype ALLOW ALL on vendors" ON vendors FOR ALL USING (true) WITH CHECK (true);

-- 2.5 CREATE RPC FUNCTION TO DECREMENT STOCK
CREATE OR REPLACE FUNCTION decrement_stock(p_deal_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE deals
  SET stock_count = GREATEST(stock_count - 1, 0)
  WHERE id = p_deal_id;
END;
$$;


-- 3. SEED MOCK USERS & DEALS DYNAMICALLY
DO $$ 
DECLARE 
  v_vendor_id UUID;
  v_student_id UUID;
BEGIN
  -- Insert or get Vendor (vendor table has a unique email constraint)
  INSERT INTO vendors (business_name, contact_name, email, phone, address, campus_proximity, status)
  VALUES ('Artcaffe Main Campus', 'Jane Doe', 'vendor@mock.com', '+254700000000', 'Main Campus Hub', 'Main Campus', 'approved')
  ON CONFLICT (email) DO UPDATE SET business_name = EXCLUDED.business_name
  RETURNING id INTO v_vendor_id;

  -- Insert or get Student
  SELECT id INTO v_student_id FROM student_profiles WHERE reg_number = 'UON/2026/01' LIMIT 1;
  IF v_student_id IS NULL THEN
    v_student_id := uuid_generate_v4();
    INSERT INTO student_profiles (id, full_name, phone, university, reg_number, is_verified, total_saved, meals_enjoyed)
    VALUES (v_student_id, 'Alex Student', '+254711111111', 'University of Nairobi', 'UON/2026/01', true, 1500, 4);
  END IF;

  -- Insert Mock Deals (Without conflicting on ID, they will just append if run multiple times)
  INSERT INTO deals (vendor_id, title, vendor, campus, original_price, deal_price, image, discount_percentage, time_start, time_end, category, description, stock_count, duration_remaining)
  VALUES 
  (
      v_vendor_id,
      'Morning Bakery Mystery Bag',
      'Artcaffe',
      'Main Campus',
      800,
      300,
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop&q=80',
      62,
      '2:00 PM',
      '4:00 PM',
      'Bakery',
      'A premium selection of today''s surplus savory pastries and breads.',
      3,
      '01:24:52'
  ),
  (
      v_vendor_id,
      'Late Night Pizza Surplus',
      'Dominos',
      'Main Campus',
      1200,
      450,
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop&q=80',
      62,
      '8:00 PM',
      '9:30 PM',
      'Pizza',
      'A surprise assortment of piping hot pizza slices from our dinner batch.',
      5,
      '00:45:10'
  );

END $$;
