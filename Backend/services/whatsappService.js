import { pool } from '../config/db.js';

export const WHATSAPP_TEMPLATES = {
  enquiry: {
    recipient: 'Customer & Owner',
    template: 'Hi {name}, your order #{id} for {qty} {product} is confirmed. Estimated Delivery: {date}. Track it anytime: {link}',
  },
  spec_sheet: {
    recipient: 'Customer (Approval link)',
    template: 'Your spec sheet and design for order #{id} are ready. Please review and approve: {link}',
  },
  design_sample: {
    recipient: 'Customer (Preview & approve)',
    template: 'Design uploaded & physical sample #{sampleId} for order #{id} created. Preview & approve here: {link}',
  },
  approved: {
    recipient: 'Owner & Production Head',
    template: 'Order #{id} approved by {name}. Advance ₹{advance} noted. Factory floor scheduling initiated.',
  },
  production: {
    recipient: 'Customer',
    template: 'Good news! Order #{id} is now in production. Expected ready date: {date}.',
  },
  qc_passed: {
    recipient: 'Owner & Customer (Photos)',
    template: 'Order #{id} passed quality check with 100% score! Verified QC photos: {link}',
  },
  qc_failed: {
    recipient: 'Owner & Production Head',
    template: '⚠️ Quality Alert: Order #{id} failed QC check on: {failReason}. Order routed back to Production for correction.',
  },
  dispatch_delivery: {
    recipient: 'Customer',
    template: 'Order #{id} is packed and ready for dispatch via {vehicle}. Tracking / Invoice: {link}',
  },
  dispatch_pickup: {
    recipient: 'Customer',
    template: 'Order #{id} is ready for pickup at Box Shop (Mancheswar IE, Plot 42-B). Please show order ID #{id} at the counter.',
  },
  delivered: {
    recipient: 'Customer',
    template: 'Order #{id} delivered. Thank you for choosing Box Shop! Tell us how we did: {reviewLink}',
  },
  delayed: {
    recipient: 'Customer & Owner',
    template: 'Order #{id} is running late. New expected ready date: {date}. Reason: {delayReason}. Sorry for the inconvenience.',
  },
};

/**
 * Triggers and records a WhatsApp notification for an order
 */
export async function sendWhatsAppNotification(orderId, templateKey, params = {}) {
  try {
    const templateConfig = WHATSAPP_TEMPLATES[templateKey];
    if (!templateConfig) {
      console.warn(`Template key "${templateKey}" not found.`);
      return null;
    }

    const domain = 'http://localhost:5173';
    const trackingLink = `${domain}/track/${orderId}`;
    const reviewLink = `${domain}/review/${orderId}`;

    const replacements = {
      '{name}': params.customerName || 'Valued Customer',
      '{id}': orderId,
      '{qty}': params.quantity ? Number(params.quantity).toLocaleString() : '1,000',
      '{product}': params.productName || params.boxType || 'Packaging Boxes',
      '{date}': params.date || 'TBD',
      '{link}': trackingLink,
      '{sampleId}': params.sampleId || `SMP-${orderId}`,
      '{advance}': params.advanceAmount ? Number(params.advanceAmount).toLocaleString() : '50%',
      '{vehicle}': params.vehicle || 'Tata Ace (OD-02-X-4912)',
      '{failReason}': params.failReason || 'Quality variance detected',
      '{delayReason}': params.delayReason || 'Floor operational delay',
      '{reviewLink}': reviewLink,
    };

    let messageText = templateConfig.template;
    for (const [token, val] of Object.entries(replacements)) {
      messageText = messageText.replaceAll(token, val);
    }

    const cleanPhone = (params.customerPhone || '9861012345').replace(/\D/g, '');
    const recipientPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // Save to database whatsapp_logs
    await pool.query(
      `INSERT INTO whatsapp_logs (order_id, template_key, recipient_name, recipient_phone, message, status)
       VALUES (?, ?, ?, ?, ?, 'delivered')`,
      [
        orderId,
        templateKey,
        `${params.customerName || 'Customer'} (${templateConfig.recipient})`,
        recipientPhone,
        messageText,
      ]
    );

    const waUrl = `https://wa.me/${recipientPhone}?text=${encodeURIComponent(messageText)}`;

    console.log(`\n💬 [WhatsApp Auto-Trigger] Stage: ${templateKey.toUpperCase()}`);
    console.log(`   To: ${recipientPhone} (${templateConfig.recipient})`);
    console.log(`   Message: "${messageText}"\n`);

    return {
      success: true,
      recipient: templateConfig.recipient,
      message: messageText,
      waUrl,
    };
  } catch (error) {
    console.error('Failed to trigger WhatsApp notification:', error);
    return null;
  }
}
