document.addEventListener('DOMContentLoaded', function() {
  // Initialize date picker
  const datePicker = flatpickr("#appointmentDate", {
    minDate: "today",
    dateFormat: "Y-m-d",
    onChange: function(selectedDates, dateStr) {
      if (dateStr) {
        fetchAvailableSlots(dateStr);
        document.getElementById('appointmentSlot').disabled = false;
      } else {
        document.getElementById('appointmentSlot').disabled = true;
      }
    }
  });

  const priceMap = {
    car: { washing: 300, detailing: 500, polishing: 400 },
    suv: { washing: 400, detailing: 750, polishing: 600 },
    truck: { washing: 500, detailing: 1000, polishing: 800 }
  };

document.getElementById('vehicleType').addEventListener('change', updatePrice);
document.getElementById('serviceType').addEventListener('change', updatePrice);
  
const TIME_SLOTS = {
    morning: { start: '9:00 AM', end: '12:00 PM', max: 3 },
    afternoon: { start: '12:00 PM', end: '4:00 PM', max: 4 },
    evening: { start: '4:00 PM', end: '8:00 PM', max: 3 }
};

function updatePrice() {
  const vehicleType = document.getElementById('vehicleType').value;
  const serviceType = document.getElementById('serviceType').value;
  
  if (vehicleType && serviceType) {
    const price = priceMap[vehicleType][serviceType];
    document.getElementById('estimatedPrice').textContent = `₹${price}`;
  } else {
    document.getElementById('estimatedPrice').textContent = '-';
  }
}

// function calculatePrice() {
//     const vehicle = document.getElementById('vehicleType').value;
//     const service = document.getElementById('serviceType').value;
//     const priceElement = document.getElementById('estimatedPrice');
    
//     if (vehicle && service && PRICING[vehicle] && PRICING[vehicle][service]) {
//       priceElement.textContent = `₹${PRICING[vehicle][service]}`;
//     } else {
//       priceElement.textContent = '-';
//     }
// }

async function fetchAvailableSlots(date) {
  try {
    const response = await fetch(`/api/available-slots/${date}`);
    const data = await response.json();
    
    const slotSelect = document.getElementById('appointmentSlot');
    slotSelect.innerHTML = '<option value="">Select time slot</option>';
    
    if (data.availableSlots && data.availableSlots.length > 0) {
      data.availableSlots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot;
        option.textContent = formatSlotName(slot);
        slotSelect.appendChild(option);
      });
    } else {
      slotSelect.innerHTML = '<option value="">No slots available</option>';
    }
  } catch (error) {
    console.error('Error fetching slots:', error);
  }
}
 
function formatSlotName(slot) {
  const slotNames = {
    morning: 'Morning (9 AM - 12 PM)',
    afternoon: 'Afternoon (1 PM - 5 PM)',
    evening: 'Evening (6 PM - 8 PM)'
  };
  return slotNames[slot] || slot;
}
  // Form submission handler
  document.getElementById('appointmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = {
      customerName: document.getElementById('customerName').value,
      phoneNumber: document.getElementById('phoneNumber').value,
      vehicleType: document.getElementById('vehicleType').value,
      vehicleDetails: document.getElementById('vehicleDetails').value,
      numberPlate: document.getElementById('numberPlate').value,
      serviceType: document.getElementById('serviceType').value,
      appointmentDate: document.getElementById('appointmentDate').value,
      appointmentSlot: document.getElementById('appointmentSlot').value
    };
    
    try {
      const response = await fetch('/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Appointment booked successfully!');
        loadAppointments(); // Refresh the appointments list
        this.reset(); // Reset the form
        document.getElementById('estimatedPrice').textContent = '-';
      } else {
        alert(`Error: ${result.error}`);
      }
    } 
    catch (error) {
      console.error('Error:', error);
      alert('Failed to book appointment. Please try again.');
    }
  });

// Load and display appointments
async function loadAppointments() {
  try {
    const response = await fetch('/api/appointments');
    const data = await response.json();
    
    const container = document.getElementById('appointmentsContainer');
    container.innerHTML = '';
    
    if (data.data && data.data.length > 0) {
      data.data.forEach(appointment => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        
        const date = new Date(appointment.appointmentDate);
        const formattedDate = date.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        const formattedTime = formatSlotName(appointment.appointmentSlot);
        
        card.innerHTML = `
          <h3>${appointment.customerName}</h3>
          <p><strong>Vehicle:</strong> ${appointment.vehicleType.toUpperCase()} (${appointment.numberPlate})</p>
          <p><strong>Service:</strong> ${appointment.serviceType.charAt(0).toUpperCase() + appointment.serviceType.slice(1)}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
          <p class="status-${appointment.status}"><strong>Status:</strong> ${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</p>
          <button class="delete-btn" data-id="${appointment._id}">Cancel Appointment</button>
        `;
        
        container.appendChild(card);
      });
      
      // Add event listeners to delete buttons
      document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async function() {
          if (confirm('Are you sure you want to cancel this appointment?')) {
            try {
              const response = await fetch(`/api/appointments/${this.dataset.id}`, {
                method: 'DELETE'
              });
              
              const result = await response.json();
              if (result.success) {
                loadAppointments(); // Refresh the list
              } else {
                alert('Failed to cancel appointment');
              }
            } catch (error) {
              console.error('Error:', error);
              alert('Failed to cancel appointment');
            }
          }
        });
      });
    } else {
      container.innerHTML = '<p>No upcoming appointments found.</p>';
    }
  } catch (error) {
    console.error('Error loading appointments:', error);
    document.getElementById('appointmentsContainer').innerHTML = '<p>Error loading appointments. Please try again.</p>';
  }
}

// Initial load of appointments
loadAppointments();
});

  // Render appointments to the page
  function renderAppointments(appointments) {
    appointmentsContainer.innerHTML = '';
    
    if (!appointments || appointments.length === 0) {
      appointmentsContainer.innerHTML = '<p>No appointments found</p>';
      return;
    }
    
    appointments.forEach(appt => {
      const card = document.createElement('div');
      card.className = 'appointment-card';
      card.innerHTML = `
        <h3>${appt.serviceType} (${appt.vehicleType})</h3>
        <p><strong>Date:</strong> ${new Date(appt.appointmentDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${appt.appointmentSlot}</p>
        <p><strong>Vehicle:</strong> ${appt.numberPlate}</p>
        <p><strong>Status:</strong> <span class="status-${appt.status}">${appt.status}</span></p>
      `;
      appointmentsContainer.appendChild(card);
    });
  }
  // Initial load
  loadAppointments();
