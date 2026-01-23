/**
 * Generate WhatsApp reminder link for rent payment
 */
export function generateWhatsAppReminderLink(tenantPhone, tenantName, houseNumber, dueDate, dueAmount, pendingAmount) {
  // Clean phone number (remove spaces, dashes, etc.)
  let cleanPhone = tenantPhone.replace(/[\s\-\(\)]/g, '');

  // Add country code if not present (India = 91)
  if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('91')) {
    cleanPhone = '91' + cleanPhone;
  } else if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1);
  }

  // Format amounts with Indian Rupee
  const formatAmount = (amount) => `₹${amount.toLocaleString('en-IN')}`;

  // Create message
  const message = `Dear ${tenantName},

This is a reminder that your rent of ${formatAmount(dueAmount)} for house ${houseNumber} was due on ${formatDate(dueDate)}.

Pending amount: ${formatAmount(pendingAmount)}

Please pay at the earliest.

Thank you.`;

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Generate WhatsApp link for custom message
 */
export function generateWhatsAppLink(phone, message) {
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('91')) {
    cleanPhone = '91' + cleanPhone;
  } else if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1);
  }

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Generate payment confirmation message
 */
export function generatePaymentConfirmationLink(tenantPhone, tenantName, houseNumber, amount, paymentDate) {
  let cleanPhone = tenantPhone.replace(/[\s\-\(\)]/g, '');

  if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('91')) {
    cleanPhone = '91' + cleanPhone;
  } else if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1);
  }

  const formatAmount = (amt) => `₹${amt.toLocaleString('en-IN')}`;

  const message = `Dear ${tenantName},

Thank you for your rent payment of ${formatAmount(amount)} for house ${houseNumber} received on ${formatDate(paymentDate)}.

Your payment has been recorded.

Thank you.`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Format date to readable format
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('en-IN', options);
}

export default {
  generateWhatsAppReminderLink,
  generateWhatsAppLink,
  generatePaymentConfirmationLink
};
