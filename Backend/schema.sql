-- Database Schema for Factory Order Tracking
CREATE DATABASE IF NOT EXISTS factory_order_tracking;
USE factory_order_tracking;

-- 1. Users Table (Admin & Staff with granular permissions)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  permissions JSON NULL COMMENT 'Array of permission keys e.g. ["create_order","update_spec","manage_sample","production","qc_check","dispatch"]',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Public Visitor Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(100) NULL,
  company_name VARCHAR(100) NULL,
  box_type VARCHAR(100) NULL,
  quantity INT NULL,
  message TEXT NULL,
  status ENUM('pending', 'contacted', 'converted', 'closed') DEFAULT 'pending',
  converted_order_id VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Orders Master Table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY, -- e.g. BX-1001
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(100) NULL,
  company_name VARCHAR(100) NULL,
  product_name VARCHAR(200) NOT NULL,
  box_type VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 1000,
  target_deadline DATE NOT NULL,
  estimated_delivery_date DATE NULL,
  current_stage ENUM(
    'enquiry',
    'spec_sheet',
    'design_sample',
    'approved',
    'production',
    'qc',
    'dispatch',
    'delivered'
  ) NOT NULL DEFAULT 'enquiry',
  is_delayed BOOLEAN DEFAULT FALSE,
  delay_reason TEXT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Order Specs Table (Digitized Spec Sheet)
CREATE TABLE IF NOT EXISTS order_specs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  length DECIMAL(8,2) NULL,
  width DECIMAL(8,2) NULL,
  height DECIMAL(8,2) NULL,
  unit VARCHAR(10) DEFAULT 'inch',
  ply VARCHAR(20) DEFAULT '3-Ply',
  board_grade VARCHAR(100) NULL,
  flute_type VARCHAR(50) NULL,
  gsm_top INT NULL,
  gsm_flute INT NULL,
  gsm_bottom INT NULL,
  print_type VARCHAR(100) NULL,
  finishing VARCHAR(100) NULL,
  unit_price DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) DEFAULT 0.00,
  advance_amount DECIMAL(12,2) DEFAULT 0.00,
  advance_paid BOOLEAN DEFAULT FALSE,
  advance_date DATE NULL,
  approved_by_customer BOOLEAN DEFAULT FALSE,
  approved_at DATETIME NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 5. Samples Tracking Table (Solves Lost Samples)
CREATE TABLE IF NOT EXISTS samples (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  sample_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. SMP-BX-101
  sample_status VARCHAR(50) DEFAULT 'Preparation',
  shelf_location VARCHAR(100) DEFAULT 'Sample Room Shelf A-1',
  notes TEXT NULL,
  design_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 6. Production Floor Status Table
CREATE TABLE IF NOT EXISTS production_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  current_substage VARCHAR(100) DEFAULT 'Reel Loading',
  machine_no VARCHAR(100) NULL,
  operator_name VARCHAR(100) NULL,
  completed_substages JSON NULL,
  notes TEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 7. QC Records Table (Checklist + Photo Proof + Fail to Production loop)
CREATE TABLE IF NOT EXISTS qc_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  status ENUM('Pending', 'Passed', 'Failed') DEFAULT 'Pending',
  inspector_id INT NULL,
  inspector_name VARCHAR(100) NULL,
  checklist JSON NULL,
  notes TEXT NULL,
  photos JSON NULL,
  fail_reason TEXT NULL,
  checked_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 8. Dispatch Records Table (Delivery vs Self-Pickup)
CREATE TABLE IF NOT EXISTS dispatch_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  mode ENUM('delivery', 'pickup') NOT NULL DEFAULT 'delivery',
  vehicle VARCHAR(100) NULL,
  driver_phone VARCHAR(50) NULL,
  tracking_no VARCHAR(100) NULL,
  invoice_no VARCHAR(100) NULL,
  pickup_address TEXT NULL,
  pickup_timings VARCHAR(100) NULL,
  dispatched_at DATETIME NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 9. Delivery Confirmation & Customer Reviews Table
CREATE TABLE IF NOT EXISTS delivery_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  rating INT DEFAULT 5,
  feedback TEXT NULL,
  delivered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 10. WhatsApp Logs Table
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NULL,
  template_key VARCHAR(100) NOT NULL,
  recipient_name VARCHAR(100) NULL,
  recipient_phone VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('sent', 'delivered', 'read', 'failed') DEFAULT 'delivered',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- 11. Seed default Admin account (Password: Admin@123)
INSERT INTO users (name, email, phone, password_hash, role, permissions, status)
VALUES (
  'Rajesh Mohanty (Owner)',
  'admin@boxshop.com',
  '9861012345',
  '$2b$10$LhvLTmFJ6W4OCMmWhOl/LO6JKmEPtSCK6QbqFNG2hS/z.n9jHWgxS',
  'admin',
  '["create_order", "update_spec", "manage_sample", "approve_order", "production_ops", "qc_check", "dispatch_ops", "manage_staff", "view_reports"]',
  'active'
)
ON DUPLICATE KEY UPDATE 
  password_hash = '$2b$10$LhvLTmFJ6W4OCMmWhOl/LO6JKmEPtSCK6QbqFNG2hS/z.n9jHWgxS',
  status = 'active';
