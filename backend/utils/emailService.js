import nodemailer from "nodemailer";

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "iiithospital@gmail.com",
    pass: "oyog nlxd uguh qjyw",
  },
});

/**
 * Send appointment reschedule notification email
 * @param {string} studentEmail - Student's email address
 * @param {string} studentName - Student's name
 * @param {string} doctorName - Doctor's name
 * @param {string} oldSlotTime - Previous appointment time (HH:MM)
 * @param {string} newSlotTime - New appointment time (HH:MM)
 * @param {string} newSlotEndTime - New appointment end time (HH:MM)
 * @param {string} slotDate - Appointment date (formatted)
 * @param {string} reason - Reason for reschedule
 * @returns {Promise<void>}
 */
export const sendRescheduleEmail = async (
  studentEmail,
  studentName,
  doctorName,
  oldSlotTime,
  newSlotTime,
  newSlotEndTime,
  slotDate,
  reason
) => {
  try {
    const dateObj = new Date(slotDate);
    const formattedDate = dateObj.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const mailOptions = {
      from: "iiithospital@gmail.com",
      to: studentEmail,
      subject: "Appointment Rescheduled - IIIT Hospital",
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
              .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { padding: 20px; }
              .detail-box { background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #3498db; border-radius: 3px; }
              .detail-label { font-weight: bold; color: #2c3e50; }
              .detail-value { color: #555; margin-top: 5px; }
              .timestamp { color: #7f8c8d; font-size: 12px; margin-top: 15px; }
              .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
              .highlight { color: #e74c3c; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Appointment Rescheduled</h1>
              </div>
              <div class="content">
                <p>Dear <strong>${studentName}</strong>,</p>
                <p>Your appointment has been rescheduled by your doctor. Please find the updated details below:</p>
                
                <div class="detail-box">
                  <div class="detail-label">Doctor</div>
                  <div class="detail-value">Dr. ${doctorName}</div>
                </div>
                
                <div class="detail-box">
                  <div class="detail-label">Previous Appointment Time</div>
                  <div class="detail-value"><span class="highlight">${oldSlotTime}</span> on ${formattedDate}</div>
                </div>
                
                <div class="detail-box">
                  <div class="detail-label">New Appointment Time</div>
                  <div class="detail-value"><span class="highlight">${newSlotTime} - ${newSlotEndTime}</span> on ${formattedDate}</div>
                </div>
                
                <div class="detail-box">
                  <div class="detail-label">Reason for Reschedule</div>
                  <div class="detail-value">${reason || "Schedule adjustment"}</div>
                </div>
                
                <p style="margin-top: 20px;">If you have any questions or concerns regarding the rescheduled appointment, please contact the hospital reception or reply to this email.</p>
                
                <p style="margin-top: 20px;">Best regards,<br><strong>IIIT Hospital Management</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply directly to this message.</p>
                <p class="timestamp">Email sent on ${new Date().toLocaleString("en-IN")}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Dear ${studentName},

Your appointment has been rescheduled by Dr. ${doctorName}.

Previous Appointment Time: ${oldSlotTime} on ${formattedDate}
New Appointment Time: ${newSlotTime} - ${newSlotEndTime} on ${formattedDate}
Reason: ${reason || "Schedule adjustment"}

If you have any questions, please contact the hospital reception.

Best regards,
IIIT Hospital Management
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reschedule notification email sent to ${studentEmail}`);
  } catch (error) {
    console.error("Error sending reschedule email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Verify email service configuration
 * @returns {Promise<boolean>}
 */
export const verifyEmailService = async () => {
  try {
    await transporter.verify();
    console.log("Email service verified successfully");
    return true;
  } catch (error) {
    console.error("Email service verification failed:", error);
    return false;
  }
};

/**
 * Send prescription email to student with consultation details
 * @param {string} studentEmail - Student's email address
 * @param {string} studentName - Student's name
 * @param {string} doctorName - Doctor's name
 * @param {string} slotTime - Appointment slot time (HH:MM)
 * @param {string} slotEndTime - Appointment end time (HH:MM)
 * @param {string} slotDate - Appointment date (formatted)
 * @param {string} prescription - Prescription details
 * @param {string} advice - Additional advice for patient
 * @returns {Promise<void>}
 */
export const sendPrescriptionEmail = async (
  studentEmail,
  studentName,
  doctorName,
  slotTime,
  slotEndTime,
  slotDate,
  prescription,
  advice
) => {
  try {
    // Format prescription text for email display
    const prescriptionLines = prescription
      .split("\n")
      .map((line) => `<p>${line}</p>`)
      .join("");

    const adviceLines =
      advice && advice.trim()
        ? advice
            .split("\n")
            .map((line) => `<p>${line}</p>`)
            .join("")
        : "";

    const mailOptions = {
      from: "iiithospital@gmail.com",
      to: studentEmail,
      subject: `Your Prescription from Dr. ${doctorName} - IIIT Hospital`,
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
              .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { padding: 20px; }
              .detail-box { background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #3498db; border-radius: 3px; }
              .detail-label { font-weight: bold; color: #2c3e50; font-size: 14px; }
              .detail-value { color: #555; margin-top: 5px; }
              .prescription-box { background-color: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; border-radius: 3px; }
              .prescription-label { font-weight: bold; color: #856404; font-size: 14px; }
              .advice-box { background-color: #d1ecf1; padding: 15px; margin: 15px 0; border-left: 4px solid #17a2b8; border-radius: 3px; }
              .advice-label { font-weight: bold; color: #0c5460; font-size: 14px; }
              .timestamp { color: #7f8c8d; font-size: 12px; margin-top: 15px; }
              .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
              .highlight { color: #e74c3c; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Your Consultation Prescription</h1>
              </div>
              <div class="content">
                <p>Dear <strong>${studentName}</strong>,</p>
                <p>Thank you for visiting IIIT Hospital. Below is your prescription from your recent consultation with Dr. ${doctorName}.</p>
                
                <div class="detail-box">
                  <div class="detail-label">Consultation Details</div>
                  <div class="detail-value">
                    <strong>Doctor:</strong> Dr. ${doctorName}<br>
                    <strong>Appointment Date:</strong> ${slotDate}<br>
                    <strong>Consultation Time:</strong> ${slotTime} - ${slotEndTime}
                  </div>
                </div>
                
                <div class="prescription-box">
                  <div class="prescription-label">💊 PRESCRIPTION</div>
                  <div class="detail-value">
                    ${prescriptionLines}
                  </div>
                </div>
                
                ${
                  adviceLines
                    ? `
                <div class="advice-box">
                  <div class="advice-label">📝 Additional Advice</div>
                  <div class="detail-value">
                    ${adviceLines}
                  </div>
                </div>
                `
                    : ""
                }
                
                <div style="margin-top: 20px; padding: 15px; background-color: #f0f0f0; border-radius: 3px;">
                  <p style="margin: 5px 0; font-size: 13px;">
                    <strong>Important:</strong> Please follow the prescription as directed by Dr. ${doctorName}. If you have any allergies or reactions, contact the hospital immediately.
                  </p>
                  <p style="margin: 5px 0; font-size: 13px;">
                    Keep this prescription for your records and show it to any other healthcare provider you consult.
                  </p>
                </div>
                
                <p style="margin-top: 20px;">Best regards,<br><strong>IIIT Hospital Management</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply directly to this message.</p>
                <p class="timestamp">Email sent on ${new Date().toLocaleString("en-IN")}</p>
                <p style="font-size: 11px; margin-top: 10px;">This prescription is confidential and intended for the recipient only.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Dear ${studentName},

Your Prescription from Dr. ${doctorName}

Consultation Details:
Doctor: Dr. ${doctorName}
Appointment Date: ${slotDate}
Consultation Time: ${slotTime} - ${slotEndTime}

PRESCRIPTION:
${prescription}

${adviceLines ? `ADDITIONAL ADVICE:\n${advice}\n` : ""}

IMPORTANT: Please follow the prescription as directed by Dr. ${doctorName}. If you have any allergies or reactions, contact the hospital immediately.

Keep this prescription for your records and show it to any other healthcare provider you consult.

Best regards,
IIIT Hospital Management
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Prescription email sent to ${studentEmail}`);
  } catch (error) {
    console.error("Error sending prescription email:", error);
    throw new Error(`Failed to send prescription email: ${error.message}`);
  }
};
