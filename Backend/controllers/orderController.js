import { pool } from '../config/db.js';
import { sendWhatsAppNotification } from '../services/whatsappService.js';

// Stages in sequence
const STAGES_SEQUENCE = [
  'enquiry',
  'spec_sheet',
  'design_sample',
  'approved',
  'production',
  'qc',
  'dispatch',
  'delivered',
];

// Helper to generate next sequential Order ID
async function getNextOrderId() {
  const [rows] = await pool.query(
    'SELECT id FROM orders ORDER BY created_at DESC LIMIT 1'
  );
  if (rows.length === 0) return 'BX-1001';

  const lastId = rows[0].id;
  const numPart = parseInt(lastId.replace(/\D/g, ''), 10);
  const nextNum = isNaN(numPart) ? 1001 : numPart + 1;
  return `BX-${nextNum}`;
}

// POST /api/orders - Staff/Admin creates order
export async function createOrder(req, res) {
  try {
    const {
      customer_name,
      customer_phone,
      customer_email,
      company_name,
      product_name,
      box_type,
      quantity,
      target_deadline,
      estimated_delivery_date,
      // Optional initial specs
      ply,
      length,
      width,
      height,
      unit_price,
    } = req.body;

    if (!customer_name || !customer_phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and WhatsApp phone number are required.',
      });
    }

    const orderId = await getNextOrderId();
    const cleanPhone = String(customer_phone).replace(/\D/g, '');
    const estDelivery = estimated_delivery_date || target_deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const targetDeadline = target_deadline || estDelivery;
    const qty = Number(quantity) || 1000;
    const prodName = product_name || `${ply || '3-Ply'} ${box_type || 'Mailer Box'}`;

    // 1. Insert into orders table
    await pool.query(
      `INSERT INTO orders (id, customer_name, customer_phone, customer_email, company_name, product_name, box_type, quantity, target_deadline, estimated_delivery_date, current_stage, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'enquiry', ?)`,
      [
        orderId,
        customer_name.trim(),
        cleanPhone,
        customer_email ? customer_email.trim() : null,
        company_name ? company_name.trim() : null,
        prodName,
        box_type || 'Mailer Box',
        qty,
        targetDeadline,
        estDelivery,
        req.user?.id || null,
      ]
    );

    // 2. Insert into order_specs table
    const rate = Number(unit_price) || 20;
    const totalAmt = qty * rate;
    await pool.query(
      `INSERT INTO order_specs (order_id, length, width, height, unit, ply, board_grade, flute_type, print_type, unit_price, total_amount, advance_amount)
       VALUES (?, ?, ?, ?, 'inch', ?, 'Virgin Kraft 180 GSM Top', 'E-Flute (Micro)', '2-Color Flexo', ?, ?, ?)`,
      [
        orderId,
        length || 10,
        width || 8,
        height || 4,
        ply || '3-Ply',
        rate,
        totalAmt,
        Math.round(totalAmt * 0.5),
      ]
    );

    // 3. Insert into samples table (Solves Lost Samples)
    const sampleId = `SMP-${orderId}`;
    await pool.query(
      `INSERT INTO samples (order_id, sample_code, sample_status, shelf_location, notes)
       VALUES (?, ?, 'Preparation', 'Sample Room Shelf A-1', 'Initial sample allocated upon enquiry')`,
      [orderId, sampleId]
    );

    // 4. Insert into production_status
    await pool.query(
      `INSERT INTO production_status (order_id, current_substage, completed_substages)
       VALUES (?, 'Order Logged', '[]')`,
      [orderId]
    );

    // 5. Trigger Stage 1 (Enquiry) WhatsApp notification
    const waResult = await sendWhatsAppNotification(orderId, 'enquiry', {
      customerName: customer_name,
      customerPhone: cleanPhone,
      productName: prodName,
      boxType: box_type,
      quantity: qty,
      date: estDelivery,
    });

    return res.status(201).json({
      success: true,
      message: `Order #${orderId} created successfully. Estimated delivery set to ${estDelivery}.`,
      orderId,
      whatsAppNotification: waResult,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order.',
      error: error.message,
    });
  }
}

