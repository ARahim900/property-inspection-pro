-- ========================================
-- COMPLETE DATABASE SETUP FOR INSPECTION APP
-- Run this entire script in Supabase SQL Editor
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- DROP EXISTING TABLES (if they exist with wrong schema)
-- ========================================
DROP TABLE IF EXISTS invoice_services CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS inspection_photos CASCADE;
DROP TABLE IF EXISTS inspection_items CASCADE;
DROP TABLE IF EXISTS inspection_areas CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- ========================================
-- CREATE TABLES
-- ========================================

-- Clients table
CREATE TABLE clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    company VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Properties table (linked to clients)
CREATE TABLE properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    location TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('Commercial', 'Residential')),
    size INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Inspections table
CREATE TABLE inspections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    property_location TEXT NOT NULL,
    property_type VARCHAR(100),
    inspector_name VARCHAR(255) NOT NULL,
    inspection_date DATE NOT NULL,
    ai_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Inspection areas table
CREATE TABLE inspection_areas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Inspection items table
CREATE TABLE inspection_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES inspection_areas(id) ON DELETE CASCADE NOT NULL,
    category VARCHAR(255) NOT NULL,
    point VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Pass', 'Fail', 'N/A')),
    comments TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Inspection photos table
CREATE TABLE inspection_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES inspection_areas(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES inspection_items(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    base64_data TEXT,
    storage_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Invoices table
CREATE TABLE invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    client_name VARCHAR(255),
    client_address TEXT,
    client_email VARCHAR(255),
    property_location TEXT,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    template VARCHAR(50) DEFAULT 'classic',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Invoice services table
CREATE TABLE invoice_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ========================================
-- CREATE INDEXES
-- ========================================
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_client_id ON properties(client_id);
CREATE INDEX idx_inspections_user_id ON inspections(user_id);
CREATE INDEX idx_inspections_created_at ON inspections(created_at DESC);
CREATE INDEX idx_inspection_areas_inspection_id ON inspection_areas(inspection_id);
CREATE INDEX idx_inspection_items_area_id ON inspection_items(area_id);
CREATE INDEX idx_inspection_photos_item_id ON inspection_photos(item_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoice_services_invoice_id ON invoice_services(invoice_id);

-- ========================================
-- CREATE UPDATED_AT TRIGGER FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- APPLY TRIGGERS
-- ========================================
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspection_areas_updated_at BEFORE UPDATE ON inspection_areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspection_items_updated_at BEFORE UPDATE ON inspection_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ENABLE ROW LEVEL SECURITY
-- ========================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_services ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE RLS POLICIES - CLIENTS
-- ========================================
CREATE POLICY "Users can view their own clients" ON clients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON clients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON clients
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- CREATE RLS POLICIES - PROPERTIES
-- ========================================
CREATE POLICY "Users can view their own properties" ON properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- CREATE RLS POLICIES - INSPECTIONS
-- ========================================
CREATE POLICY "Users can view their own inspections" ON inspections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inspections" ON inspections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspections" ON inspections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspections" ON inspections
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- CREATE RLS POLICIES - INSPECTION AREAS
-- ========================================
CREATE POLICY "Users can view their own inspection areas" ON inspection_areas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inspection areas" ON inspection_areas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspection areas" ON inspection_areas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspection areas" ON inspection_areas
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- CREATE RLS POLICIES - INSPECTION ITEMS
-- ========================================
CREATE POLICY "Users can view their own inspection items" ON inspection_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inspection items" ON inspection_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspection items" ON inspection_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspection items" ON inspection_items
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- CREATE RLS POLICIES - INSPECTION PHOTOS
-- ========================================
CREATE POLICY "Users can view their own inspection photos" ON inspection_photos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inspection photos" ON inspection_photos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspection photos" ON inspection_photos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspection photos" ON inspection_photos
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- CREATE RLS POLICIES - INVOICES
-- ========================================
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" ON invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON invoices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON invoices
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- CREATE RLS POLICIES - INVOICE SERVICES
-- ========================================
CREATE POLICY "Users can view their own invoice services" ON invoice_services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice services" ON invoice_services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice services" ON invoice_services
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice services" ON invoice_services
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- VERIFICATION
-- ========================================
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- List all foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
