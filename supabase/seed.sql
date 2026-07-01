-- DealPlate auth-backed seed data for Supabase.
-- Run after schema.sql.
-- Demo password for both accounts: demo@_123

CREATE EXTENSION IF NOT EXISTS pgcrypto;

TRUNCATE TABLE
    public.orders,
    public.deals,
    public.student_profiles,
    public.vendors
RESTART IDENTITY CASCADE;

DELETE FROM auth.identities
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);

DELETE FROM auth.users
WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
)
OR email IN ('student@demo.com', 'vendor@demo.com');

INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'student@demo.com',
        crypt('demo@_123', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Demo Student"}'::jsonb,
        now(),
        now()
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'vendor@demo.com',
        crypt('demo@_123', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"business_name": "Campus Bakery & Eats"}'::jsonb,
        now(),
        now()
    );

INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111',
        '{"sub": "11111111-1111-1111-1111-111111111111", "email": "student@demo.com"}'::jsonb,
        'email',
        now(),
        now(),
        now()
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        '22222222-2222-2222-2222-222222222222',
        '22222222-2222-2222-2222-222222222222',
        '{"sub": "22222222-2222-2222-2222-222222222222", "email": "vendor@demo.com"}'::jsonb,
        'email',
        now(),
        now(),
        now()
    );

INSERT INTO public.student_profiles (
    id,
    full_name,
    phone,
    university,
    reg_number,
    is_verified,
    id_photo_url,
    total_saved,
    meals_enjoyed
)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Demo Student',
    '+254 712 345 678',
    'Technical University of Kenya',
    'SCCI/00586/2020',
    true,
    'https://i.pravatar.cc/150?u=student',
    0,
    0
);

INSERT INTO public.vendors (
    id,
    business_name,
    contact_name,
    email,
    phone,
    address,
    campus_proximity,
    status
)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Campus Bakery & Eats',
    'John Doe',
    'vendor@demo.com',
    '+254 798 765 432',
    'Student Center, Ground Floor',
    'On Campus',
    'approved'
);