// GET /api/orders - Fetch all orders
export async function getOrders(req, res) {
  try {
    const [orders] = await pool.query(`
      SELECT 
        o.*,
        s.ply, s.board_grade, s.unit_price, s.total_amount, s.advance_amount, s.advance_paid, s.approved_by_customer,
        s.length, s.width, s.height, s.print_type, s.flute_type,
        sm.sample_code, sm.sample_status, sm.shelf_location,
        qc.status as qc_status,
        d.id as dispatch_id, d.mode as dispatch_mode, d.vehicle as dispatch_vehicle, d.tracking_no as dispatch_tracking_no
      FROM orders o
      LEFT JOIN (
        SELECT s1.* FROM order_specs s1
        INNER JOIN (SELECT order_id, MAX(id) as max_id FROM order_specs GROUP BY order_id) s2
        ON s1.id = s2.max_id
      ) s ON o.id = s.order_id
      LEFT JOIN (
        SELECT sm1.* FROM samples sm1
        INNER JOIN (SELECT order_id, MAX(id) as max_id FROM samples GROUP BY order_id) sm2
        ON sm1.id = sm2.max_id
      ) sm ON o.id = sm.order_id
      LEFT JOIN (
        SELECT qc1.* FROM qc_records qc1
        INNER JOIN (SELECT order_id, MAX(id) as max_id FROM qc_records GROUP BY order_id) qc2
        ON qc1.id = qc2.max_id
      ) qc ON o.id = qc.order_id
      LEFT JOIN (
        SELECT d1.* FROM dispatch_records d1
        INNER JOIN (SELECT order_id, MAX(id) as max_id FROM dispatch_records GROUP BY order_id) d2
        ON d1.id = d2.max_id
      ) d ON o.id = d.order_id
      ORDER BY o.created_at DESC
    `);

    // Calculate delay dynamically
    const now = new Date();
    const enrichedOrders = orders.map((o) => {
      const deadline = new Date(o.target_deadline);
      const isLate = o.current_stage !== 'delivered' && now > deadline;
      return {
        ...o,
        is_delayed: o.is_delayed || isLate,
      };
    });

    return res.json({ success: true, data: enrichedOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
}

// GET /api/orders/:id - Fetch single order complete details
export async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orders[0];

    const [specs] = await pool.query('SELECT * FROM order_specs WHERE order_id = ? ORDER BY id DESC LIMIT 1', [id]);
    const [samples] = await pool.query('SELECT * FROM samples WHERE order_id = ? ORDER BY id DESC LIMIT 1', [id]);
    const [prodStatus] = await pool.query('SELECT * FROM production_status WHERE order_id = ? ORDER BY id DESC LIMIT 1', [id]);
    const [qcRecords] = await pool.query('SELECT * FROM qc_records WHERE order_id = ? ORDER BY id DESC', [id]);
    const [dispatch] = await pool.query('SELECT * FROM dispatch_records WHERE order_id = ? ORDER BY id DESC LIMIT 1', [id]);
    const [reviews] = await pool.query('SELECT * FROM delivery_reviews WHERE order_id = ? ORDER BY id DESC LIMIT 1', [id]);
    const [whatsappLogs] = await pool.query('SELECT * FROM whatsapp_logs WHERE order_id = ? ORDER BY sent_at ASC', [id]);

    return res.json({
      success: true,
      data: {
        ...order,
        specSheet: specs[0] || null,
        sample: samples[0] || null,
        productionStatus: prodStatus[0] || null,
        qc: qcRecords[0] || null,
        dispatch: dispatch[0] || null,
        review: reviews[0] || null,
        whatsappHistory: whatsappLogs || [],
      },
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({ success: false, message: 'Failed to load order.' });
  }
}

// POST /api/orders/:id/advance - 1-Tap stage advancement
export async function advanceOrderStage(req, res) {
  try {
    const { id } = req.params;
    const { targetStage, notes, advanceAmount } = req.body;

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orders[0];
    const currentIndex = STAGES_SEQUENCE.indexOf(order.current_stage);

    let nextStage = targetStage;
    if (!nextStage) {
      if (currentIndex < STAGES_SEQUENCE.length - 1) {
        nextStage = STAGES_SEQUENCE[currentIndex + 1];
      } else {
        return res.status(400).json({ success: false, message: 'Order is already at final stage.' });
      }
    }

    // Special: QC stage progression must be done via submitQC
    if (order.current_stage === 'qc' && nextStage === 'dispatch') {
      return res.status(400).json({
        success: false,
        message: 'Orders in QC must be verified using the QC checklist & photo proof inspection.',
      });
    }

    // Special: Dispatch stage progression requires dispatch record
    if (order.current_stage === 'dispatch' && nextStage === 'delivered') {
      const [dispatch] = await pool.query('SELECT id FROM dispatch_records WHERE order_id = ? LIMIT 1', [id]);
      if (dispatch.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please complete the Dispatch details (vehicle/driver or pickup) before marking as delivered.',
        });
      }
    }

    // Update order stage
    await pool.query('UPDATE orders SET current_stage = ? WHERE id = ?', [nextStage, id]);

    // Handle stage-specific updates
    if (nextStage === 'approved') {
      await pool.query(
        'UPDATE order_specs SET approved_by_customer = TRUE, approved_at = NOW(), advance_paid = TRUE, advance_date = CURDATE() WHERE order_id = ?',
        [id]
      );
    }

    // Trigger WhatsApp notification for the new stage
    const waResult = await sendWhatsAppNotification(id, nextStage, {
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      productName: order.product_name,
      quantity: order.quantity,
      date: order.estimated_delivery_date,
      advanceAmount: advanceAmount || '50%',
    });

    return res.json({
      success: true,
      message: `Order #${id} advanced to stage: ${nextStage}.`,
      currentStage: nextStage,
      whatsAppNotification: waResult,
    });
  } catch (error) {
    console.error('Error advancing stage:', error);
    return res.status(500).json({ success: false, message: 'Failed to advance stage.' });
  }
}

// POST /api/orders/:id/qc - Execute QC checklist & photos (with Fail -> Back to Production loop)
export async function submitQCInspection(req, res) {
  try {
    const { id } = req.params;
    const { checklist, notes, photos, status, fail_reason } = req.body;

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    const order = orders[0];

    const inspectorName = req.user?.name || 'QC Inspector';
    const isPassed = status === 'Passed';

    // 1. Record in qc_records table
    await pool.query(
      `INSERT INTO qc_records (order_id, status, inspector_id, inspector_name, checklist, notes, photos, fail_reason, checked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        isPassed ? 'Passed' : 'Failed',
        req.user?.id || null,
        inspectorName,
        JSON.stringify(checklist || {}),
        notes || null,
        JSON.stringify(photos || []),
        isPassed ? null : (fail_reason || 'Defect found during QC checklist'),
      ]
    );

    let nextStage = '';
    let waKey = '';

    if (isPassed) {
      // QC Passed -> Advances to Stage 7 (Dispatch)
      nextStage = 'dispatch';
      waKey = 'qc_passed';
      await pool.query('UPDATE orders SET current_stage = "dispatch" WHERE id = ?', [id]);
    } else {
      // QC Failed -> Routes BACK to Stage 5 (Production)
      nextStage = 'production';
      waKey = 'qc_failed';
      await pool.query('UPDATE orders SET current_stage = "production" WHERE id = ?', [id]);
    }

    // Trigger WhatsApp
    const waResult = await sendWhatsAppNotification(id, waKey, {
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      productName: order.product_name,
      failReason: fail_reason,
    });

    return res.json({
      success: true,
      message: isPassed
        ? `Order #${id} passed QC with 100% score! Moved to Dispatch.`
        : `Order #${id} rejected during QC. Routed BACK to Production floor.`,
      currentStage: nextStage,
      whatsAppNotification: waResult,
    });
  } catch (error) {
    console.error('Error processing QC inspection:', error);
    return res.status(500).json({ success: false, message: 'Failed to process QC inspection.' });
  }
}

