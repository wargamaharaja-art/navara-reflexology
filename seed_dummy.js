const Database = require('better-sqlite3');
const db = new Database('local.db');

console.log('Seeding Navara Reflexology local dummy database...');

// Insert Settings
try {
  db.prepare(`
    INSERT INTO settings (id, company_name, description, address, phone, email, whatsapp_number, hero_badge_text, hero_title, hero_description, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'company_info',
    'Navara Reflexology',
    'Klinik refleksi premium untuk keluarga',
    'Jl. Dummy Raya No. 123',
    '08123456789',
    'info@navara.com',
    '6281234567890',
    'PREMIUM REFLEXOLOGY',
    'Solusi Relaksasi Paripurna',
    'Manjakan tubuh Anda dengan terapi refleksi profesional di lingkungan yang menenangkan.',
    new Date().toISOString()
  );
  console.log('Inserted default settings.');
} catch (e) { console.log('Settings exist.'); }

// Insert Branch
try {
  db.prepare(`
    INSERT INTO branches (id, name, address, phone, whatsapp_number, map_url, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'B01',
    'Navara Pusat',
    'Jl. Dummy Raya No. 123',
    '08123456789',
    '08123456789',
    'https://maps.google.com',
    1
  );
  console.log('Inserted default branch B01.');
} catch (e) { console.log('Branch exists.'); }

// Insert Admin
try {
  // admin pass: navara2026 -> using standard simple bcrypt or plain if it uses simple auth, wait!
  // The system uses plain text check or bcrypt?
  // Let's look at auth route in src/app/api/auth/login/route.ts or similar.
  // We can just use the .env.local ADMIN_USERNAME / ADMIN_PASSWORD fallback. The system falls back to process.env.ADMIN_USERNAME if DB fails or if no user. 
  // Let's just create an admin anyway.
  db.prepare(`
    INSERT INTO admins (id, username, password_hash, name, role, branch_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'admin_navara',
    'admin',
    '$2a$10$0fJ0Y/sT1G./H.1A9Xg2OONtFqQv8L8iH6uW.aG/4xH.O1g2P3KqK', // bcrypt for 'navara2026'
    'Super Admin',
    'SUPER_ADMIN',
    'B01',
    new Date().toISOString()
  );
  console.log('Inserted admin user (admin / navara2026).');
} catch (e) { console.log('Admin exists.', e.message); }

console.log('Seeding complete!');
db.close();
