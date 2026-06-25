-- Example seed data to populate your Supabase database with the Mystery Bags

INSERT INTO deals (
    id, title, vendor, campus, original_price, deal_price, image, discount_percentage, 
    time_start, time_end, category, tags, brief_description, detailed_description, stock_count, duration_remaining
) VALUES 
(
    uuid_generate_v4(),
    'Morning Bakery Mystery Bag',
    'Artcaffe',
    'Main Campus',
    800,
    300,
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    62,
    '2:00 PM',
    '4:00 PM',
    'Bakery',
    ARRAY['Fresh Baked', 'Sweet & Savory'],
    'A premium selection of today''s surplus savory pastries and breads.',
    'Secure this Flash Deal! This mystery bag typically contains a mix of 3-4 items from today''s surplus, potentially including almond croissants, sourdough loaves, or gourmet muffins. Exact contents are a surprise, ensuring zero food waste while saving you money.',
    3,
    '01:24:52'
),
(
    uuid_generate_v4(),
    'Late Night Pizza Surplus',
    'Dominos',
    'Main Campus',
    1200,
    450,
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    62,
    '8:00 PM',
    '9:30 PM',
    'Pizza',
    ARRAY['Hot Food', 'Surprise Slices'],
    'A surprise assortment of piping hot pizza slices from our dinner batch.',
    'Secure this Flash Deal! This mystery bag typically contains 3-4 random slices of premium pizza. You might find bubbling mozzarella, rich pepperoni, or supreme veggie toppings.',
    5,
    '00:45:10'
);
