-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. VENDORS TABLE
-- ============================================================
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    campus_proximity TEXT NOT NULL,
    status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 2. STUDENT PROFILES TABLE
-- ============================================================
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    university TEXT NOT NULL,
    reg_number TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    id_photo_url TEXT,
    total_saved NUMERIC DEFAULT 0,
    meals_enjoyed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 3. DEALS TABLE
-- ============================================================
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    vendor TEXT NOT NULL,                -- display name (denormalized for speed)
    campus TEXT NOT NULL,
    original_price NUMERIC NOT NULL,
    deal_price NUMERIC NOT NULL,
    image TEXT NOT NULL,
    discount_percentage INTEGER NOT NULL,
    time_start TEXT NOT NULL,
    time_end TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    brief_description TEXT,
    detailed_description TEXT,
    stock_count INTEGER DEFAULT 0,
    duration_remaining TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 4. ORDERS TABLE
-- ============================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    order_date TEXT NOT NULL,
    order_time TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Completed', 'Cancelled')),
    total_paid NUMERIC NOT NULL,
    pickup_code TEXT,
    pickup_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- DEALS: Anyone can view deals (public feed)
CREATE POLICY "Deals are viewable by everyone" ON deals
    FOR SELECT USING (true);

-- DEALS: Only the owning vendor can insert/update their deals
CREATE POLICY "Vendors can manage their own deals" ON deals
    FOR ALL
    USING (vendor_id IN (SELECT id FROM vendors WHERE email = auth.jwt() ->> 'email'))
    WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE email = auth.jwt() ->> 'email'));

-- ORDERS: Users can only see their own orders
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

-- ORDERS: Users can insert their own orders
CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- STUDENT PROFILES: Users can only read/write their own profile
CREATE POLICY "Users can manage their own profile" ON student_profiles
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- VENDORS: Public read for listing, restricted write
CREATE POLICY "Vendors are viewable by everyone" ON vendors
    FOR SELECT USING (true);

CREATE POLICY "Vendors can update their own profile" ON vendors
    FOR UPDATE USING (email = auth.jwt() ->> 'email')
    WITH CHECK (email = auth.jwt() ->> 'email');
