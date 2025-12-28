/**
 * Email Templates for Hospital System
 * Generates professional HTML email templates for appointments and prescriptions
 */

/**
 * Generate appointment confirmation email HTML
 * @param {Object} data - Appointment details
 * @returns {string} HTML email template
 */
export const generateAppointmentConfirmationEmail = (data) => {
  const {
    patientName = "Patient",
    doctorName = "Doctor",
    doctorDepartment = "Department",
    appointmentDate = new Date().toLocaleDateString(),
    appointmentTime = "10:00 AM",
    symptoms = "General Checkup",
    hospitalName = "IIIT Hospital",
    hospitalAddress = "RGUKT Campus, Telangana",
    hospitalPhone = "+91-XXXX-XXXX-XX",
  } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Confirmation</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; padding: 20px; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 5px; }
        .header p { font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .greeting { font-size: 16px; margin-bottom: 20px; color: #333; }
        .info-section { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3498db; }
        .info-row { display: flex; justify-content: space-between; margin: 12px 0; font-size: 14px; }
        .info-label { font-weight: 600; color: #2c3e50; min-width: 150px; }
        .info-value { color: #555; }
        .important { background-color: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .important p { margin: 0; font-size: 14px; color: #856404; }
        .instructions { margin: 20px 0; }
        .instructions ol { margin-left: 20px; }
        .instructions li { margin: 8px 0; font-size: 14px; color: #555; }
        .footer { background-color: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 12px; }
        .footer p { margin: 5px 0; }
        .button { display: inline-block; padding: 12px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: 600; }
        .divider { border-top: 1px solid #ddd; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>✓ Appointment Confirmed</h1>
          <p>${hospitalName}</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            <p>Dear <strong>${patientName}</strong>,</p>
            <p style="margin-top: 10px; font-size: 14px; color: #666;">Your appointment has been successfully confirmed. Please find the details below:</p>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Doctor</span>
              <span class="info-value"><strong>Dr. ${doctorName}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Department</span>
              <span class="info-value">${doctorDepartment}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date</span>
              <span class="info-value">${appointmentDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time</span>
              <span class="info-value"><strong style="color: #e74c3c;">${appointmentTime}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Reason for Visit</span>
              <span class="info-value">${symptoms}</span>
            </div>
          </div>
          
          <div class="important">
            <p><strong>⏰ Important:</strong> Please arrive 10 minutes before your scheduled appointment time.</p>
          </div>
          
          <div class="instructions">
            <h3 style="font-size: 16px; color: #2c3e50; margin-bottom: 10px;">What to Bring:</h3>
            <ol>
              <li>Valid ID / Student ID</li>
              <li>Health Insurance Card (if available)</li>
              <li>Previous Medical Records (if any)</li>
              <li>List of current medications</li>
            </ol>
          </div>
          
          <div class="divider"></div>
          
          <div style="text-align: center;">
            <p style="font-size: 14px; color: #666;">If you need to reschedule or cancel your appointment,</p>
            <p style="font-size: 14px; color: #666; margin-bottom: 15px;">please contact us at least 24 hours in advance.</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; font-size: 13px;">
            <p style="margin: 5px 0;"><strong>Hospital Contact:</strong></p>
            <p style="margin: 5px 0;">📍 ${hospitalAddress}</p>
            <p style="margin: 5px 0;">📞 ${hospitalPhone}</p>
            <p style="margin: 5px 0;">🕐 Opening Hours: 8:00 AM - 6:00 PM</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply directly to this message.</p>
          <p>© ${new Date().getFullYear()} ${hospitalName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate prescription receipt email HTML
 * @param {Object} data - Prescription details
 * @returns {string} HTML email template
 */
export const generatePrescriptionReceiptEmail = (data) => {
  const {
    patientName = "Patient",
    patientId = "XXXXX",
    doctorName = "Doctor",
    doctorDepartment = "Department",
    diagnosis = "N/A",
    medicines = [],
    notes = "",
    advice = "Follow doctor's instructions",
    prescriptionDate = new Date().toLocaleDateString(),
    hospitalName = "IIIT Hospital",
    hospitalAddress = "RGUKT Campus, Telangana",
    hospitalPhone = "+91-XXXX-XXXX-XX",
  } = data;

  const medicineRows = medicines
    .map(
      (med, idx) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${idx + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${med.name || "N/A"}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${med.dosage || "N/A"}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${med.frequency || "N/A"}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${med.duration || "N/A"}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 13px;">${med.instructions || "As directed"}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 12px;">
          ${med.timings ? med.timings.join(", ") : "As directed"}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Medical Prescription</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; padding: 20px; }
        .email-container { max-width: 800px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { font-size: 12px; opacity: 0.9; }
        .prescription-header { padding: 20px 30px; border-bottom: 2px solid #e0e0e0; }
        .hospital-info { margin-bottom: 20px; }
        .hospital-info h2 { font-size: 16px; color: #2c3e50; margin-bottom: 5px; }
        .hospital-info p { font-size: 12px; color: #666; margin: 2px 0; }
        .patient-doctor-info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 20px 0; }
        .info-block { }
        .info-block p { font-size: 13px; margin: 5px 0; }
        .info-block .label { font-weight: 600; color: #2c3e50; }
        .info-block .value { color: #555; }
        .content { padding: 30px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 14px; font-weight: 700; color: #2c3e50; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #3498db; }
        .diagnosis-box { background-color: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107; margin: 10px 0; }
        .diagnosis-box p { font-size: 13px; color: #856404; margin: 0; }
        .medicine-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .medicine-table th { background-color: #3498db; color: white; padding: 12px; text-align: left; font-size: 12px; font-weight: 600; }
        .medicine-table th:nth-child(1) { width: 5%; }
        .medicine-table th:nth-child(2) { width: 20%; }
        .medicine-table th:nth-child(3) { width: 12%; }
        .medicine-table th:nth-child(4) { width: 12%; }
        .medicine-table th:nth-child(5) { width: 10%; }
        .medicine-table th:nth-child(6) { width: 25%; }
        .medicine-table th:nth-child(7) { width: 16%; }
        .medicine-table td { padding: 12px; font-size: 12px; }
        .advice-box { background-color: #d4edda; padding: 15px; border-radius: 4px; border-left: 4px solid #28a745; margin: 10px 0; }
        .advice-box p { font-size: 13px; color: #155724; margin: 0; }
        .notes-box { background-color: #d1ecf1; padding: 15px; border-radius: 4px; border-left: 4px solid #17a2b8; margin: 10px 0; }
        .notes-box p { font-size: 13px; color: #0c5460; margin: 0; }
        .signature-section { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        .signature-line { margin: 30px 0 0 0; }
        .signature-line p { font-size: 12px; margin: 5px 0; }
        .doctor-name { font-weight: 600; color: #2c3e50; }
        .footer { background-color: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 11px; }
        .footer p { margin: 5px 0; }
        .divider { border-top: 1px solid #ddd; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>📋 Medical Prescription</h1>
          <p>${hospitalName}</p>
        </div>
        
        <div class="prescription-header">
          <div class="hospital-info">
            <h2>${hospitalName}</h2>
            <p>📍 ${hospitalAddress}</p>
            <p>📞 ${hospitalPhone}</p>
            <p>Prescription Date: ${prescriptionDate}</p>
          </div>
          
          <div class="patient-doctor-info">
            <div class="info-block">
              <p><span class="label">Patient Name:</span> <span class="value">${patientName}</span></p>
              <p><span class="label">Patient ID:</span> <span class="value">${patientId}</span></p>
            </div>
            <div class="info-block">
              <p><span class="label">Doctor:</span> <span class="value">Dr. ${doctorName}</span></p>
              <p><span class="label">Department:</span> <span class="value">${doctorDepartment}</span></p>
            </div>
          </div>
        </div>
        
        <div class="content">
          <!-- Diagnosis Section -->
          <div class="section">
            <div class="section-title">🏥 Diagnosis</div>
            <div class="diagnosis-box">
              <p><strong>Primary Diagnosis:</strong> ${diagnosis}</p>
            </div>
          </div>
          
          <!-- Medicines Section -->
          <div class="section">
            <div class="section-title">💊 Prescribed Medicines</div>
            <table class="medicine-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Medicine Name</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                  <th>Timings</th>
                </tr>
              </thead>
              <tbody>
                ${medicineRows}
              </tbody>
            </table>
          </div>
          
          <!-- Doctor's Advice Section -->
          ${advice ? `
            <div class="section">
              <div class="section-title">📝 Doctor's Advice</div>
              <div class="advice-box">
                <p>${advice}</p>
              </div>
            </div>
          ` : ""}
          
          <!-- Additional Notes -->
          ${notes ? `
            <div class="section">
              <div class="section-title">📌 Additional Notes</div>
              <div class="notes-box">
                <p>${notes}</p>
              </div>
            </div>
          ` : ""}
          
          <!-- Follow-up Instructions -->
          <div class="section">
            <div class="section-title">⏰ Follow-up Instructions</div>
            <ul style="margin-left: 20px; font-size: 13px; color: #555;">
              <li>Take medicines as prescribed without missing any doses</li>
              <li>Contact the hospital if you experience any side effects</li>
              <li>Follow doctor's dietary recommendations if any</li>
              <li>Schedule a follow-up appointment as advised</li>
            </ul>
          </div>
          
          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-line">
              <p class="doctor-name">Dr. ${doctorName}</p>
              <p style="font-size: 11px; color: #666;">Signature</p>
            </div>
            <div style="margin-top: 40px; font-size: 11px; color: #999;">
              <p>This is a digitally generated prescription. Please consult the original for authenticity.</p>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply directly to this message.</p>
          <p>© ${new Date().getFullYear()} ${hospitalName}. All rights reserved.</p>
          <p>For queries, contact the hospital reception or visit in person.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate medical receipt PDF (placeholder for actual PDF generation)
 * @param {Object} data - Prescription data
 * @returns {Object} PDF generation config
 */
export const generateMedicalReceiptPDF = (data) => {
  return {
    message: "PDF generation required - use pdfkit or html2pdf library",
    htmlContent: generatePrescriptionReceiptEmail(data),
    fileName: `prescription_${data.patientId || "unknown"}_${Date.now()}.pdf`,
  };
};

export default {
  generateAppointmentConfirmationEmail,
  generatePrescriptionReceiptEmail,
  generateMedicalReceiptPDF,
};
