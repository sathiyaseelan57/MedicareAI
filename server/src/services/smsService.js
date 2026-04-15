import twilio from 'twilio';

const accountSid = process.env.TWILIo_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN; 
const twilioNumber = process.env.TWILIO_PHONE_NUMBER; 

const client = twilio(accountSid, authToken);

/**
 * Formats a 10-digit number to E.164 (+91...) or validates existing format
 */
const formatPhoneNumber = (number) => {
  // Remove all non-numeric characters
  const cleaned = ('' + number).replace(/\D/g, '');

  // If it's a 10-digit number, add +91 (India)
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it already has a plus and correct length, return as is
  if (number.startsWith('+') && (cleaned.length >= 11 && cleaned.length <= 15)) {
    return number;
  }

  // Otherwise, it's invalid
  return null;
};

export const sendReminderSMS = async (phoneNumber, patientName, time) => {
  const formattedNumber = formatPhoneNumber(phoneNumber);

  // Skip if the number is invalid
  if (!formattedNumber) {
    console.warn(`⚠️ Skipping: ${patientName} has an invalid phone number (${phoneNumber})`);
    return { success: false, error: "Invalid phone number format" };
  }

  try {
    // Friendly and Caring Bilingual Message
    const messageBody = `Hi ${patientName}, you have an appointment tomorrow at ${time}. We look forward to seeing you! - Medicare AI`;
    console.log(phoneNumber);
    const response = await client.messages.create({
      body: messageBody,
      from: twilioNumber,
      to: formattedNumber
    });

    console.log(`SMS Sent to ${patientName} (${formattedNumber})!`);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error(`❌ Twilio Error for ${patientName}:`, error.message);
    return { success: false, error: error.message };
  }
};