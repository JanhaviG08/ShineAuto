const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: 2,
    validate: {
      validator: function(v) {
        return v !== "undefined";
      },
      message: 'Customer name cannot be "undefined"'
    }
  },
  phoneNumber: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['car', 'suv', 'truck']
  },
  numberPlate: {
    type: String,
    required: true,
    unique: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['washing', 'detailing', 'polishing']
  },
  appointmentDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: 'Invalid date'
    }
  },
  appointmentSlot: {
    type: String,
    required: true,
    enum: ['morning', 'afternoon', 'evening']
  },
  status: {
    type: String,
    default: 'confirmed',
    enum: ['confirmed', 'pending', 'cancelled']
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Add pre-save hook to prevent "undefined" values
appointmentSchema.pre('save', function(next) {
  if (this.customerName === "undefined") {
    throw new Error('Customer name cannot be "undefined"');
  }
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);