-- Additional tables referenced by the hooks

-- Create properties table for clients
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    location TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('Commercial', 'Residential')),
    size INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Update invoices table to include additional fields
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS client_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS property_location TEXT,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS template VARCHAR(50) DEFAULT 'classic';

-- Create invoice_services table (replacing invoice_items with more detailed structure)
CREATE TABLE IF NOT EXISTS invoice_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_client_id ON properties(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_services_invoice_id ON invoice_services(invoice_id);

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security for properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Policies for properties
CREATE POLICY "Users can view their own properties" ON properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE USING (auth.uid() = user_id);

-- Row Level Security for invoice_services table
ALTER TABLE invoice_services ENABLE ROW LEVEL SECURITY;

-- Policies for invoice_services
CREATE POLICY "Users can view their own invoice services" ON invoice_services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice services" ON invoice_services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice services" ON invoice_services
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice services" ON invoice_services
    FOR DELETE USING (auth.uid() = user_id);