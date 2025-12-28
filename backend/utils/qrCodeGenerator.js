import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique QR code for a student
 * QR code contains student ID and a unique token
 */
export const generateQRCode = async (userId, studentId) => {
  try {
    // Create unique QR data combining userId and a UUID token
    const qrData = JSON.stringify({
      userId: userId.toString(),
      studentId: studentId,
      token: uuidv4(),
      generatedAt: new Date().toISOString(),
    });

    // Generate QR code as data URL (base64 image)
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
    });

    return {
      qrData: qrData,
      qrCodeImage: qrCodeDataURL,
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Parse QR code data
 * Handles both string and object inputs
 * Supports both full QR format (with studentId and token) and simplified format (userId only) for doctor access
 */
export const parseQRCode = (qrData, allowSimplifiedFormat = false) => {
  try {
    console.log('📱 [Parse] Input type:', typeof qrData);
    console.log('📱 [Parse] Allow simplified format:', allowSimplifiedFormat);
    
    // If already an object, return as is
    if (typeof qrData === 'object' && qrData !== null) {
      console.log('✅ [Parse] Data is already an object');
      // Validate the object
      if (!qrData.userId) {
        throw new Error('Missing required field: userId');
      }
      // If simplified format is allowed, only userId is required
      if (!allowSimplifiedFormat && (!qrData.studentId || !qrData.token)) {
        console.log('❌ [Parse] Missing fields - userId:', !!qrData.userId, 'studentId:', !!qrData.studentId, 'token:', !!qrData.token);
        throw new Error('Missing required QR code fields: userId, studentId, and token are required');
      }
      return qrData;
    }

    // If it's a string, trim whitespace and parse
    if (typeof qrData === 'string') {
      const trimmedData = qrData.trim();
      console.log('📱 [Parse] String length before trim:', qrData.length);
      console.log('📱 [Parse] String length after trim:', trimmedData.length);
      console.log('📱 [Parse] First 100 chars:', trimmedData.substring(0, 100));
      
      const parsed = JSON.parse(trimmedData);
      console.log('✅ [Parse] Successfully parsed JSON');
      
      // Validate userId is always required
      if (!parsed.userId) {
        console.log('❌ [Parse] Missing userId field');
        throw new Error('Missing required field: userId');
      }
      
      // If simplified format is allowed, only userId is required
      if (allowSimplifiedFormat) {
        console.log('✅ [Parse] Simplified format accepted (userId only)');
        return parsed;
      }
      
      // Otherwise, validate all required fields for full QR format
      if (!parsed.studentId || !parsed.token) {
        console.log('❌ [Parse] Missing fields - userId:', !!parsed.userId, 'studentId:', !!parsed.studentId, 'token:', !!parsed.token);
        throw new Error('Missing required QR code fields: userId, studentId, and token are required');
      }
      
      console.log('✅ [Parse] All required fields present');
      return parsed;
    }

    console.log('❌ [Parse] Data is not string or object');
    throw new Error('QR code data must be a string or object');
  } catch (error) {
    console.error('❌ [Parse] Error:', error.message);
    console.error('❌ [Parse] Input:', qrData);
    throw new Error('Invalid QR code data: ' + error.message);
  }
};

/**
 * Generate QR code as image file (for downloading)
 */
export const generateQRCodeImage = async (qrData) => {
  try {
    const buffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
    });
    return buffer;
  } catch (error) {
    console.error('Error generating QR code image:', error);
    throw new Error('Failed to generate QR code image');
  }
};
