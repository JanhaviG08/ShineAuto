// Assuming you've included both libraries

const receiptPrinter = new WebBluetoothReceiptPrinter();

async function printReceipt() {
  // 1. Generate your receipt HTML content
  const receiptContent = `
    <h2>Store Name</h2>
    <p>Items:</p>
    <ul>
      <li>Item 1: $10.00</li>
      <li>Item 2: $5.00</li>
    </ul>
    <p>Total: $15.00</p>
  `;

  // 2. Encode the HTML content using ThermalPrinterEncoder (replace with your logic)
  const thermalEncoder = new ThermalPrinterEncoder(); 
  const encodedBytes = thermalEncoder.encode(receiptContent, { language: 'escpos' }); 

  try {
    // 3. Connect to the Bluetooth receipt printer
    await receiptPrinter.connect();

    // 4. Send the encoded receipt data to the printer
    await receiptPrinter.printer.write({ value: encodedBytes }, true);

    console.log("Receipt printed successfully!");
  } catch (error) {
    console.error("Error printing receipt:", error);
  } finally {
    // Disconnect (optional, but good practice)
    await receiptPrinter.disconnect();
  }
}

printReceipt();