// POST /api/orders/:id/dispatch - Dispatch Order (Delivery vs Self-Pickup)
export async function submitDispatch(req, res) {
  try {
    const { id } = req.params;
    const { mode, vehicle, driver_phone, tracking_no, invoice_no, pickup_address, pickup_timings, mark_delivered } = req.body;

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    const order = orders[0];

    // Save dispatch record
    await pool.query(
      `INSERT INTO dispatch_records (order_id, mode, vehicle, driver_phone, tracking_no, invoice_no, pickup_address, pickup_timings, dispatched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        mode || 'delivery',
        vehicle || null,
        driver_phone || null,
        tracking_no || null,
        invoice_no || `INV-${id}`,
        pickup_address || 'Box Shop, Shed 42-B, Mancheswar IE, Bhubaneswar',
        pickup_timings || '9:30 AM - 6:30 PM',
      ]
    );

    let nextStage = order.current_stage;
    let waResult = null;

    if (mark_delivered) {
      nextStage = 'delivered';
      await pool.query('UPDATE orders SET current_stage = "delivered" WHERE id = ?', [id]);
      waResult = await sendWhatsAppNotification(id, 'delivered', {
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        productName: order.product_name,
      });
    } else {
      // Trigger WhatsApp (Delivery template vs Pickup template)
      const templateKey = mode === 'pickup' ? 'dispatch_pickup' : 'dispatch_delivery';
      waResult = await sendWhatsAppNotification(id, templateKey, {
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        productName: order.product_name,
        vehicle: vehicle || 'Tata Ace (OD-02-X-4912)',
        date: new Date().toLocaleDateString('en-IN'),
      });
    }

    return res.json({
      success: true,
      message: mark_delivered
        ? `Order #${id} marked as Delivered. Review link sent via WhatsApp!`
        : `Order #${id} dispatch info recorded. WhatsApp sent for ${mode === 'pickup' ? 'Counter Pickup' : 'Vehicle Dispatch'}!`,
      currentStage: nextStage,
      whatsAppNotification: waResult,
    });
  } catch (error) {
    console.error('Error saving dispatch:', error);
    return res.status(500).json({ success: false, message: 'Failed to process dispatch.' });
  }
}

