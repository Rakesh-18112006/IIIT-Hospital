/**
 * Email Template Generator for Hospital Appointment System
 * Creates professional HTML email templates for:
 * - Appointment confirmations
 * - Prescription receipts
 * - Medical documents
 */

export const generateAppointmentConfirmationEmail = (appointmentData) => {
  const {
    patientName,
    patientEmail,
    doctorName,
    doctorDepartment,
    appointmentDate,
    appointmentTime,
    symptoms,
    hospitalName = 'IIIT Hospital',
    hospitalAddress = 'RGUKT Campus, Andhra Pradesh',
    hospitalPhone = '+91-XXXXXXXXXX',
    appointmentId,
  } = appointmentData;

  const formattedDate = new Date(appointmentDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px 20px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .greeting strong {
            color: #1e40af;
        }
        .appointment-details {
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #ddd;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #1e40af;
            min-width: 140px;
        }
        .detail-value {
            text-align: right;
            color: #333;
        }
        .symptoms {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
        }
        .symptoms h3 {
            margin: 0 0 10px 0;
            color: #92400e;
            font-size: 14px;
        }
        .symptoms-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .symptoms-list li {
            padding: 5px 0;
            color: #78350f;
            font-size: 14px;
        }
        .symptoms-list li:before {
            content: "✓ ";
            color: #d97706;
            font-weight: bold;
        }
        .instructions {
            background-color: #ecfdf5;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
        }
        .instructions h3 {
            margin: 0 0 10px 0;
            color: #065f46;
            font-size: 14px;
        }
        .instructions ul {
            margin: 0;
            padding-left: 20px;
            color: #047857;
            font-size: 14px;
        }
        .instructions li {
            margin: 5px 0;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            font-size: 14px;
        }
        .button:hover {
            opacity: 0.9;
        }
        .footer {
            background-color: #f3f4f6;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #666;
        }
        .footer-info {
            margin: 10px 0;
        }
        .footer-info strong {
            color: #1e40af;
        }
        .appointment-id {
            background-color: #f3f4f6;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            color: #666;
            margin: 15px 0;
            text-align: center;
        }
        .important-note {
            background-color: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            font-size: 13px;
            color: #7f1d1d;
        }
        .important-note strong {
            color: #b91c1c;
        }
    </style>
</head>
<body>
    <div class="container">
        {/* Header */}
        <div class="header">
            <h1>${hospitalName}</h1>
            <p>Medical Services Department</p>
        </div>

        {/* Main Content */}
        <div class="content">
            <div class="greeting">
                Dear <strong>${patientName}</strong>,
            </div>

            <p>Your appointment with our medical team has been confirmed. Please find the details below:</p>

            {/* Appointment Details */}
            <div class="appointment-details">
                <div class="detail-row">
                    <span class="detail-label">Doctor Name:</span>
                    <span class="detail-value"><strong>${doctorName}</strong></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Department:</span>
                    <span class="detail-value">${doctorDepartment}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value"><strong>${formattedDate}</strong></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value"><strong>${appointmentTime}</strong></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Appointment ID:</span>
                    <span class="detail-value">${appointmentId}</span>
                </div>
            </div>

            ${symptoms && symptoms.length > 0 ? `
            {/* Symptoms */}
            <div class="symptoms">
                <h3>Chief Complaints/Symptoms</h3>
                <ul class="symptoms-list">
                    ${symptoms.map(symptom => `<li>${symptom}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            {/* Instructions */}
            <div class="instructions">
                <h3>Please Remember</h3>
                <ul>
                    <li>Arrive <strong>10 minutes early</strong> to the appointment</li>
                    <li>Bring your <strong>student ID</strong> and any relevant medical documents</li>
                    <li>Maintain a list of <strong>current medications</strong> if any</li>
                    <li>If you need to reschedule, inform at least <strong>24 hours</strong> in advance</li>
                    <li>Contact the hospital if you experience any <strong>emergency symptoms</strong></li>
                </ul>
            </div>

            {/* Important Note */}
            <div class="important-note">
                <strong>⚠️ Important:</strong> If you need to cancel or reschedule this appointment, please contact us as soon as possible. In case of medical emergency, please call the emergency department immediately.
            </div>

            {/* CTA Button */}
            <div class="button-container">
                <a href="#" class="button">View Appointment Details</a>
            </div>

            <p style="font-size: 14px; color: #666;">
                If you have any questions about your appointment, please don't hesitate to contact us.
            </p>
        </div>

        {/* Footer */}
        <div class="footer">
            <div class="footer-info">
                <strong>${hospitalName}</strong>
            </div>
            <div class="footer-info">
                📍 ${hospitalAddress}
            </div>
            <div class="footer-info">
                📞 ${hospitalPhone}
            </div>
            <div class="footer-info">
                📧 ${patientEmail}
            </div>
            <p style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 15px;">
                This is an automated email from the hospital management system. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
};

export const generatePrescriptionReceiptEmail = (prescriptionData) => {
  const {
    patientName,
    patientEmail,
    patientId,
    doctorName,
    doctorDepartment,
    medicines,
    diagnosis,
    advice,
    prescriptionDate,
    hospitalName = 'IIIT Hospital',
    hospitalAddress = 'RGUKT Campus, Telangana',
    hospitalPhone = '+91-XXXXXXXXXX',
  } = prescriptionData;

  const formattedDate = new Date(prescriptionDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const medicinesHTML = medicines
    .map(
      (med, idx) => `
    <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px; text-align: left;">${idx + 1}</td>
        <td style="padding: 10px; text-align: left;"><strong>${med.name}</strong></td>
        <td style="padding: 10px; text-align: center;">${med.dosage}</td>
        <td style="padding: 10px; text-align: center;">${med.frequency}</td>
        <td style="padding: 10px; text-align: center;">${med.duration}</td>
        <td style="padding: 10px; text-align: left;">${med.instructions || '-'}</td>
    </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 700px;
            margin: 20px auto;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 25px 20px;
            text-align: center;
            border-bottom: 3px solid #1e3a8a;
        }
        .header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 600;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 13px;
            opacity: 0.9;
        }
        .receipt-header {
            background-color: #f0f9ff;
            border-bottom: 2px solid #3b82f6;
            padding: 15px 20px;
            text-align: center;
        }
        .receipt-header h2 {
            margin: 0;
            color: #1e40af;
            font-size: 16px;
        }
        .content {
            padding: 25px 20px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
            font-size: 13px;
        }
        .info-block {
            background-color: #f9fafb;
            padding: 12px;
            border-radius: 4px;
            border-left: 3px solid #3b82f6;
        }
        .info-label {
            color: #1e40af;
            font-weight: 600;
            font-size: 12px;
        }
        .info-value {
            color: #333;
            margin-top: 5px;
            font-weight: 500;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            background-color: #1e40af;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .diagnosis-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 15px;
        }
        .diagnosis-label {
            font-weight: 600;
            color: #92400e;
            font-size: 12px;
        }
        .diagnosis-text {
            color: #78350f;
            margin-top: 5px;
            font-size: 14px;
        }
        .medicines-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 15px;
        }
        .medicines-table th {
            background-color: #e0f2fe;
            color: #1e40af;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #3b82f6;
        }
        .medicines-table td {
            padding: 10px;
        }
        .medicines-table tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .advice-box {
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 12px;
            border-radius: 4px;
        }
        .advice-label {
            font-weight: 600;
            color: #065f46;
            font-size: 12px;
        }
        .advice-text {
            color: #047857;
            margin-top: 8px;
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
        }
        .footer {
            background-color: #f3f4f6;
            padding: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #666;
        }
        .footer-text {
            margin: 8px 0;
        }
        .warning-box {
            background-color: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 13px;
            color: #7f1d1d;
        }
    </style>
</head>
<body>
    <div class="container">
        {/* Header */}
        <div class="header">
            <h1>💊 MEDICAL PRESCRIPTION RECEIPT</h1>
            <p>${hospitalName}</p>
        </div>

        <div class="receipt-header">
            <h2>Prescription Issued: ${formattedDate}</h2>
        </div>

        {/* Main Content */}
        <div class="content">
            {/* Patient & Doctor Info */}
            <div class="info-grid">
                <div class="info-block">
                    <div class="info-label">Patient Name</div>
                    <div class="info-value">${patientName}</div>
                </div>
                <div class="info-block">
                    <div class="info-label">Student ID</div>
                    <div class="info-value">${patientId}</div>
                </div>
                <div class="info-block">
                    <div class="info-label">Doctor</div>
                    <div class="info-value">${doctorName}</div>
                </div>
                <div class="info-block">
                    <div class="info-label">Department</div>
                    <div class="info-value">${doctorDepartment}</div>
                </div>
            </div>

            {/* Diagnosis */}
            ${diagnosis ? `
            <div class="diagnosis-box">
                <div class="diagnosis-label">DIAGNOSIS</div>
                <div class="diagnosis-text">${diagnosis}</div>
            </div>
            ` : ''}

            {/* Medicines */}
            <div class="section">
                <div class="section-title">📋 PRESCRIBED MEDICINES</div>
                <table class="medicines-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Medicine Name</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                            <th>Instructions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${medicinesHTML}
                    </tbody>
                </table>
            </div>

            {/* Important Warning */}
            <div class="warning-box">
                <strong>⚠️ Important:</strong> Please follow the prescription exactly as prescribed. Do not skip doses or self-adjust medication. If you experience any side effects, contact your doctor immediately.
            </div>

            {/* Advice */}
            ${advice ? `
            <div class="section">
                <div class="advice-box">
                    <div class="advice-label">👨‍⚕️ DOCTOR'S ADVICE</div>
                    <div class="advice-text">${advice}</div>
                </div>
            </div>
            ` : ''}

            {/* Follow-up */}
            <div class="section">
                <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; border-radius: 4px;">
                    <strong style="color: #065f46;">Follow-up Instructions:</strong>
                    <ul style="color: #047857; font-size: 13px; margin: 8px 0 0 20px;">
                        <li>Take medicines as per the prescribed timings</li>
                        <li>Complete the full course even if symptoms disappear</li>
                        <li>Follow the dietary and lifestyle recommendations</li>
                        <li>Schedule a follow-up appointment as advised</li>
                        <li>Keep this prescription safe for future reference</li>
                    </ul>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div class="footer">
            <div class="footer-text"><strong>${hospitalName}</strong></div>
            <div class="footer-text">📍 ${hospitalAddress}</div>
            <div class="footer-text">📞 ${hospitalPhone}</div>
            <div class="footer-text" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
                This is an automated email from the hospital management system. For medical emergencies, call the emergency department immediately.
            </div>
        </div>
    </div>
</body>
</html>
  `.trim();
};

export const generateMedicalReceiptPDF = (prescriptionData) => {
  // For PDF generation, you would typically use a library like jsPDF or html2pdf
  // This is a placeholder for the structure
  return {
    title: `Medical Receipt - ${prescriptionData.patientName}`,
    content: prescriptionData,
    timestamp: new Date().toISOString(),
  };
};

export default {
  generateAppointmentConfirmationEmail,
  generatePrescriptionReceiptEmail,
  generateMedicalReceiptPDF,
};
