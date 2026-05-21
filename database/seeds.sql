-- LABOUR CONNECT SEED DATA
-- Inserts realistic records for all roles, including pre-populated nearby coordinates around a sample Indian coordinate (e.g., Pune/Mumbai area: Latitude 18.5204, Longitude 73.8567).

-- Clear existing seeds if needed (optional, just safety)
-- TRUNCATE users CASCADE;

-- Pre-calculated bcrypt hash of 'password123': '$2a$10$8/s6.5BW4ewi8vRC1eh/qOFYoofSbKNZmIs.DU4ZhGTSjMWCIN9Nq'

-- 1. SEED USERS
INSERT INTO users (id, email, password_hash, role, name, phone, avatar_url) VALUES
('1111111-1111-1111-1111-111111111111', 'admin@labourconnect.com', '$2a$10$8/s6.5BW4ewi8vRC1eh/qOFYoofSbKNZmIs.DU4ZhGTSjMWCIN9Nq', 'admin', 'Rajesh Sharma', '+919999999901', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'),
('1111111-1111-1111-1111-111111111111', 'rahul.customer@gmail.com', '$2a$10$8/s6.5BW4ewi8vRC1eh/qOFYoofSbKNZmIs.DU4ZhGTSjMWCIN9Nq', 'customer', 'Rahul Verma', '+919999999902', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
('2222222-2222-2222-2222-222222222222', 'priya.customer@gmail.com', '$2a$10$8/s6.5BW4ewi8vRC1eh/qOFYoofSbKNZmIs.DU4ZhGTSjMWCIN9Nq', 'customer', 'Priya Patel', '+919999999903', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
('1111111-1111-1111-1111-111111111111', 'ramesh.worker@gmail.com', '$2a$10$8/s6.5BW4ewi8vRC1eh/qOFYoofSbKNZmIs.DU4ZhGTSjMWCIN9Nq', 'worker', 'Ramesh Prasad (Plumbing Expert)', '+919999999904', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
('2222222-2222-2222-2222-222222222222', 'amit.worker@gmail.com', '$2a$10$8/s6.5BW4ewi8vRC1eh/qOFYoofSbKNZmIs.DU4ZhGTSjMWCIN9Nq', 'worker', 'Amit Kumar (Electrician)', '+919999999905', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'),
('3333333-3333-3333-3333-333333333333', 'sanjay.worker@gmail.com', '$2a$10$8/s6.5BW4ewi8vRC1eh/qOFYoofSbKNZmIs.DU4ZhGTSjMWCIN9Nq', 'worker', 'Sanjay Yadav (Mason/Builder)', '+919999999906', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'),
('4444444-4444-4444-4444-444444444444', 'vijay.worker@gmail.com', '$2a$10$8/s6.5BW4ewi8vRC1eh/qOFYoofSbKNZmIs.DU4ZhGTSjMWCIN9Nq', 'worker', 'Vijay Rathod (Carpenter)', '+919999999907', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'),
('5555555-5555-5555-5555-555555555555', 'anil.worker@gmail.com', '$2a$10$8/s6.5BW4ewi8vRC1eh/qOFYoofSbKNZmIs.DU4ZhGTSjMWCIN9Nq', 'worker', 'Anil Shinde (AC Service)', '+919999999908', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150'),
('1111111-1111-1111-1111-111111111111', 'shivam.contractor@gmail.com', '$2a$10$8/s6.5BW4ewi8vRC1eh/qOFYoofSbKNZmIs.DU4ZhGTSjMWCIN9Nq', 'contractor', 'Shivam Builders Ltd.', '+919999999909', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150');

-- 2. SEED CUSTOMERS
INSERT INTO customers (user_id, bio, favorite_workers, address) VALUES
('1111111-1111-1111-1111-111111111111', 'Apartment owner looking for reliable maintenance helpers.', '{"w1111111-1111-1111-1111-111111111111"}', 'Flat 402, Green Glen Layout, Pune, MH'),
('2222222-2222-2222-2222-222222222222', 'Tech lead seeking clean and trusted AC and cleaning services.', '{}', 'B-10, Shivajinagar, Pune, MH');

-- 3. SEED WORKERS
INSERT INTO workers (user_id, skills, experience_years, hourly_rate, bio, status, rating, completed_jobs_count, verified, verification_status) VALUES
('1111111-1111-1111-1111-111111111111', '{"Plumber", "Home Repair Worker"}', 8, 250.00, 'Experienced home and industrial plumber. Pipeline fixtures, leak repairs, and bathroom fits.', 'online', 4.85, 34, TRUE, 'approved'),
('2222222-2222-2222-2222-222222222222', '{"Electrician"}', 6, 200.00, 'Licensed commercial electrician. Circuit board fixes, home wiring, and generator setups.', 'online', 4.90, 42, TRUE, 'approved'),
('3333333-3333-3333-3333-333333333333', '{"Mason", "Construction Worker", "Labour Helper"}', 12, 180.00, 'Masonry crew leader. Bricklaying, plastering, concrete pours, and structural wall creation.', 'online', 4.70, 75, TRUE, 'approved'),
('4444444-4444-4444-4444-444444444444', '{"Carpenter", "Furniture Worker"}', 5, 220.00, 'Premium woodworking and furniture installations. Modular kitchens, cupboards, and repair jobs.', 'offline', 4.65, 18, TRUE, 'approved'),
('5555555-5555-5555-5555-555555555555', '{"AC Repair", "Electrician"}', 4, 300.00, 'AC cooling expert. Split & window system installation, duct gas refills, and deep clean service.', 'online', 4.80, 22, FALSE, 'pending');

-- 4. SEED CONTRACTORS
INSERT INTO contractors (user_id, company_name, projects_count) VALUES
('1111111-1111-1111-1111-111111111111', 'Shivam Infrastructures & Civil Projects', 9);

-- 5. SEED WORKER LOCATIONS (Near center Pune coordinate: 18.5204, 73.8567)
INSERT INTO worker_locations (worker_id, latitude, longitude) VALUES
('1111111-1111-1111-1111-111111111111', 18.5240, 73.8590), -- Ramesh: ~500m North-East
('2222222-2222-2222-2222-222222222222', 18.5180, 73.8530), -- Amit: ~600m South-West
('3333333-3333-3333-3333-333333333333', 18.5290, 73.8480), -- Sanjay: ~1.2km North-West
('5555555-5555-5555-5555-555555555555', 18.5110, 73.8650); -- Anil: ~1.5km South-East

-- 6. SEED LABOUR GROUPS
INSERT INTO groups (id, name, description, leader_id, rating) VALUES
('1111111-1111-1111-1111-111111111111', 'Shivaji Construction Team', 'Premier team of 3 skilled masons and construction helpers for civil and contract works.', 'w3333333-3333-3333-3333-333333333333', 4.80);

-- Assign group to leader and member Sanjay
UPDATE workers SET group_id = 'g1111111-1111-1111-1111-111111111111' WHERE user_id = 'w3333333-3333-3333-3333-333333333333';
INSERT INTO group_members (group_id, worker_id) VALUES
('1111111-1111-1111-1111-111111111111', 'w3333333-3333-3333-3333-333333333333');

-- 7. SEED BOOKINGS
INSERT INTO bookings (id, customer_id, contractor_id, worker_id, group_id, service_type, booking_type, status, total_amount, payment_status, otp, latitude, longitude, address) VALUES
('1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', NULL, 'w1111111-1111-1111-1111-111111111111', NULL, 'Plumber', 'instant', 'completed', 500.00, 'completed', '123456', 18.5204, 73.8567, 'Flat 402, Green Glen Layout, Pune, MH'),
('2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', NULL, 'w2222222-2222-2222-2222-222222222222', NULL, 'Electrician', 'instant', 'started', 400.00, 'pending', '789012', 18.5204, 73.8567, 'Flat 402, Green Glen Layout, Pune, MH'),
('3333333-3333-3333-3333-333333333333', NULL, 't1111111-1111-1111-1111-111111111111', NULL, 'g1111111-1111-1111-1111-111111111111', 'Construction Worker', 'scheduled', 'accepted', 1500.00, 'pending', '456789', 18.5300, 73.8600, 'Shivam Metro Project Site A, Shivaji Road, Pune');

-- 8. SEED REVIEWS
INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment) VALUES
('1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'w1111111-1111-1111-1111-111111111111', 5, 'Ramesh arrived on time and fixed our pipe leak perfectly. Highly recommended!');

-- 9. WALLET STARTING TRANSACTIONS (Triggers auto-create wallets, let's inject manual seed records for historical details)
-- Since auto_create trigger executes, wallets will already have rows. Let's register standard transaction rows.
-- First, fetch wallet IDs manually in backend or write helper seeds based on user_ids.
INSERT INTO transactions (wallet_id, type, amount, status, description)
SELECT id, 'deposit', 5000.00, 'completed', 'Initial simulated sign-up bonus credits.' FROM wallets;

-- 10. GOVERNMENT SCHEMES
INSERT INTO government_schemes (name, description, benefits, eligibility_criteria, apply_link, category) VALUES
(
  'e-Shram Card Registration', 
  'A national database of unorganized workers, created by the Ministry of Labour and Employment, to offer diverse welfare and social security benefits.', 
  'Direct transfer of emergency allowances, accident insurance coverage up to ₹2 Lakh, and direct enrollment into PM Shram Yogi Maan-dhan pension plan.', 
  '{"min_age": 16, "max_age": 59, "taxpayer": false, "organized_sector": false}', 
  'https://eshram.gov.in', 
  'Social Security & Pensions'
),
(
  'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)', 
  'The largest public health insurance scheme in the world, offering cashless and paperless hospitalization coverage.', 
  'Free health insurance cover of up to ₹5 Lakh per family per year for secondary and tertiary care hospitalisation.', 
  '{"min_age": 0, "max_age": 120, "taxpayer": false, "below_poverty_line": true}', 
  'https://pmjay.gov.in', 
  'Health & Insurance'
),
(
  'Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)', 
  'A voluntary and contributory pension scheme for unorganized workers to safeguard their old age livelihood.', 
  'Assured monthly pension of ₹3,000 after attaining the age of 60 years.', 
  '{"min_age": 18, "max_age": 40, "monthly_income_limit": 15000}', 
  'https://maandhan.in', 
  'Social Security & Pensions'
);

-- 11. FINANCIAL LEARNING CONTENT
INSERT INTO financial_learning (title, content, category, reading_time, image_url) VALUES
(
  'Understanding UPI & Preventing Online Frauds', 
  'Unified Payments Interface (UPI) is a revolutionary payment framework. However, scammers use tricks. Remember: YOU NEVER NEED TO ENTER YOUR UPI PIN TO RECEIVE MONEY. If someone asks you to scan a QR code or enter a PIN to receive a payment, it is ALWAYS a fraud attempt. Stay safe and never share OTPs.', 
  'Digital Payment Safety', 
  3, 
  'https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=400'
),
(
  'The Power of Small Savings: RD & Emergency Funds', 
  'Even small amounts saved every week can secure your familys future. A Recurring Deposit (RD) with a bank lets you save ₹100 or ₹500 every month safely. Accumulating an emergency fund equivalent to 3 months of expenses is essential to cover unexpected illnesses or dry work periods without falling into high-interest debt traps.', 
  'Savings & Budgeting', 
  4, 
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400'
),
(
  'Selecting the Right Basic Health & Accident Insurance', 
  'Government schemes like PMSBY (PM Suraksha Bima Yojana) offer full accidental disability/death coverage of ₹2 Lakh for just ₹20 per year! Learn to distinguish private insurance scams from legitimate government-sponsored micro-insurance plans. Getting registered early will shield your home from massive debt.', 
  'Insurance Basics', 
  3, 
  'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=400'
);