// POST /api/orders/:id/delay - Proactive Delay Alert to Customer
export async function broadcastDelayAlert(req, res) {
  try {
    const { id } = req.params;
    const { new_expected_date, delay_reason } = req.body;

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    const order = orders[0];

    await pool.query(
      'UPDATE orders SET is_delayed = TRUE, estimated_delivery_date = ?, delay_reason = ? WHERE id = ?',
      [new_expected_date, delay_reason || 'Floor operational delay', id]
    );

    const waResult = await sendWhatsAppNotification(id, 'delayed', {
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      date: new_expected_date,
      delayReason: delay_reason,
    });

    return res.json({
      success: true,
      message: `Delay alert sent to ${order.customer_name} via WhatsApp.`,
      whatsAppNotification: waResult,
    });
  } catch (error) {
    console.error('Error broadcasting delay alert:', error);
    return res.status(500).json({ success: false, message: 'Failed to broadcast delay alert.' });
  }
}


// GET /api/orders/:id/public - Public Customer tracking link (No login required)
export async function getPublicOrderTrack(req, res) {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(
      `SELECT id, customer_name, product_name, box_type, quantity, target_deadline, estimated_delivery_date, current_stage, is_delayed, created_at 
       FROM orders WHERE id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orders[0];
    const [specs] = await pool.query('SELECT * FROM order_specs WHERE order_id = ? ORDER BY id DESC LIMIT 1', [id]);
    const [samples] = await pool.query('SELECT sample_code, sample_status, notes FROM samples WHERE order_id = ? ORDER BY id DESC LIMIT 1', [id]);
    const [qcRecords] = await pool.query('SELECT status, photos, checked_at FROM qc_records WHERE order_id = ? AND status = "Passed" ORDER BY id DESC LIMIT 1', [id]);
    const [dispatch] = await pool.query('SELECT mode, vehicle, tracking_no, pickup_address, pickup_timings FROM dispatch_records WHERE order_id = ? ORDER BY id DESC LIMIT 1', [id]);

    return res.json({
      success: true,
      data: {
        ...order,
        specSheet: specs[0] || null,
        sample: samples[0] || null,
        qc: qcRecords[0] || null,
        dispatch: dispatch[0] || null,
      },
    });
  } catch (error) {
    console.error('Error fetching public order track:', error);
    return res.status(500).json({ success: false, message: 'Failed to load tracking data.' });
  }
}
