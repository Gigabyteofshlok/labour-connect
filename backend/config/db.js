// LABOUR CONNECT DATABASE CONNECTOR
// Load environment variables immediately on db spin-up
require('dotenv').config();
const { Pool } = require('pg');

let pool = null;
let useMock = false;
let mockDb = {};

// Fallback Mock Data Store (Matching seeds.sql exactly)
const initMockDatabase = () => {
  console.log('🤖 Initializing in-memory mock database fallback from seedsData...');
  const { seedUsers, seedCustomers, seedContractors, workersData, seedGroups, seedShops } = require('./seedsData');
  
  mockDb.users = [...seedUsers];
  
  // Add workers as users
  for (const w of workersData) {
    mockDb.users.push({
      id: w.id,
      email: w.email,
      password_hash: '$2a$10$8/s6.5BW4ewi8vRC1eh/qOFYoofSbKNZmIs.DU4ZhGTSjMWCIN9Nq',
      role: 'worker',
      name: w.name,
      full_name: w.name,
      phone: w.phone,
      avatar_url: w.avatar_url,
      created_at: new Date()
    });
  }

  mockDb.customers = [...seedCustomers];
  mockDb.contractors = [...seedContractors];
  
  mockDb.workers = workersData.map(w => {
    const workerCopy = { ...w, user_id: w.id };
    delete workerCopy.id;
    delete workerCopy.email;
    delete workerCopy.name;
    delete workerCopy.phone;
    delete workerCopy.avatar_url;
    delete workerCopy.loc;
    return workerCopy;
  });

  mockDb.worker_locations = workersData.map(w => ({
    worker_id: w.id,
    latitude: w.loc.lat,
    longitude: w.loc.lng,
    last_updated: new Date()
  }));

  mockDb.groups = [...seedGroups];

  mockDb.group_members = seedGroups.map(g => ({
    group_id: g.id,
    worker_id: g.leader_id,
    joined_at: new Date()
  }));

  mockDb.bookings = [
    { id: 'b1111111-1111-1111-1111-111111111111', customer_id: 'c1111111-1111-1111-1111-111111111111', contractor_id: null, worker_id: 'f1111111-1111-1111-1111-111111111111', group_id: null, service_type: 'Plumber', booking_type: 'instant', status: 'completed', total_amount: 500.00, payment_status: 'completed', otp: '123456', latitude: 18.5204, longitude: 73.8567, address: 'Flat 402, Green Glen Layout, Pune, MH', created_at: new Date(Date.now() - 3600000 * 2) },
    { id: 'b2222222-2222-2222-2222-222222222222', customer_id: 'c1111111-1111-1111-1111-111111111111', contractor_id: null, worker_id: 'f2222222-2222-2222-2222-222222222222', group_id: null, service_type: 'Electrician', booking_type: 'instant', status: 'started', total_amount: 400.00, payment_status: 'pending', otp: '789012', latitude: 18.5204, longitude: 73.8567, address: 'Flat 402, Green Glen Layout, Pune, MH', created_at: new Date() },
    { id: 'b3333333-3333-3333-3333-333333333333', customer_id: null, contractor_id: 'd1111111-1111-1111-1111-111111111111', worker_id: null, group_id: 'e1111111-1111-1111-1111-111111111111', service_type: 'Construction Worker', booking_type: 'scheduled', status: 'accepted', total_amount: 1500.00, payment_status: 'pending', otp: '456789', latitude: 18.5300, longitude: 73.8600, address: 'Shivam Metro Project Site A, Shivaji Road, Pune', created_at: new Date() }
  ];

  mockDb.attendance = [
    { id: 'att-1', booking_id: 'b3333333-3333-3333-3333-333333333333', worker_id: 'f3333333-3333-3333-3333-333333333333', date: new Date().toISOString().split('T')[0], status: 'present', check_in_time: new Date() }
  ];

  mockDb.reviews = [
    { id: '81111111-1111-1111-1111-111111111111', booking_id: 'b1111111-1111-1111-1111-111111111111', reviewer_id: 'c1111111-1111-1111-1111-111111111111', reviewee_id: 'f1111111-1111-1111-1111-111111111111', rating: 5, comment: 'Ramesh arrived on time and fixed our pipe leak perfectly. Highly recommended!' }
  ];

  mockDb.wallets = mockDb.users.map(u => ({
    id: `wa-${u.id.slice(0, 8)}`,
    user_id: u.id,
    balance: u.role === 'worker' ? 0.00 : 5000.00
  }));

  mockDb.transactions = [
    { id: 't-1', wallet_id: `wa-c1111111`, booking_id: 'b1111111-1111-1111-1111-111111111111', type: 'debit', amount: 500.00, status: 'completed', description: 'Payment for plumbing services', created_at: new Date() },
    { id: 't-2', wallet_id: `wa-f1111111`, booking_id: 'b1111111-1111-1111-1111-111111111111', type: 'credit', amount: 500.00, status: 'completed', description: 'Earnings for plumbing services completed', created_at: new Date() }
  ];

  mockDb.chats = [];
  mockDb.notifications = [
    { id: 'n-1', user_id: 'f1111111-1111-1111-1111-111111111111', title: 'Welcome to Labour Connect!', message: 'Upload your ID documents to get verified and start receiving jobs.', type: 'alert', is_read: false, created_at: new Date() }
  ];

  mockDb.government_schemes = [
    { id: 'gs-1', name: 'e-Shram Card Registration', description: 'A national database of unorganized workers, created by the Ministry of Labour and Employment, to offer diverse welfare and social security benefits.', benefits: 'Direct transfer of emergency allowances, accident insurance coverage up to ₹2 Lakh, and direct enrollment into PM Shram Yogi Maan-dhan pension plan.', eligibility_criteria: { min_age: 16, max_age: 59, taxpayer: false, organized_sector: false }, apply_link: 'https://eshram.gov.in', category: 'Social Security & Pensions' },
    { id: 'gs-2', name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)', description: 'The largest public health insurance scheme in the world, offering cashless and paperless hospitalization coverage.', benefits: 'Free health insurance cover of up to ₹5 Lakh per family per year for secondary and tertiary care hospitalisation.', eligibility_criteria: { min_age: 0, max_age: 120, taxpayer: false, below_poverty_line: true }, apply_link: 'https://pmjay.gov.in', category: 'Health & Insurance' },
    { id: 'gs-3', name: 'Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)', description: 'A voluntary and contributory pension scheme for unorganized workers to safeguard their old age livelihood.', benefits: 'Assured monthly pension of ₹3,000 after attaining the age of 60 years.', eligibility_criteria: { min_age: 18, max_age: 40, monthly_income_limit: 15000 }, apply_link: 'https://maandhan.in', category: 'Social Security & Pensions' }
  ];

  mockDb.financial_learning = [
    { id: 'fl-1', title: 'Understanding UPI & Preventing Online Frauds', content: 'Unified Payments Interface (UPI) is a revolutionary payment framework. However, scammers use tricks. Remember: YOU NEVER NEED TO ENTER YOUR UPI PIN TO RECEIVE MONEY. If someone asks you to scan a QR code or enter a PIN to receive a payment, it is ALWAYS a fraud attempt. Stay safe and never share OTPs.', category: 'Digital Payment Safety', reading_time: 3, image_url: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=400' },
    { id: 'fl-2', title: 'The Power of Small Savings: RD & Emergency Funds', content: 'Even small amounts saved every week can secure your familys future. A Recurring Deposit (RD) with a bank lets you save ₹100 or ₹500 every month safely. Accumulating an emergency fund equivalent to 3 months of expenses is essential to cover unexpected illnesses or dry work periods without falling into high-interest debt traps.', category: 'Savings & Budgeting', reading_time: 4, image_url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400' },
    { id: 'fl-3', title: 'Selecting the Right Basic Health & Accident Insurance', content: 'Government schemes like PMSBY (PM Suraksha Bima Yojana) offer full accidental disability/death coverage of ₹2 Lakh for just ₹20 per year! Learn to distinguish private insurance scams from legitimate government-sponsored micro-insurance plans. Getting registered early will shield your home from massive debt.', category: 'Insurance Basics', reading_time: 3, image_url: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=400' }
  ];

  mockDb.shops = [...seedShops];
  mockDb.booking_photos = [];
};

if (!process.env.DATABASE_URL) {
  console.log('⚠️ DATABASE_URL environment variable is missing.');
  console.log('🤖 [FALLBACK] Activating self-contained reactive in-memory database simulation.');
  console.log('🤖 fallback DB active');
  useMock = true;
  initMockDatabase();
} else {
  const maxAttempts = 5;
  let attempt = 0;

  const seedDatabase = async (client) => {
    try {
      console.log('🌱 [DB SEED] Loading seed dataset from seedsData...');
      const { seedUsers, seedCustomers, seedContractors, workersData, seedGroups, seedShops } = require('./seedsData');
      
      console.log('🌱 [DB SEED] Clearing existing data to prevent unique constraint failures...');
      // We truncate with CASCADE to clear users, customers, workers, contractors, worker_locations, groups, group_members, wallets, transactions, bookings, etc.
      await client.query('TRUNCATE users, groups, shops CASCADE');
      console.log('🌱 [DB SEED] Cleaned all tables successfully.');

      // 1. Seed users (seeded accounts + workers)
      console.log('🌱 [DB SEED] Seeding users table...');
      for (const u of seedUsers) {
        await client.query(
          'INSERT INTO users (id, email, password_hash, role, name, full_name, phone, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [u.id, u.email, u.password_hash, u.role, u.name, u.full_name, u.phone, u.avatar_url]
        );
      }
      
      for (const w of workersData) {
        await client.query(
          'INSERT INTO users (id, email, password_hash, role, name, full_name, phone, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [w.id, w.email, '$2a$10$8/s6.5BW4ewi8vRC1eh/qOFYoofSbKNZmIs.DU4ZhGTSjMWCIN9Nq', 'worker', w.name, w.name, w.phone, w.avatar_url]
        );
      }
      console.log(`🌱 [DB SEED] Seeded ${seedUsers.length + workersData.length} users successfully.`);

      // 2. Seed customers
      console.log('🌱 [DB SEED] Seeding customers table...');
      for (const c of seedCustomers) {
        await client.query(
          'INSERT INTO customers (user_id, bio, favorite_workers, address) VALUES ($1, $2, $3, $4)',
          [c.user_id, c.bio, c.favorite_workers || [], c.address]
        );
      }

      // 3. Seed contractors
      console.log('🌱 [DB SEED] Seeding contractors table...');
      for (const t of seedContractors) {
        await client.query(
          'INSERT INTO contractors (user_id, company_name, projects_count) VALUES ($1, $2, $3)',
          [t.user_id, t.company_name, t.projects_count]
        );
      }

      // 4. Seed workers
      console.log('🌱 [DB SEED] Seeding workers table...');
      for (const w of workersData) {
        await client.query(
          'INSERT INTO workers (user_id, skills, experience_years, hourly_rate, bio, status, rating, completed_jobs_count, verified, verification_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [w.id, w.skills, w.experience_years, w.hourly_rate, w.bio, w.status, w.rating, w.completed_jobs_count, w.verified, w.verification_status]
        );
      }

      // 5. Seed worker locations
      console.log('🌱 [DB SEED] Seeding worker locations...');
      for (const w of workersData) {
        await client.query(
          'INSERT INTO worker_locations (worker_id, latitude, longitude) VALUES ($1, $2, $3)',
          [w.id, w.loc.lat, w.loc.lng]
        );
      }

      // 6. Seed groups
      console.log('🌱 [DB SEED] Seeding groups...');
      for (const g of seedGroups) {
        await client.query(
          'INSERT INTO groups (id, name, description, leader_id, rating) VALUES ($1, $2, $3, $4, $5)',
          [g.id, g.name, g.description, g.leader_id, g.rating]
        );
        // Link the leader worker back to their group
        await client.query(
          'UPDATE workers SET group_id = $1 WHERE user_id = $2',
          [g.id, g.leader_id]
        );
        // Add the leader to group members
        await client.query(
          'INSERT INTO group_members (group_id, worker_id) VALUES ($1, $2)',
          [g.id, g.leader_id]
        );
      }

      // 7. Seed shops
      console.log('🌱 [DB SEED] Seeding shops...');
      for (const s of seedShops) {
        await client.query(
          'INSERT INTO shops (id, name, category, rating, phone, address, latitude, longitude, availability) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [s.id, s.name, s.category, s.rating, s.phone, s.address, s.latitude, s.longitude, s.availability]
        );
      }

      // 8. Seed default wallets transaction histories
      console.log('🌱 [DB SEED] Verifying wallet starting balances...');
      await client.query(`
        INSERT INTO transactions (wallet_id, type, amount, status, description)
        SELECT id, 'deposit', 5000.00, 'completed', 'Initial simulated sign-up bonus credits.' FROM wallets
        ON CONFLICT DO NOTHING;
      `);

      console.log('🔥 [DB SEED] Full database seeding executed successfully!');
    } catch (err) {
      console.error('❌ [DB SEED] Seeding failed:', err.message);
    }
  };

  const initializeTables = async () => {
    try {
      // Create shops table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS shops (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL CHECK (category IN ('Hardware', 'Plumbing', 'Electrical', 'Material Supplier')),
            rating NUMERIC(3,2) DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00),
            phone VARCHAR(50) NOT NULL,
            address TEXT NOT NULL,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            availability VARCHAR(100) DEFAULT 'Open' CHECK (availability IN ('Open', 'Closed', 'Busy'))
        );
      `);
      console.log('🏗️ [DB INITIALIZATION] "shops" table verified/created.');

      // 1. Ensure full_name column exists in users table on Supabase
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
      `);
      await pool.query(`
        UPDATE users SET full_name = name WHERE full_name IS NULL;
      `);
      
      // 2. Ensure workers status CHECK constraint supports 'on_the_way'
      await pool.query(`
        ALTER TABLE workers DROP CONSTRAINT IF EXISTS workers_status_check;
        ALTER TABLE workers ADD CONSTRAINT workers_status_check CHECK (status IN ('online', 'offline', 'busy', 'on_the_way'));
      `);

      // 3. Create booking_photos table for work proof uploads
      await pool.query(`
        CREATE TABLE IF NOT EXISTS booking_photos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
          worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
          image_url TEXT NOT NULL,
          image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('before', 'after')),
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 4. Add lifecycle timestamp columns + otp_verified to bookings table
      await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT false;`);
      await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP WITH TIME ZONE;`);
      await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;`);
      await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;`);
      await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_name TEXT;`);
      await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_phone TEXT;`);
      
      // 5. Extend bookings status check to include 'on_the_way' and 'arrived'
      await pool.query(`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;`);
      await pool.query(`ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending','accepted','on_the_way','arrived','started','completed','verified','cancelled'));`);

      console.log('🏗️ [DB INITIALIZATION] Schema repairs completed on "users", "workers", "booking_photos", and "bookings" tables.');

      // 2. Check if we need to seed the database
      const adminCheck = await pool.query("SELECT COUNT(*) FROM users WHERE email = 'admin@labourconnect.com'");
      const count = parseInt(adminCheck.rows[0].count);
      
      if (count === 0) {
        console.log('🌱 [DB SEED] Seeded admin user not found. Performing full database seeding...');
        await seedDatabase(pool);
      } else {
        console.log('🌱 [DB SEED] Seeding skipped: Seeded accounts already present.');
      }
    } catch (error) {
      console.error('❌ Error during database schema audit / seeding:', error.message);
    }
  };
  
  const connectWithRetry = () => {
    attempt++;
    try {
      if (!pool) {
        pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('railway')
            ? { rejectUnauthorized: false }
            : false
        });
        console.log('🔌 Database pool constructed successfully.');
      }
      
      pool.query('SELECT NOW()')
        .then(() => {
          console.log('🔌 [POSTGRESQL] Connected successfully to direct database instance!');
          console.log('🔌 PostgreSQL connected');
          if (process.env.DATABASE_URL.includes('supabase')) {
            console.log('☁️ [SUPABASE] Connection established and operational.');
            console.log('☁️ Supabase initialized');
          }
          useMock = false;
          initializeTables();
        })
        .catch(err => {
          console.error(`❌ [POSTGRESQL] Connection query failed (Attempt ${attempt}/${maxAttempts}):`, err.message);
          if (attempt < maxAttempts) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`🔌 Retrying database connection in ${delay}ms...`);
            setTimeout(connectWithRetry, delay);
          } else {
            console.log('🤖 [FALLBACK] Falling back to self-contained reactive in-memory database.');
            console.log('🤖 fallback DB active');
            useMock = true;
            initMockDatabase();
          }
        });
    } catch (error) {
      console.error(`❌ Failed constructor attempt (Attempt ${attempt}/${maxAttempts}):`, error.message);
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`🔌 Retrying database connection in ${delay}ms...`);
        setTimeout(connectWithRetry, delay);
      } else {
        console.log('🤖 fallback DB active');
        useMock = true;
        initMockDatabase();
      }
    }
  };

  connectWithRetry();
}

