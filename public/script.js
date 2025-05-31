document.getElementById('downloadReceiptBtn').addEventListener('click', function () {
  console.log("helloo");
  const doc = new jsPDF();

   doc.setFontSize(30); 
   doc.setFont('helvetica', 'bold'); 
   doc.text('Shine Auto', 10, 20);
   doc.setFontSize(25); 
   doc.text('Bill Receipt', 10, 30);

  doc.setFontSize(14); 
  doc.setFont('helvetica', 'bold'); 
  doc.text('----------------------------------', 10, 40);

  const currentDate = new Date();
  doc.text('Date: ' + currentDate.toLocaleDateString(), 10, 50);
  doc.text('Time: ' + currentDate.toLocaleTimeString(), 10, 60);
  doc.text('Customer Name: ' + document.getElementById('customerName').value, 10, 70);
  doc.text('Phone Number: ' + document.getElementById('phoneNumber').value, 10, 80);
  doc.text('Vehicle Details: ' + document.getElementById('vehicleDetails').value, 10, 90);
  doc.text('Number Plate: ' + document.getElementById('numberPlate').value, 10, 100);
  doc.text('Service Type: ' + document.getElementById('serviceTypes').value, 10, 110);
  doc.text('Sub Service: ' + document.getElementById('subService').value, 10, 120);
  doc.text('Amount: ' + document.getElementById('amountToBePaid').value, 10, 130);
  doc.text('Payment Status: ' + document.getElementById('paymentStatus').value, 10, 140);
  doc.text('Payment Method: ' + document.getElementById('paymentType').value, 10, 150);

  doc.text('-----------------------------------', 10, 160);

  doc.save('receipt.pdf');
});


//Sample Receipt

// Shine Auto
// Bill Receipt
// ----------------------------------
// Date: 5/16/2024
// Time: 12:09:54 PM
// Customer Name: Arya Khochage
// Phone Number: 9284961251
// Vehicle Details: Bullet-350
// Number Plate: mh-09-ge-9999
// Service Type: detailing
// Sub Service: Two Wheeler Polish
// Amount: 700
// Payment Status: paid
// Payment Method: online
// -----------------------------------
