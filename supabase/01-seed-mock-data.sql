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
-- Clean existing data
TRUNCATE deals, orders, student_profiles, vendors CASCADE;

-- Enable pgcrypto for password hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- 1. AUTH USERS (Demo Accounts)
-- Password for both: demo@_123
-- ==========================================

-- Remove existing users if they exist (requires superuser, but TRUNCATE handles references)
DELETE FROM auth.users WHERE email IN ('student@demo.com', 'vendor@demo.com');

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student@demo.com', crypt('demo@_123', gen_salt('bf')), now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vendor@demo.com', crypt('demo@_123', gen_salt('bf')), now(), now(), now());

-- ==========================================
-- 2. STUDENT PROFILE
-- ==========================================
INSERT INTO student_profiles (id, full_name, phone, university, reg_number, is_verified, id_photo_url, total_saved, meals_enjoyed)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Demo Student', '+254 712 345 678', 'Technical University of Kenya', 'SCCI/00586/2020', true, 'https://i.pravatar.cc/150?u=student', 0, 0);

-- ==========================================
-- 3. VENDOR PROFILE
-- ==========================================
INSERT INTO vendors (id, business_name, contact_name, email, phone, address, campus_proximity, status)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Campus Bakery & Eats', 'John Doe', 'vendor@demo.com', '+254 798 765 432', 'Student Center, Ground Floor', 'On Campus', 'approved');