// Custom Query Interface
const query = async (text, params = []) => {
  if (useMock) {
    return queryMock(text, params);
  }

  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.warn(`❌ SQL Execution error. Falling back to Mock DB for query: "${text.substring(0, 100)}..."`);
    console.error(error);
    if (Object.keys(mockDb).length === 0) {
      initMockDatabase();
    }
    console.log('🤖 fallback DB active');
    return queryMock(text, params);
  }
};

// Extremely Simple Mock Query Parser & Selector
const queryMock = async (text, params) => {
  const norm = text.toLowerCase().replace(/\s+/g, ' ').trim();
  
  if (norm.startsWith('select')) {
    // 1. Relational hydration queries with LEFT JOIN (getFullProfile)
    if (norm.includes('from users') && (norm.includes('left join customers') || norm.includes('left join workers') || norm.includes('left join contractors'))) {
      const id = params[0];
      const user = mockDb.users.find(u => u.id === id);
      if (!user) return { rows: [] };
      
      // Deep copy to avoid mutating cache
      const hydrated = { ...user, full_name: user.full_name || user.name, profile_image: user.avatar_url };
      
      if (norm.includes('left join customers')) {
        const customer = mockDb.customers.find(c => c.user_id === id);
        if (customer) {
          Object.assign(hydrated, customer);
        }
      } else if (norm.includes('left join workers')) {
        const worker = mockDb.workers.find(w => w.user_id === id);
        if (worker) {
          Object.assign(hydrated, worker);
        }
      } else if (norm.includes('left join contractors')) {
        const contractor = mockDb.contractors.find(c => c.user_id === id);
        if (contractor) {
          Object.assign(hydrated, contractor);
        }
      }
      return { rows: [hydrated] };
    }

    // 2. SELECT FROM users WHERE LOWER(email) = LOWER($1) OR phone = $2 (registration check)
    if (norm.includes('from users') && norm.includes('lower(email)') && norm.includes('phone =')) {
      const email = params[0] ? params[0].toLowerCase() : '';
      const phone = params[1];
      const user = mockDb.users.find(u => u.email.toLowerCase() === email || u.phone === phone);
      return { rows: user ? [user] : [] };
    }

    // 3. SELECT FROM users WHERE LOWER(email) = LOWER($1) (login)
    if (norm.includes('from users') && norm.includes('lower(email) = lower($1)')) {
      const email = params[0] ? params[0].toLowerCase() : '';
      const user = mockDb.users.find(u => u.email.toLowerCase() === email);
      return { rows: user ? [user] : [] };
    }

    // 4. SELECT FROM users WHERE email = $1 or similar
    if (norm.includes('from users') && norm.includes('email =')) {
      const email = params[0] ? params[0].toLowerCase() : '';
      const user = mockDb.users.find(u => u.email.toLowerCase() === email);
      return { rows: user ? [user] : [] };
    }

    // 5. SELECT FROM users WHERE id = $1
    if (norm.includes('from users') && norm.includes('id =')) {
      const id = params[0];
      const user = mockDb.users.find(u => u.id === id);
      return { rows: user ? [user] : [] };
    }

    // 6. SELECT FROM workers (list nearby or online)
    if (norm.includes('from workers') && norm.includes('status =')) {
      let activeWorkers = mockDb.workers
        .filter(w => w.status === 'online')
        .map(w => {
          const u = mockDb.users.find(usr => usr.id === w.user_id);
          const loc = mockDb.worker_locations.find(l => l.worker_id === w.user_id);
          return { ...w, name: u?.name, avatar_url: u?.avatar_url, phone: u?.phone, latitude: loc?.latitude, longitude: loc?.longitude };
        });
      // Handle skill query parameter if it exists (usually $3 in getNearbyWorkers)
      if (params.length > 2 && params[2]) {
        const skillQuery = params[2].toLowerCase();
        activeWorkers = activeWorkers.filter(w => w.skills.some(s => s.toLowerCase() === skillQuery));
      }
      return { rows: activeWorkers };
    }

    // 7. List all workers
    if (norm.includes('from workers')) {
      let allWorkers = mockDb.workers.map(w => {
        const u = mockDb.users.find(usr => usr.id === w.user_id);
        const loc = mockDb.worker_locations.find(l => l.worker_id === w.user_id);
        return { ...w, name: u?.name, avatar_url: u?.avatar_url, phone: u?.phone, latitude: loc?.latitude, longitude: loc?.longitude };
      });
      if (params.length > 2 && params[2]) {
        const skillQuery = params[2].toLowerCase();
        allWorkers = allWorkers.filter(w => w.skills.some(s => s.toLowerCase() === skillQuery));
      }
      return { rows: allWorkers };
    }

    // 8. SELECT * FROM workers/customers/contractors WHERE user_id = $1 (non-joined)
    if (norm.includes('from workers') && norm.includes('user_id =')) {
      const uid = params[0];
      const worker = mockDb.workers.find(w => w.user_id === uid);
      return { rows: worker ? [worker] : [] };
    }
    if (norm.includes('from customers') && norm.includes('user_id =')) {
      const uid = params[0];
      const customer = mockDb.customers.find(c => c.user_id === uid);
      return { rows: customer ? [customer] : [] };
    }
    if (norm.includes('from contractors') && norm.includes('user_id =')) {
      const uid = params[0];
      const contractor = mockDb.contractors.find(t => t.user_id === uid);
      return { rows: contractor ? [contractor] : [] };
    }

    // 9. SELECT FROM groups
    if (norm.includes('from groups')) {
      return { rows: mockDb.groups };
    }

    // 10. SELECT FROM bookings
    if (norm.includes('from bookings') && (norm.includes('customer_id =') || norm.includes('contractor_id ='))) {
      const uid = params[0];
      const list = mockDb.bookings.filter(b => b.customer_id === uid || b.contractor_id === uid);
      return { rows: list };
    }
    if (norm.includes('from bookings') && norm.includes('worker_id =')) {
      const uid = params[0];
      const list = mockDb.bookings.filter(b => b.worker_id === uid);
      return { rows: list };
    }
    if (norm.includes('from bookings') && norm.includes('id =')) {
      const bid = params[0];
      const booking = mockDb.bookings.find(b => b.id === bid);
      return { rows: booking ? [booking] : [] };
    }
    if (norm.includes('from bookings')) {
      return { rows: mockDb.bookings };
    }

    // 11. SELECT FROM wallets
    if (norm.includes('from wallets') && norm.includes('user_id =')) {
      const uid = params[0];
      const wallet = mockDb.wallets.find(w => w.user_id === uid);
      return { rows: wallet ? [wallet] : [] };
    }

    // 12. SELECT FROM transactions
    if (norm.includes('from transactions')) {
      return { rows: mockDb.transactions };
    }

    // 13. SELECT FROM government_schemes
    if (norm.includes('from government_schemes')) {
      return { rows: mockDb.government_schemes };
    }

    // 14. SELECT FROM financial_learning
    if (norm.includes('from financial_learning')) {
      return { rows: mockDb.financial_learning };
    }

    // Default fallback select
    const match = norm.match(/from\s+([a-z_]+)/);
    if (match && mockDb[match[1]]) {
      return { rows: mockDb[match[1]] };
    }
    return { rows: [] };
  }

  if (norm.startsWith('insert')) {
    // 1. INSERT INTO users
    if (norm.includes('into users')) {
      const crypto = require('crypto');
      const userId = crypto.randomUUID ? crypto.randomUUID() : `u-${Math.random().toString(36).substr(2, 9)}`;
      
      // In register, parameters are: [normalizedEmail, passwordHash, role, name, name, phone, avatar_url]
      const email = params[0];
      const password_hash = params[1];
      const role = params[2];
      const name = params[3];
      const full_name = params[4] || name;
      const phone = params[5];
      const avatar_url = params[6] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

      const newUser = {
        id: userId,
        email,
        password_hash,
        role,
        name,
        full_name,
        phone,
        avatar_url,
        created_at: new Date()
      };
      mockDb.users.push(newUser);
      
      // Execute auto-create wallet side-effect
      mockDb.wallets.push({
        id: `wa-${userId.slice(0, 8)}`,
        user_id: userId,
        balance: role === 'worker' ? 0.00 : 5000.00
      });

      return { rows: [newUser] };
    }

    // 2. INSERT INTO workers
    if (norm.includes('into workers')) {
      const newWorker = {
        user_id: params[0],
        skills: params[1] || [],
        experience_years: params[2] || 0,
        hourly_rate: params[3] || 0.00,
        bio: params[4] || '',
        status: 'offline',
        rating: 5.0,
        completed_jobs_count: 0,
        group_id: null,
        verified: false,
        verification_status: 'pending'
      };
      mockDb.workers.push(newWorker);
      return { rows: [newWorker] };
    }

    // 3. INSERT INTO customers
    if (norm.includes('into customers')) {
      const newCustomer = {
        user_id: params[0],
        bio: params[1] || '',
        favorite_workers: [],
        address: params[2] || ''
      };
      mockDb.customers.push(newCustomer);
      return { rows: [newCustomer] };
    }

    // 4. INSERT INTO contractors
    if (norm.includes('into contractors')) {
      const newContr = {
        user_id: params[0],
        company_name: params[1] || '',
        projects_count: 0
      };
      mockDb.contractors.push(newContr);
      return { rows: [newContr] };
    }

    // 5. INSERT INTO worker_locations
    if (norm.includes('into worker_locations')) {
      const loc = {
        worker_id: params[0],
        latitude: parseFloat(params[1]),
        longitude: parseFloat(params[2]),
        last_updated: new Date()
      };
      mockDb.worker_locations.push(loc);
      return { rows: [loc] };
    }

    // 6. INSERT INTO bookings
    if (norm.includes('into bookings')) {
      const newBooking = {
        id: params[0] || `b-${Math.random().toString(36).substr(2, 9)}`,
        customer_id: params[1],
        contractor_id: params[2],
        worker_id: params[3],
        group_id: params[4],
        service_type: params[5],
        booking_type: params[6] || 'instant',
        status: 'pending',
        total_amount: params[7] || 0.00,
        payment_status: 'pending',
        otp: Math.floor(100000 + Math.random() * 900000).toString(),
        latitude: params[8],
        longitude: params[9],
        address: params[10],
        created_at: new Date(),
        updated_at: new Date()
      };
      mockDb.bookings.push(newBooking);
      return { rows: [newBooking] };
    }

    // 7. INSERT INTO transactions
    if (norm.includes('into transactions')) {
      const tx = {
        id: `tx-${Math.random().toString(36).substr(2, 9)}`,
        wallet_id: params[0],
        booking_id: params[1],
        type: params[2],
        amount: params[3],
        status: params[4] || 'completed',
        description: params[5],
        created_at: new Date()
      };
      mockDb.transactions.push(tx);
      // Adjust wallet balance
      const wall = mockDb.wallets.find(w => w.id === tx.wallet_id);
      if (wall) {
        const amt = parseFloat(tx.amount);
        if (tx.type === 'credit' || tx.type === 'deposit') {
          wall.balance = parseFloat(wall.balance) + amt;
        } else {
          wall.balance = parseFloat(wall.balance) - amt;
        }
      }
      return { rows: [tx] };
    }

    // 8. INSERT INTO booking_photos
    if (norm.includes('into booking_photos')) {
      const crypto = require('crypto');
      const photo = {
        id: crypto.randomUUID ? crypto.randomUUID() : `ph-${Math.random().toString(36).substr(2, 9)}`,
        booking_id: params[0],
        worker_id: params[1],
        image_url: params[2],
        image_type: params[3],
        uploaded_at: new Date()
      };
      if (!mockDb.booking_photos) mockDb.booking_photos = [];
      mockDb.booking_photos.push(photo);
      return { rows: [photo] };
    }
  }

  if (norm.startsWith('update')) {
    // 1. UPDATE workers SET status = $1 WHERE user_id = $2
    if (norm.includes('update workers') && norm.includes('status =') && norm.includes('user_id =')) {
      const status = params[0];
      const uid = params[1];
      const worker = mockDb.workers.find(w => w.user_id === uid);
      if (worker) {
        worker.status = status;
        return { rows: [worker], rowCount: 1 };
      }
    }
    // 2. UPDATE bookings SET status = $1 WHERE id = $2
    if (norm.includes('update bookings') && norm.includes('status =') && norm.includes('id =')) {
      const status = params[0];
      const bid = params[1];
      const booking = mockDb.bookings.find(b => b.id === bid);
      if (booking) {
        booking.status = status;
        if (status === 'started') booking.start_time = new Date();
        if (status === 'completed') booking.end_time = new Date();
        return { rows: [booking], rowCount: 1 };
      }
    }
    // 3. UPDATE wallets SET balance = $1 WHERE user_id = $2
    if (norm.includes('update wallets') && norm.includes('balance =') && norm.includes('user_id =')) {
      const bal = params[0];
      const uid = params[1];
      const wallet = mockDb.wallets.find(w => w.user_id === uid);
      if (wallet) {
        wallet.balance = parseFloat(bal);
        return { rows: [wallet], rowCount: 1 };
      }
    }
    // 4. Update worker locations
    if (norm.includes('update worker_locations')) {
      const uid = params[0];
      const lat = params[1];
      const lng = params[2];
      let loc = mockDb.worker_locations.find(l => l.worker_id === uid);
      if (!loc) {
        loc = { worker_id: uid, latitude: lat, longitude: lng, last_updated: new Date() };
        mockDb.worker_locations.push(loc);
      } else {
        loc.latitude = lat;
        loc.longitude = lng;
        loc.last_updated = new Date();
      }
      return { rows: [loc], rowCount: 1 };
    }
  }

  return { rows: [], rowCount: 0 };
};

module.exports = { query };