INSERT INTO public.deals (
    vendor_id,
    title,
    vendor,
    campus,
    original_price,
    deal_price,
    image,
    discount_percentage,
    time_start,
    time_end,
    category,
    tags,
    description,
    brief_description,
    detailed_description,
    stock_count,
    duration_remaining
)
VALUES
    ('22222222-2222-2222-2222-222222222222', 'Surplus Pastry Box', 'Campus Bakery & Eats', 'Main Campus', 500, 250, 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800&q=80', 50, '16:00', '18:00', 'Bakery', ARRAY['Vegetarian', 'Sweet'], 'A delicious assortment of day-old pastries.', 'Pastries box.', 'Assortment of croissants and muffins.', 5, '02:00:00'),
    ('22222222-2222-2222-2222-222222222222', 'Veggie Lunch Box', 'Campus Bakery & Eats', 'Main Campus', 600, 300, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', 50, '14:00', '15:30', 'Other', ARRAY['Vegan', 'Healthy'], 'Fresh veggie bowl.', 'Veggie bowl.', 'Nutritious lunch bowl with quinoa.', 3, '01:30:00'),
    ('22222222-2222-2222-2222-222222222222', 'Mystery Pizza Box', 'Campus Bakery & Eats', 'Main Campus', 800, 400, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', 50, '20:00', '22:00', 'Pizza', ARRAY['Hot', 'Dinner'], 'Leftover pizza slices.', 'Assorted pizza.', '3 slices of random pizza.', 4, '02:00:00'),
    ('22222222-2222-2222-2222-222222222222', 'Fruit Salad Cup', 'Campus Bakery & Eats', 'Main Campus', 300, 150, 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&q=80', 50, '15:00', '17:00', 'Desserts', ARRAY['Fruit', 'Fresh'], 'Fresh seasonal fruit.', 'Fruit salad.', 'Melon, grapes, and berries.', 8, '02:00:00'),
    ('22222222-2222-2222-2222-222222222222', 'Chicken Wrap', 'Campus Bakery & Eats', 'Main Campus', 450, 200, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80', 55, '13:00', '14:30', 'Other', ARRAY['Meat', 'Lunch'], 'Grilled chicken wrap.', 'Chicken wrap.', 'With lettuce and mayo.', 2, '01:30:00'),
    ('22222222-2222-2222-2222-222222222222', 'Chocolate Brownies', 'Campus Bakery & Eats', 'Main Campus', 400, 200, 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&q=80', 50, '16:00', '18:00', 'Desserts', ARRAY['Dessert', 'Sweet'], 'Rich chocolate brownies.', 'Brownies.', 'Pack of 3 brownies.', 10, '02:00:00'),
    ('22222222-2222-2222-2222-222222222222', 'Beef Burger Combo', 'Campus Bakery & Eats', 'Main Campus', 700, 350, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', 50, '19:00', '21:00', 'Burgers', ARRAY['Meat', 'Dinner'], 'Burger and fries.', 'Burger combo.', 'Beef burger with cold fries.', 5, '02:00:00'),
    ('22222222-2222-2222-2222-222222222222', 'Vegan Smoothie', 'Campus Bakery & Eats', 'Main Campus', 350, 150, 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80', 57, '10:00', '12:00', 'Beverages', ARRAY['Vegan', 'Drink'], 'Berry smoothie.', 'Smoothie.', 'Mixed berries and almond milk.', 6, '02:00:00'),
    ('22222222-2222-2222-2222-222222222222', 'Breakfast Muffin', 'Campus Bakery & Eats', 'Main Campus', 250, 100, 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80', 60, '10:30', '11:30', 'Bakery', ARRAY['Breakfast', 'Sweet'], 'Blueberry muffin.', 'Muffin.', 'Classic blueberry muffin.', 12, '01:00:00'),
    ('22222222-2222-2222-2222-222222222222', 'Pasta Salad', 'Campus Bakery & Eats', 'Main Campus', 500, 250, 'https://images.unsplash.com/photo-1626844131082-256783844137?w=800&q=80', 50, '14:00', '16:00', 'Other', ARRAY['Vegetarian', 'Lunch'], 'Cold pasta salad.', 'Pasta salad.', 'Penne with pesto and tomatoes.', 4, '02:00:00'),
    ('22222222-2222-2222-2222-222222222222', 'Iced Coffee', 'Campus Bakery & Eats', 'Main Campus', 300, 150, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80', 50, '15:00', '17:00', 'Beverages', ARRAY['Coffee', 'Cold'], 'Chilled iced coffee.', 'Iced coffee.', 'With milk and syrup.', 7, '02:00:00'),
    ('22222222-2222-2222-2222-222222222222', 'Sushi Roll Box', 'Campus Bakery & Eats', 'Main Campus', 900, 400, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80', 55, '20:00', '21:30', 'Sushi', ARRAY['Seafood', 'Dinner'], 'Assorted sushi rolls.', 'Sushi box.', 'California rolls and tuna maki.', 3, '01:30:00'),
    ('22222222-2222-2222-2222-222222222222', 'Glazed Donuts', 'Campus Bakery & Eats', 'Main Campus', 400, 150, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80', 62, '16:00', '17:30', 'Bakery', ARRAY['Dessert', 'Sweet'], 'Box of 4 donuts.', 'Donuts.', 'Classic glazed rings.', 5, '01:30:00'),
    ('22222222-2222-2222-2222-222222222222', 'Greek Yogurt Bowl', 'Campus Bakery & Eats', 'Main Campus', 350, 175, 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800&q=80', 50, '11:00', '13:00', 'Desserts', ARRAY['Healthy', 'Dairy'], 'Yogurt with granola.', 'Yogurt bowl.', 'Greek yogurt, honey, and nuts.', 6, '02:00:00'),
    ('22222222-2222-2222-2222-222222222222', 'Roast Beef Sandwich', 'Campus Bakery & Eats', 'Main Campus', 600, 300, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80', 50, '14:30', '16:00', 'Other', ARRAY['Meat', 'Lunch'], 'Deli sandwich.', 'Roast beef sandwich.', 'With mustard and greens.', 4, '01:30:00'),
    ('22222222-2222-2222-2222-222222222222', 'Cheese Board Kit', 'Campus Bakery & Eats', 'Main Campus', 1200, 500, 'https://images.unsplash.com/photo-1630407144053-53d71207127e?w=800&q=80', 58, '18:00', '20:00', 'Other', ARRAY['Dairy', 'Gourmet'], 'Leftover cheese assortments.', 'Cheese board.', 'Cheddar, brie, crackers.', 2, '02:00:00');