-- ==========================================
-- 4. 16 INVENTORY DEALS (No Orders)
-- ==========================================
INSERT INTO deals (vendor_id, title, vendor, campus, original_price, deal_price, image, discount_percentage, time_start, time_end, category, tags, description, brief_description, detailed_description, stock_count, duration_remaining)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Surplus Pastry Box', 'Campus Bakery & Eats', 'Main Campus', 500, 250, 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800&q=80', 50, '16:00', '18:00', 'Bakery', '{"Vegetarian", "Sweet"}', 'A delicious assortment of day-old pastries.', 'Pastries box.', 'Assortment of croissants and muffins.', 5, '2h'),
  ('22222222-2222-2222-2222-222222222222', 'Veggie Lunch Box', 'Campus Bakery & Eats', 'Main Campus', 600, 300, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', 50, '14:00', '15:30', 'Meals', '{"Vegan", "Healthy"}', 'Fresh veggie bowl.', 'Veggie bowl.', 'Nutritious lunch bowl with quinoa.', 3, '1.5h'),
  ('22222222-2222-2222-2222-222222222222', 'Mystery Pizza Box', 'Campus Bakery & Eats', 'Main Campus', 800, 400, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', 50, '20:00', '22:00', 'Meals', '{"Hot", "Dinner"}', 'Leftover pizza slices.', 'Assorted pizza.', '3 slices of random pizza.', 4, '2h'),
  ('22222222-2222-2222-2222-222222222222', 'Fruit Salad Cup', 'Campus Bakery & Eats', 'Main Campus', 300, 150, 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&q=80', 50, '15:00', '17:00', 'Snacks', '{"Fruit", "Fresh"}', 'Fresh seasonal fruit.', 'Fruit salad.', 'Melon, grapes, and berries.', 8, '2h'),
  ('22222222-2222-2222-2222-222222222222', 'Chicken Wrap', 'Campus Bakery & Eats', 'Main Campus', 450, 200, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80', 55, '13:00', '14:30', 'Meals', '{"Meat", "Lunch"}', 'Grilled chicken wrap.', 'Chicken wrap.', 'With lettuce and mayo.', 2, '1.5h'),
  ('22222222-2222-2222-2222-222222222222', 'Chocolate Brownies', 'Campus Bakery & Eats', 'Main Campus', 400, 200, 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&q=80', 50, '16:00', '18:00', 'Bakery', '{"Dessert", "Sweet"}', 'Rich chocolate brownies.', 'Brownies.', 'Pack of 3 brownies.', 10, '2h'),
  ('22222222-2222-2222-2222-222222222222', 'Beef Burger Combo', 'Campus Bakery & Eats', 'Main Campus', 700, 350, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', 50, '19:00', '21:00', 'Meals', '{"Meat", "Dinner"}', 'Burger and fries.', 'Burger combo.', 'Beef burger with cold fries.', 5, '2h'),
  ('22222222-2222-2222-2222-222222222222', 'Vegan Smoothie', 'Campus Bakery & Eats', 'Main Campus', 350, 150, 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80', 57, '10:00', '12:00', 'Beverages', '{"Vegan", "Drink"}', 'Berry smoothie.', 'Smoothie.', 'Mixed berries and almond milk.', 6, '2h'),
  ('22222222-2222-2222-2222-222222222222', 'Breakfast Muffin', 'Campus Bakery & Eats', 'Main Campus', 250, 100, 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80', 60, '10:30', '11:30', 'Bakery', '{"Breakfast", "Sweet"}', 'Blueberry muffin.', 'Muffin.', 'Classic blueberry muffin.', 12, '1h'),
  ('22222222-2222-2222-2222-222222222222', 'Pasta Salad', 'Campus Bakery & Eats', 'Main Campus', 500, 250, 'https://images.unsplash.com/photo-1626844131082-256783844137?w=800&q=80', 50, '14:00', '16:00', 'Meals', '{"Vegetarian", "Lunch"}', 'Cold pasta salad.', 'Pasta salad.', 'Penne with pesto and tomatoes.', 4, '2h'),
  ('22222222-2222-2222-2222-222222222222', 'Iced Coffee', 'Campus Bakery & Eats', 'Main Campus', 300, 150, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80', 50, '15:00', '17:00', 'Beverages', '{"Coffee", "Cold"}', 'Chilled iced coffee.', 'Iced coffee.', 'With milk and syrup.', 7, '2h'),
  ('22222222-2222-2222-2222-222222222222', 'Sushi Roll Box', 'Campus Bakery & Eats', 'Main Campus', 900, 400, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80', 55, '20:00', '21:30', 'Meals', '{"Seafood", "Dinner"}', 'Assorted sushi rolls.', 'Sushi box.', 'California rolls and tuna maki.', 3, '1.5h'),
  ('22222222-2222-2222-2222-222222222222', 'Glazed Donuts', 'Campus Bakery & Eats', 'Main Campus', 400, 150, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80', 62, '16:00', '17:30', 'Bakery', '{"Dessert", "Sweet"}', 'Box of 4 donuts.', 'Donuts.', 'Classic glazed rings.', 5, '1.5h'),
  ('22222222-2222-2222-2222-222222222222', 'Greek Yogurt Bowl', 'Campus Bakery & Eats', 'Main Campus', 350, 175, 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800&q=80', 50, '11:00', '13:00', 'Snacks', '{"Healthy", "Dairy"}', 'Yogurt with granola.', 'Yogurt bowl.', 'Greek yogurt, honey, and nuts.', 6, '2h'),
  ('22222222-2222-2222-2222-222222222222', 'Roast Beef Sandwich', 'Campus Bakery & Eats', 'Main Campus', 600, 300, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80', 50, '14:30', '16:00', 'Meals', '{"Meat", "Lunch"}', 'Deli sandwich.', 'Roast beef sandwich.', 'With mustard and greens.', 4, '1.5h'),
  ('22222222-2222-2222-2222-222222222222', 'Cheese Board Kit', 'Campus Bakery & Eats', 'Main Campus', 1200, 500, 'https://images.unsplash.com/photo-1630407144053-53d71207127e?w=800&q=80', 58, '18:00', '20:00', 'Snacks', '{"Dairy", "Gourmet"}', 'Leftover cheese assortments.', 'Cheese board.', 'Cheddar, brie, crackers.', 2, '2h');
