-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create inspections table
CREATE TABLE inspections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    property_location TEXT NOT NULL,
    property_type VARCHAR(100),
    inspector_name VARCHAR(255) NOT NULL,
    inspection_date DATE NOT NULL,
    ai_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create inspection_areas table
CREATE TABLE inspection_areas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create inspection_items table
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

-- Create inspection_photos table
CREATE TABLE inspection_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES inspection_areas(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES inspection_items(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    base64_data TEXT, -- Store base64 encoded image data temporarily
    storage_url TEXT, -- URL to image in Supabase Storage
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create clients table
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

-- Create invoices table
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
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create invoice_items table
CREATE TABLE invoice_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    rate DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_inspections_user_id ON inspections(user_id);
CREATE INDEX idx_inspections_created_at ON inspections(created_at DESC);
CREATE INDEX idx_inspection_areas_inspection_id ON inspection_areas(inspection_id);
CREATE INDEX idx_inspection_items_area_id ON inspection_items(area_id);
CREATE INDEX idx_inspection_photos_item_id ON inspection_photos(item_id);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspection_areas_updated_at BEFORE UPDATE ON inspection_areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspection_items_updated_at BEFORE UPDATE ON inspection_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Policies for inspections
CREATE POLICY "Users can view their own inspections" ON inspections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inspections" ON inspections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspections" ON inspections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspections" ON inspections
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for inspection_areas
CREATE POLICY "Users can view their own inspection areas" ON inspection_areas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inspection areas" ON inspection_areas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspection areas" ON inspection_areas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspection areas" ON inspection_areas
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for inspection_items
CREATE POLICY "Users can view their own inspection items" ON inspection_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inspection items" ON inspection_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspection items" ON inspection_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspection items" ON inspection_items
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for inspection_photos
CREATE POLICY "Users can view their own inspection photos" ON inspection_photos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inspection photos" ON inspection_photos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspection photos" ON inspection_photos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspection photos" ON inspection_photos
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for clients
CREATE POLICY "Users can view their own clients" ON clients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON clients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON clients
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for invoices
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" ON invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON invoices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON invoices
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for invoice_items (access through invoice ownership)
CREATE POLICY "Users can view invoice items for their invoices" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert invoice items for their invoices" ON invoice_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update invoice items for their invoices" ON invoice_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete invoice items for their invoices" ON invoice_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );