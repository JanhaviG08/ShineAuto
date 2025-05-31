const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vehicleType: {
        type: String,
        enum: ['car', 'suv', 'truck'],
        required: [true, 'Vehicle type is required']
    },
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        validate: {
            validator: function(v) {
                return /^[0-9]{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    vehicleDetails: {
        type: String,
        required: [true, 'Vehicle details are required'],
        trim: true
    },
    numberPlate: {
        type: String,
        required: [true, 'Number plate is required'],
        uppercase: true,
        validate: {
            validator: function(v) {
                return /^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,3}[ -]?[0-9]{4}$/.test(v);
            },
            message: props => `${props.value} is not a valid number plate! (Example: MH-09-AB-1234)`
        }
    },
    serviceType: {
        type: String,
        enum: ['washing', 'detailing', 'polishing'],
        required: [true, 'Service type is required']
    },
    subService: {
        type: String,
        required: [true, 'Sub-service is required']
    },
    appointmentDate: {
        type: Date,
        required: [true, 'Appointment date is required'],
        min: Date.now
    },
    appointmentSlot: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        required: [true, 'Time slot is required']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'confirmed'
    },
    amountToBePaid: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    paymentType: {
        type: String,
        enum: ['cash', 'online', 'card'],
        required: [true, 'Payment type is required']
    },
    submitDateTime: {
        type: Date, 
        default: Date.now 
    }
});

// Add index for better query performance
vehicleSchema.index({ numberPlate: 1, appointmentDate: 1 });

const Form = mongoose.model('Form', vehicleSchema);
module.exports = Form;