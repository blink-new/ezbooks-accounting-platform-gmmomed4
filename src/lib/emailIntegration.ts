import { blink } from '../blink/client';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailAttachment {
  url: string;
  filename: string;
  type?: string;
}

export class EmailIntegrationService {
  
  // Generate professional email templates for different document types
  static generateEstimateEmail(estimate: any, companyProfile: any): EmailTemplate {
    const subject = `Estimate #${estimate.estimateNumber} from ${companyProfile.companyName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${companyProfile.companyName}</h1>
          <p style="color: #E0E7FF; margin: 5px 0 0 0; font-size: 16px;">Professional Estimate</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #1F2937; margin: 0 0 20px 0;">Dear ${estimate.customerName},</h2>
          
          <p style="color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for your interest in our services. Please find attached your detailed estimate for the requested work.
          </p>
          
          <!-- Estimate Summary -->
          <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1F2937; margin: 0 0 15px 0; font-size: 18px;">Estimate Summary</h3>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6B7280;">Estimate Number:</span>
              <span style="color: #1F2937; font-weight: bold;">#${estimate.estimateNumber}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6B7280;">Issue Date:</span>
              <span style="color: #1F2937;">${new Date(estimate.issueDate).toLocaleDateString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6B7280;">Valid Until:</span>
              <span style="color: #1F2937;">${new Date(estimate.validUntil).toLocaleDateString()}</span>
            </div>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #1F2937; font-size: 18px; font-weight: bold;">Total Amount:</span>
              <span style="color: #059669; font-size: 20px; font-weight: bold;">$${estimate.total.toFixed(2)}</span>
            </div>
          </div>
          
          <p style="color: #4B5563; line-height: 1.6; margin: 20px 0;">
            This estimate is valid for 30 days from the issue date. If you have any questions or would like to proceed, 
            please don't hesitate to contact us.
          </p>
          
          <!-- Call to Action -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${companyProfile.email}?subject=Re: Estimate #${estimate.estimateNumber}" 
               style="background: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Accept This Estimate
            </a>
          </div>
          
          <!-- Contact Information -->
          <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #1F2937; margin: 0 0 10px 0;">Contact Information</h4>
            <p style="color: #6B7280; margin: 5px 0; line-height: 1.4;">
              📧 Email: ${companyProfile.email}<br>
              📞 Phone: ${companyProfile.phone}<br>
              🌐 Website: ${companyProfile.website}<br>
              📍 Address: ${companyProfile.address}
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; margin: 0; font-size: 14px;">
            Thank you for choosing ${companyProfile.companyName}. We look forward to working with you!
          </p>
        </div>
      </div>
    `;
    
    const text = `
Dear ${estimate.customerName},

Thank you for your interest in our services. Please find attached your detailed estimate for the requested work.

Estimate Summary:
- Estimate Number: #${estimate.estimateNumber}
- Issue Date: ${new Date(estimate.issueDate).toLocaleDateString()}
- Valid Until: ${new Date(estimate.validUntil).toLocaleDateString()}
- Total Amount: $${estimate.total.toFixed(2)}

This estimate is valid for 30 days from the issue date. If you have any questions or would like to proceed, please don't hesitate to contact us.

Contact Information:
Email: ${companyProfile.email}
Phone: ${companyProfile.phone}
Website: ${companyProfile.website}
Address: ${companyProfile.address}

Thank you for choosing ${companyProfile.companyName}. We look forward to working with you!

Best regards,
${companyProfile.companyName}
    `;
    
    return { subject, html, text };
  }

