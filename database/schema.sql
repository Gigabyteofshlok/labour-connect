-- LABOUR CONNECT POSTGRESQL SCHEMA INITIALIZATION
-- Core database structure designed for a full-stack on-demand labour and contractor booking system.

-- Extensions for uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'worker', 'contractor', 'admin')),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CUSTOMERS TABLE (Extends users)
CREATE TABLE IF NOT EXISTS customers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    favorite_workers UUID[] DEFAULT '{}',
    address TEXT
);

-- 3. WORKERS TABLE (Extends users)
CREATE TABLE IF NOT EXISTS workers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    skills TEXT[] DEFAULT '{}',
    experience_years INT DEFAULT 0 CHECK (experience_years >= 0),
    hourly_rate NUMERIC(10,2) DEFAULT 0.00 CHECK (hourly_rate >= 0.00),
    bio TEXT,
    status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'on_the_way')),
    rating NUMERIC(3,2) DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00),
    completed_jobs_count INT DEFAULT 0 CHECK (completed_jobs_count >= 0),
    group_id UUID, -- Will link to groups table
    verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    identity_proof_url TEXT
);

-- 4. CONTRACTORS TABLE (Extends users)
CREATE TABLE IF NOT EXISTS contractors (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    projects_count INT DEFAULT 0 CHECK (projects_count >= 0)
);

-- 5. WORKER LOCATIONS (Real-time mapping)
CREATE TABLE IF NOT EXISTS worker_locations (
    worker_id UUID PRIMARY KEY REFERENCES workers(user_id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. LABOUR GROUPS TABLE
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES workers(user_id) ON DELETE SET NULL,
    rating NUMERIC(3,2) DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Foreign Key constraint for workers.group_id referencing groups(id)
ALTER TABLE workers ADD CONSTRAINT fk_worker_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

-- 7. GROUP MEMBERS TABLE (Many-to-many relationship)
CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, worker_id)
);

-- 8. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(user_id) ON DELETE SET NULL,
    contractor_id UUID REFERENCES contractors(user_id) ON DELETE SET NULL,
    worker_id UUID REFERENCES workers(user_id) ON DELETE SET NULL,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    service_type VARCHAR(100) NOT NULL, -- Plumber, Electrician, Carpenter, etc.
    booking_type VARCHAR(50) DEFAULT 'instant' CHECK (booking_type IN ('instant', 'scheduled', 'emergency')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'on_the_way', 'started', 'completed', 'cancelled')),
    scheduled_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    total_amount NUMERIC(10,2) DEFAULT 0.00 CHECK (total_amount >= 0.00),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    otp VARCHAR(6),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. ATTENDANCE TABLE (Contractor Projects & Bookings)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(user_id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    UNIQUE (booking_id, worker_id, date)
);

-- 10. REVIEWS TABLE (Multi-directional reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. WALLETS TABLE (Simulated balances)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC(12,2) DEFAULT 5000.00 CHECK (balance >= 0.00),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('credit', 'debit', 'deposit', 'withdrawal')),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0.00),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. CHATS TABLE
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g. booking_request, booking_accepted, payment_received
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. GOVERNMENT SCHEMES TABLE
CREATE TABLE IF NOT EXISTS government_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    benefits TEXT NOT NULL,
    eligibility_criteria JSONB NOT NULL,
    apply_link TEXT,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. FINANCIAL LEARNING MODULE
CREATE TABLE IF NOT EXISTS financial_learning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    reading_time INT DEFAULT 3 CHECK (reading_time > 0),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TRIGGERS & PROCEDURES

-- Update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to users, bookings, wallets
CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create wallet upon user registration trigger
CREATE OR REPLACE FUNCTION auto_create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Workers start with 0.00 balance, customers/contractors get 5000.00 for simulation
    IF NEW.role = 'worker' THEN
        INSERT INTO wallets (user_id, balance) VALUES (NEW.id, 0.00);
    ELSE
        INSERT INTO wallets (user_id, balance) VALUES (NEW.id, 5000.00);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_wallet
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION auto_create_user_wallet();

-- INDICES FOR PERFORMANCE TUNING
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_worker_skills ON workers USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_worker_locations ON worker_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_worker ON bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_chats_booking ON chats(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
