import { pool } from '../config/db.js';

// POST /api/enquiries - Public endpoint for website visitors
export async function createEnquiry(req, res) {
  try {
    const {
      customer_name,
      customer_phone,
      customer_email,
      company_name,
      box_type,
      quantity,
      message,
    } = req.body;

    if (!customer_name || !customer_phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and WhatsApp phone number are required.',
      });
    }

    const cleanPhone = String(customer_phone).replace(/\D/g, '');

    const [result] = await pool.query(
      `INSERT INTO enquiries (customer_name, customer_phone, customer_email, company_name, box_type, quantity, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        customer_name.trim(),
        cleanPhone,
        customer_email ? customer_email.trim() : null,
        company_name ? company_name.trim() : null,
        box_type || 'Mailer Box',
        Number(quantity) || 1000,
        message ? message.trim() : null,
      ]
    );

    return res.status(201).json({
      success: true,
      enquiryId: result.insertId,
      message: 'Enquiry submitted successfully! Our factory team will send an estimate on WhatsApp.',
    });
  } catch (error) {
    console.error('Error creating enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record enquiry. Please try again.',
      error: error.message,
    });
  }
}

// GET /api/enquiries - Staff/Admin view of incoming leads
export async function getEnquiries(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM enquiries ORDER BY created_at DESC'
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve enquiries.',
    });
  }
}