  static generateInvoiceEmail(invoice: any, companyProfile: any): EmailTemplate {
    const subject = `Invoice #${invoice.invoice_number} from ${companyProfile.companyName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${companyProfile.companyName}</h1>
          <p style="color: #A7F3D0; margin: 5px 0 0 0; font-size: 16px;">Invoice</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #1F2937; margin: 0 0 20px 0;">Dear ${invoice.customerName},</h2>
          
          <p style="color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for your business! Please find attached your invoice for the services provided.
          </p>
          
          <!-- Invoice Summary -->
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1F2937; margin: 0 0 15px 0; font-size: 18px;">Invoice Details</h3>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6B7280;">Invoice Number:</span>
              <span style="color: #1F2937; font-weight: bold;">#${invoice.invoice_number}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6B7280;">Issue Date:</span>
              <span style="color: #1F2937;">${new Date(invoice.issue_date).toLocaleDateString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6B7280;">Due Date:</span>
              <span style="color: #DC2626; font-weight: bold;">${new Date(invoice.due_date).toLocaleDateString()}</span>
            </div>
            <hr style="border: none; border-top: 1px solid #BBF7D0; margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #1F2937; font-size: 18px; font-weight: bold;">Amount Due:</span>
              <span style="color: #DC2626; font-size: 20px; font-weight: bold;">$${invoice.total.toFixed(2)}</span>
            </div>
          </div>
          
          <!-- Payment Instructions -->
          <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #92400E; margin: 0 0 10px 0;">💳 Payment Instructions</h4>
            <p style="color: #92400E; margin: 0; line-height: 1.4;">
              Please remit payment by the due date to avoid any late fees. You can pay by check, bank transfer, or online payment.
            </p>
          </div>
          
          <!-- Call to Action -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${companyProfile.email}?subject=Payment for Invoice #${invoice.invoice_number}" 
               style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Confirm Payment
            </a>
          </div>
          
          <!-- Contact Information -->
          <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #1F2937; margin: 0 0 10px 0;">Questions? Contact Us</h4>
            <p style="color: #6B7280; margin: 5px 0; line-height: 1.4;">
              📧 Email: ${companyProfile.email}<br>
              📞 Phone: ${companyProfile.phone}<br>
              🌐 Website: ${companyProfile.website}
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; margin: 0; font-size: 14px;">
            Thank you for your business! We appreciate your prompt payment.
          </p>
        </div>
      </div>
    `;
    
    const text = `
Dear ${invoice.customerName},

Thank you for your business! Please find attached your invoice for the services provided.

Invoice Details:
- Invoice Number: #${invoice.invoice_number}
- Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}
- Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
- Amount Due: $${invoice.total.toFixed(2)}

Payment Instructions:
Please remit payment by the due date to avoid any late fees. You can pay by check, bank transfer, or online payment.

Contact Information:
Email: ${companyProfile.email}
Phone: ${companyProfile.phone}
Website: ${companyProfile.website}

Thank you for your business! We appreciate your prompt payment.

Best regards,
${companyProfile.companyName}
    `;
    
    return { subject, html, text };
  }

