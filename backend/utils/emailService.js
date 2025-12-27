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
