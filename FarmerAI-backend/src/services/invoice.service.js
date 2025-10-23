const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure the invoices directory exists
const INVOICES_DIR = path.join(__dirname, '../../public/invoices');
if (!fs.existsSync(INVOICES_DIR)) {
  fs.mkdirSync(INVOICES_DIR, { recursive: true });
}

// Date formatting helpers (native, no external deps)
function formatDDMMYYYY(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatDDMonYYYY(date) {
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd} ${mon} ${yyyy}`;
}

/**
 * Generate an invoice PDF for a booking
 * @param {Object} booking - The booking object
 * @returns {Promise<string>} - Path to the generated invoice
 */
const generateInvoice = async (booking) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const invoiceNumber = `INV-${booking._id.toString().slice(-8).toUpperCase()}`;
      const now = new Date();
      const invoiceDate = formatDDMMYYYY(now);
      const dueDt = new Date(now);
      dueDt.setDate(dueDt.getDate() + 7);
      const dueDate = formatDDMMYYYY(dueDt);
      const fileName = `invoice-${invoiceNumber}.pdf`;
      const filePath = path.join(INVOICES_DIR, fileName);
      
      // Pipe the PDF to a file
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Header
      generateHeader(doc);
      
      // Customer Information
      generateCustomerInformation(doc, booking, invoiceNumber, invoiceDate, dueDate);
      
      // Invoice Items
      generateInvoiceTable(doc, booking);
      
      // Footer
      generateFooter(doc);

      // Finalize the PDF and close the stream
      doc.end();

      writeStream.on('finish', () => {
        resolve(filePath);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate the header of the invoice
 */
function generateHeader(doc) {
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('FarmerAI', 50, 50, { align: 'left' })
    .fontSize(10)
    .text('123 Farm Street', 50, 75, { align: 'left' })
    .text('Agri City, 560001', 50, 90, { align: 'left' })
    .text('GST: 29ABCDE1234F1Z5', 50, 105, { align: 'left' })
    .text('Phone: +91 9876543210', 50, 120, { align: 'left' })
    .text('Email: support@farmerai.com', 50, 135, { align: 'left' })
    .moveDown();
}

/**
 * Generate customer information section
 */
function generateCustomerInformation(doc, booking, invoiceNumber, invoiceDate, dueDate) {
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('INVOICE', 0, 160, { align: 'center' })
    .fontSize(10)
    .text(`Invoice Number: ${invoiceNumber}`, 50, 200, { align: 'left' })
    .text(`Invoice Date: ${invoiceDate}`, 50, 215, { align: 'left' })
    .text(`Due Date: ${dueDate}`, 50, 230, { align: 'left' })
    .text(`Booking ID: ${booking._id}`, 50, 245, { align: 'left' })
    .moveDown()
    .text(
      `Bill To: ${booking.user.firstName} ${booking.user.lastName || ''}`,
      300,
      200,
      { align: 'right' }
    )
    .text(booking.user.email, 300, 215, { align: 'right' })
    .text(
      `Warehouse: ${booking.warehouse.name}`,
      300,
      230,
      { align: 'right' }
    )
    .text(
      `${booking.warehouse.location.address}, ${booking.warehouse.location.city}, ${booking.warehouse.location.state} - ${booking.warehouse.location.pincode}`,
      300,
      245,
      { align: 'right', width: 200, lineGap: 3 }
    )
    .moveDown();
}

/**
 * Generate the invoice table
 */
function generateInvoiceTable(doc, booking) {
  let i;
  const invoiceTableTop = 330;
  const { startDate, endDate, durationInDays } = booking.bookingPeriod;
  
  // Table Header
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('Description', 50, invoiceTableTop)
    .text('Duration', 250, invoiceTableTop, { width: 90, align: 'right' })
    .text('Rate', 340, invoiceTableTop, { width: 90, align: 'right' })
    .text('Amount', 0, invoiceTableTop, { align: 'right' });
  
  // Horizontal line below header
  generateHr(doc, invoiceTableTop + 20);
  
  // Table Rows
  doc.font('Helvetica');
  
  // Warehouse Booking Row
  doc
    .fontSize(10)
    .text(
      `Warehouse Booking - ${booking.warehouse.name}`,
      50,
      invoiceTableTop + 30
    )
    .text(
      `${formatDDMonYYYY(startDate)} to ${formatDDMonYYYY(endDate)} (${durationInDays} days)`,
      250,
      invoiceTableTop + 30,
      { width: 90, align: 'right' }
    )
    .text(
      `₹${booking.pricing.pricePerDay.toFixed(2)}/day`,
      340,
      invoiceTableTop + 30,
      { width: 90, align: 'right' }
    )
    .text(
      `₹${(booking.pricing.pricePerDay * durationInDays).toFixed(2)}`,
      0,
      invoiceTableTop + 30,
      { align: 'right' }
    );
  
  // Storage Details Row
  doc
    .text(
      `Storage: ${booking.storageDetails.quantity} ${booking.storageDetails.unit} (${booking.storageDetails.storageType})`,
      50,
      invoiceTableTop + 50
    );
  
  // Horizontal line above total
  generateHr(doc, invoiceTableTop + 70);
  
  // Subtotal
  doc
    .font('Helvetica')
    .fontSize(10)
    .text('Subtotal:', 300, invoiceTableTop + 80, { align: 'right' })
    .text(`₹${booking.pricing.basePrice.toFixed(2)}`, 0, invoiceTableTop + 80, { align: 'right' });
  
  // Tax
  doc
    .text('Tax (18%):', 300, invoiceTableTop + 95, { align: 'right' })
    .text(`₹${booking.pricing.taxAmount.toFixed(2)}`, 0, invoiceTableTop + 95, { align: 'right' });
  
  // Total
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Total:', 300, invoiceTableTop + 120, { align: 'right' })
    .text(`₹${booking.pricing.totalAmount.toFixed(2)}`, 0, invoiceTableTop + 120, { align: 'right' });
  
  // Payment status
  doc
    .font('Helvetica')
    .fontSize(10)
    .text(`Payment Status: ${booking.payment.status.toUpperCase()}`, 50, invoiceTableTop + 150);
  
  if (booking.payment.razorpayPaymentId) {
    doc.text(`Payment ID: ${booking.payment.razorpayPaymentId}`, 50, invoiceTableTop + 165);
  }
  
  // Terms and conditions
  doc
    .font('Helvetica-Oblique')
    .fontSize(8)
    .text('Terms and Conditions:', 50, invoiceTableTop + 200, { underline: true })
    .font('Helvetica')
    .text('1. This is a computer-generated invoice and does not require a physical signature.', 50, invoiceTableTop + 215)
    .text('2. Please make sure to carry a copy of this invoice when visiting the warehouse.', 50, invoiceTableTop + 230)
    .text('3. For any queries, please contact support@farmerai.com', 50, invoiceTableTop + 245);
}

/**
 * Generate a horizontal line
 */
function generateHr(doc, y) {
  doc
    .strokeColor('#aaaaaa')
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

/**
 * Generate the footer
 */
function generateFooter(doc) {
  doc
    .fontSize(10)
    .text('Thank you for your business!', 50, 750, { align: 'center', width: 500 })
    .text('FarmerAI - Empowering Farmers with Technology', 50, 780, { align: 'center', width: 500 });
}

module.exports = {
  generateInvoice
};