  static generatePurchaseOrderEmail(purchaseOrder: any, companyProfile: any): EmailTemplate {
    const subject = `Purchase Order #${purchaseOrder.poNumber} from ${companyProfile.companyName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${companyProfile.companyName}</h1>
          <p style="color: #DDD6FE; margin: 5px 0 0 0; font-size: 16px;">Purchase Order</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #1F2937; margin: 0 0 20px 0;">Dear ${purchaseOrder.vendorName},</h2>
          
          <p style="color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
            We would like to place the following purchase order with your company. Please confirm receipt and expected delivery date.
          </p>
          
          <!-- Purchase Order Summary -->
          <div style="background: #FAF5FF; border: 1px solid #DDD6FE; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1F2937; margin: 0 0 15px 0; font-size: 18px;">Purchase Order Details</h3>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6B7280;">P.O. Number:</span>
              <span style="color: #1F2937; font-weight: bold;">#${purchaseOrder.poNumber}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6B7280;">Issue Date:</span>
              <span style="color: #1F2937;">${new Date(purchaseOrder.issueDate).toLocaleDateString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6B7280;">Expected Delivery:</span>
              <span style="color: #1F2937;">${new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6B7280;">Payment Terms:</span>
              <span style="color: #1F2937;">${purchaseOrder.paymentTerms}</span>
            </div>
            <hr style="border: none; border-top: 1px solid #DDD6FE; margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #1F2937; font-size: 18px; font-weight: bold;">Total Amount:</span>
              <span style="color: #7C3AED; font-size: 20px; font-weight: bold;">$${purchaseOrder.total.toFixed(2)}</span>
            </div>
          </div>
          
          <!-- Delivery Instructions -->
          <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #92400E; margin: 0 0 10px 0;">📦 Delivery Instructions</h4>
            <p style="color: #92400E; margin: 0; line-height: 1.4;">
              Please deliver to: ${companyProfile.address}<br>
              Contact person: ${companyProfile.contactPerson || 'Accounts Payable'}<br>
              Phone: ${companyProfile.phone}
            </p>
          </div>
          
          <!-- Call to Action -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${companyProfile.email}?subject=Confirmation of P.O. #${purchaseOrder.poNumber}" 
               style="background: #7C3AED; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Confirm This Order
            </a>
          </div>
          
          <!-- Contact Information -->
          <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #1F2937; margin: 0 0 10px 0;">Questions? Contact Our Purchasing Department</h4>
            <p style="color: #6B7280; margin: 5px 0; line-height: 1.4;">
              📧 Email: ${companyProfile.email}<br>
              📞 Phone: ${companyProfile.phone}<br>
              🌐 Website: ${companyProfile.website}
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; margin: 0; font-size: 14px;">
            Thank you for your partnership. We look forward to receiving your confirmation.
          </p>
        </div>
      </div>
    `;
    
    const text = `
Dear ${purchaseOrder.vendorName},

We would like to place the following purchase order with your company. Please confirm receipt and expected delivery date.

Purchase Order Details:
- P.O. Number: #${purchaseOrder.poNumber}
- Issue Date: ${new Date(purchaseOrder.issueDate).toLocaleDateString()}
- Expected Delivery: ${new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString()}
- Payment Terms: ${purchaseOrder.paymentTerms}
- Total Amount: $${purchaseOrder.total.toFixed(2)}

Delivery Instructions:
Please deliver to: ${companyProfile.address}
Contact person: ${companyProfile.contactPerson || 'Accounts Payable'}
Phone: ${companyProfile.phone}

Contact Information:
Email: ${companyProfile.email}
Phone: ${companyProfile.phone}
Website: ${companyProfile.website}

Thank you for your partnership. We look forward to receiving your confirmation.

Best regards,
${companyProfile.companyName}
    `;
    
    return { subject, html, text };
  }

