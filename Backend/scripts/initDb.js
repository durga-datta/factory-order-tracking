import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = Number(process.env.DB_PORT) || 3306;
  const dbName = process.env.DB_NAME || 'factory_order_tracking';

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);

  // Connect without DB selected to create DB if needed
  const rootConn = await mysql.createConnection({
    host,
    user,
    password,
    port,
    multipleStatements: true,
  });

  try {
    console.log(`Creating database "${dbName}" if not exists...`);
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);

    // Now connect to the specific database
    await rootConn.changeUser({ database: dbName });

    // Read schema.sql and execute
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema table creation...');
    await rootConn.query(schemaSql);
    console.log('✅ Tables created successfully.');

    // Seed default Admin if not exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@boxshop.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const [existing] = await rootConn.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [adminEmail]
    );

    if (existing.length === 0) {
      console.log(`Seeding initial Admin account (${adminEmail})...`);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      const allPermissions = JSON.stringify([
        'create_order',
        'update_spec',
        'manage_sample',
        'approve_order',
        'production_ops',
        'qc_check',
        'dispatch_ops',
        'manage_staff',
        'view_reports',
      ]);

      await rootConn.query(
        `INSERT INTO users (name, email, phone, password_hash, role, permissions, status)
         VALUES (?, ?, ?, ?, 'admin', ?, 'active')`,
        [
          'Rajesh Mohanty (Owner)',
          adminEmail,
          '9861012345',
          passwordHash,
          allPermissions,
        ]
      );

      console.log('✅ Default Admin seeded successfully.');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      console.log(`Admin account (${adminEmail}) already exists.`);
    }
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
  } finally {
    await rootConn.end();
  }
}

initDatabase();