  static generateOverdueInvoiceEmail(invoice: any, companyProfile: any, daysPastDue: number): EmailTemplate {
    const urgencyLevel = daysPastDue > 60 ? 'URGENT' : daysPastDue > 30 ? 'IMPORTANT' : 'REMINDER';
    const subject = `${urgencyLevel}: Overdue Invoice #${invoice.invoice_number} - ${daysPastDue} days past due`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${companyProfile.companyName}</h1>
          <p style="color: #FCA5A5; margin: 5px 0 0 0; font-size: 16px;">Payment Reminder</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #1F2937; margin: 0 0 20px 0;">Dear ${invoice.customerName},</h2>
          
          <p style="color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
            This is a ${urgencyLevel.toLowerCase()} reminder that your invoice payment is now <strong>${daysPastDue} days overdue</strong>. 
            Please review the details below and arrange for immediate payment.
          </p>
          
          <!-- Overdue Notice -->
          <div style="background: #FEF2F2; border: 2px solid #FCA5A5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-size: 24px; margin-right: 10px;">⚠️</span>
              <h3 style="color: #DC2626; margin: 0; font-size: 18px;">OVERDUE PAYMENT NOTICE</h3>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6B7280;">Invoice Number:</span>
              <span style="color: #1F2937; font-weight: bold;">#${invoice.invoice_number}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6B7280;">Original Due Date:</span>
              <span style="color: #DC2626; font-weight: bold;">${new Date(invoice.due_date).toLocaleDateString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #6B7280;">Days Past Due:</span>
              <span style="color: #DC2626; font-weight: bold; font-size: 18px;">${daysPastDue} days</span>
            </div>
            <hr style="border: none; border-top: 1px solid #FCA5A5; margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span style="color: #1F2937; font-size: 18px; font-weight: bold;">Amount Due:</span>
              <span style="color: #DC2626; font-size: 22px; font-weight: bold;">$${invoice.total.toFixed(2)}</span>
            </div>
          </div>
          
          <!-- Late Fee Notice -->
          ${daysPastDue > 30 ? `
          <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #92400E; margin: 0 0 10px 0;">💰 Late Fee Applied</h4>
            <p style="color: #92400E; margin: 0; line-height: 1.4;">
              A late fee of $25.00 has been applied to your account due to the overdue payment. 
              Please include this amount with your payment.
            </p>
          </div>
          ` : ''}
          
          <!-- Immediate Action Required -->
          <div style="background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #DC2626; margin: 0 0 10px 0;">🚨 Immediate Action Required</h4>
            <p style="color: #DC2626; margin: 0; line-height: 1.4;">
              To avoid further collection actions and maintain your account in good standing, 
              please remit payment immediately. If you have already sent payment, please contact us to confirm.
            </p>
          </div>
          
          <!-- Call to Action -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${companyProfile.email}?subject=URGENT: Payment for Overdue Invoice #${invoice.invoice_number}" 
               style="background: #DC2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Pay Now or Contact Us
            </a>
          </div>
          
          <!-- Contact Information -->
          <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #1F2937; margin: 0 0 10px 0;">Contact Our Accounts Receivable Department</h4>
            <p style="color: #6B7280; margin: 5px 0; line-height: 1.4;">
              📧 Email: ${companyProfile.email}<br>
              📞 Phone: ${companyProfile.phone}<br>
              🕒 Business Hours: Monday-Friday, 9:00 AM - 5:00 PM
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; margin: 0; font-size: 14px;">
            We value your business and look forward to resolving this matter promptly.
          </p>
        </div>
      </div>
    `;
    
    const text = `
Dear ${invoice.customerName},

This is a ${urgencyLevel.toLowerCase()} reminder that your invoice payment is now ${daysPastDue} days overdue. Please review the details below and arrange for immediate payment.

OVERDUE PAYMENT NOTICE:
- Invoice Number: #${invoice.invoice_number}
- Original Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
- Days Past Due: ${daysPastDue} days
- Amount Due: $${invoice.total.toFixed(2)}

${daysPastDue > 30 ? 'LATE FEE APPLIED: A late fee of $25.00 has been applied to your account.\n\n' : ''}

IMMEDIATE ACTION REQUIRED:
To avoid further collection actions and maintain your account in good standing, please remit payment immediately. If you have already sent payment, please contact us to confirm.

Contact Information:
Email: ${companyProfile.email}
Phone: ${companyProfile.phone}
Business Hours: Monday-Friday, 9:00 AM - 5:00 PM

We value your business and look forward to resolving this matter promptly.

Best regards,
${companyProfile.companyName}
    `;
    
    return { subject, html, text };
  }

  // Send email with document attachment
  static async sendDocumentEmail(
    recipientEmail: string,
    template: EmailTemplate,
    attachment?: EmailAttachment,
    fromEmail?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const emailData: any = {
        to: recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      if (fromEmail) {
        emailData.from = fromEmail;
      }

      if (attachment) {
        emailData.attachments = [attachment];
      }

      const result = await blink.notifications.email(emailData);
      
      return {
        success: result.success,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate PDF document URL (placeholder - would integrate with PDF generation service)
  static async generateDocumentPDF(documentType: string, documentData: any): Promise<string> {
    // This would integrate with a PDF generation service
    // For now, return a placeholder URL
    return `https://api.buckaiplatform.com/pdf/${documentType}/${documentData.id}`;
  }

  // Send estimate via email
  static async sendEstimate(estimate: any, companyProfile: any, recipientEmail?: string): Promise<any> {
    const email = recipientEmail || estimate.customerEmail;
    const template = this.generateEstimateEmail(estimate, companyProfile);
    
    // Generate PDF attachment
    const pdfUrl = await this.generateDocumentPDF('estimate', estimate);
    const attachment: EmailAttachment = {
      url: pdfUrl,
      filename: `Estimate-${estimate.estimateNumber}.pdf`,
      type: 'application/pdf'
    };

    return await this.sendDocumentEmail(email, template, attachment, companyProfile.email);
  }

  // Send invoice via email
  static async sendInvoice(invoice: any, companyProfile: any, recipientEmail?: string): Promise<any> {
    const email = recipientEmail || invoice.customerEmail;
    const template = this.generateInvoiceEmail(invoice, companyProfile);
    
    // Generate PDF attachment
    const pdfUrl = await this.generateDocumentPDF('invoice', invoice);
    const attachment: EmailAttachment = {
      url: pdfUrl,
      filename: `Invoice-${invoice.invoice_number}.pdf`,
      type: 'application/pdf'
    };

    return await this.sendDocumentEmail(email, template, attachment, companyProfile.email);
  }

  // Send purchase order via email
  static async sendPurchaseOrder(purchaseOrder: any, companyProfile: any, recipientEmail?: string): Promise<any> {
    const email = recipientEmail || purchaseOrder.vendorEmail;
    const template = this.generatePurchaseOrderEmail(purchaseOrder, companyProfile);
    
    // Generate PDF attachment
    const pdfUrl = await this.generateDocumentPDF('purchase-order', purchaseOrder);
    const attachment: EmailAttachment = {
      url: pdfUrl,
      filename: `PurchaseOrder-${purchaseOrder.poNumber}.pdf`,
      type: 'application/pdf'
    };

    return await this.sendDocumentEmail(email, template, attachment, companyProfile.email);
  }

  // Send overdue invoice reminder
  static async sendOverdueReminder(invoice: any, companyProfile: any, daysPastDue: number, recipientEmail?: string): Promise<any> {
    const email = recipientEmail || invoice.customerEmail;
    const template = this.generateOverdueInvoiceEmail(invoice, companyProfile, daysPastDue);
    
    // Generate PDF attachment
    const pdfUrl = await this.generateDocumentPDF('invoice', invoice);
    const attachment: EmailAttachment = {
      url: pdfUrl,
      filename: `OverdueInvoice-${invoice.invoice_number}.pdf`,
      type: 'application/pdf'
    };

    return await this.sendDocumentEmail(email, template, attachment, companyProfile.email);
  }

  // Bulk send overdue reminders
  static async sendBulkOverdueReminders(companyProfile: any): Promise<any> {
    try {
      // Get all overdue invoices
      const overdueInvoices = await blink.db.invoices.list({
        where: {
          AND: [
            { user_id: companyProfile.user_id },
            { status: 'sent' },
            // Add date comparison logic here
          ]
        }
      });

      const results = [];
      
      for (const invoice of overdueInvoices) {
        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysPastDue > 0) {
          const result = await this.sendOverdueReminder(invoice, companyProfile, daysPastDue);
          results.push({
            invoiceNumber: invoice.invoice_number,
            customerName: invoice.customerName,
            daysPastDue,
            emailSent: result.success,
            error: result.error
          });
        }
      }
      
      return {
        success: true,
        totalProcessed: results.length,
        results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}