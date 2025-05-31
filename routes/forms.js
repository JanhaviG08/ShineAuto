const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Form = require('../models/form.js');
const Appointment = require("../models/appointment.js");
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');
const User = require("../models/user.js");
const flash = require("connect-flash");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const crypto = require('crypto');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const secretKey = crypto.randomBytes(32).toString('hex');
console.log("Secret Key:", secretKey);

// Middleware setup
const sessionOptions = {
  secret: secretKey, 
  resave: false,
  saveUninitialized: true,
};

app.use(session(sessionOptions));
app.use(flash());

app.use(bodyParser.json()); 

app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));


mongoose.connect('mongodb://localhost:27017/vehicleWash')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));



function isAuthenticated(req, res, next) {
  const isLoggedIn = req.session && req.session.userName;
  if (isLoggedIn) {
      return next();
  }
  res.redirect('/login');
}

app.use('/', function(req, res, next) {
  if (req.path === '/' && !req.session.userName) {
      return res.redirect('/signup');
  }
  next();
});
 
app.get("/home", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
 
 app.get("/signup", (req, res) => {
  res.render('signup', { messages: req.flash() });
});
app.post('/signup', async (req, res) => {
  const { userName, password } = req.body;

  try {
    const totalUsersCount = await User.countDocuments();
    if (totalUsersCount >= 3) {
      req.flash('error', 'The maximum number of users has been reached. Signups are currently closed.');
      return res.redirect('/signup');
    }

    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      req.flash('error', 'User already exists');
      return res.redirect('/signup');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      userName,
      password: hashedPassword
    });
    await user.save();
    res.redirect('/login');
  } 
  catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Server error' });
  }
});

app.get("/login", (req, res) => {
  res.render('login', { messages: req.flash() });
});

app.post('/login', async (req, res) => {
  const { userName, password } = req.body;
  
  try {
    const user = await User.findOne({ userName });
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Invalid password');
      return res.redirect('/login');
    }
    req.session.userName = user.userName;
    return res.redirect('/home');
  } 
  catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Server error' });
  }
});


app.get("/cart", isAuthenticated, async (req, res) => {
  try {
    const formData = await Form.find().sort({ submitDateTime: -1 }).limit(10);
    res.render('cart', { formData: formData, messages: req.flash() });  } catch (error) {
    console.error("Error retrieving form data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/form", isAuthenticated, async (req, res) => {
  try {
    let {
      vehicleType,
      customerName,
      phoneNumber,
      vehicleDetails,
      numberPlate,
      serviceType,
      subService,
      amountToBePaid,
      paymentStatus,
      paymentType
    } = req.body;

    vehicleType = Array.isArray(vehicleType) ? vehicleType.map(type => type.toLowerCase()) : [vehicleType.toLowerCase()];
    customerName = customerName.toLowerCase();
    vehicleDetails = vehicleDetails.toLowerCase();
    numberPlate = numberPlate.toLowerCase(); 
    serviceType = Array.isArray(serviceType) ? serviceType.map(type => type.toLowerCase()) : [serviceType.toLowerCase()];
    subService = Array.isArray(subService) ? subService.map(service => service.toLowerCase()) : [subService.toLowerCase()];
    paymentStatus = Array.isArray(paymentStatus) ? paymentStatus.map(type => type.toLowerCase()) : [paymentStatus.toLowerCase()];
    paymentType = Array.isArray(paymentType) ? paymentType.map(type => type.toLowerCase()) : [paymentType.toLowerCase()];

    const formData = new Form({
      vehicleType,
      customerName,
      phoneNumber,
      vehicleDetails,
      numberPlate,
      serviceType,
      subService,
      amountToBePaid,
      paymentStatus,
      paymentType
    });

    await formData.save();

    res.send(`
      <script>
        alert('Customer added to cart successfully');
        window.location.href = '/home';
      </script> 
    `);
    
  
  } catch (error) {
    console.error("Error saving form data:", error);
    res.status(500).send("Internal Server Error");
  }
});


const getLocalDateString = (dateString) =>{

  const date = new Date(dateString); 
  const formattedEndDate = date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
  console.log(formattedEndDate);
  return formattedEndDate
}

const cors = require('cors');
app.use(cors());

// GET appointment page
app.get('/appointment', isAuthenticated, (req, res) => {
  res.render('appointment');
});

// API to get available time slots
app.get('/api/available-slots/:date', isAuthenticated, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Form.find({
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    const allSlots = {
      morning: { max: 3 },
      afternoon: { max: 4 },
      evening: { max: 3 }
    };
    const availableSlots = Object.keys(allSlots).filter(slot => {
      const bookedCount = bookedAppointments.filter(a => a.appointmentSlot === slot).length;
      return bookedCount < allSlots[slot].max;
    });

    res.json({ availableSlots });
  }
  catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Failed to load available time slots' });
  }
});

// Update your existing book-appointment endpoint
app.post('/book-appointment', isAuthenticated, async (req, res) => {
  try {
    if (!req.body.numberPlate) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle number plate is required'
      });
    }

    const newAppointment = new Appointment({
      ...req.body,
      appointmentDate: new Date(req.body.appointmentDate),
      status: 'confirmed',
      submitDateTime: new Date()
    });

    await newAppointment.save();
        
    res.status(201).json({ 
      success: true,
      data: newAppointment,
      message: 'Appointment booked successfully'
    });
  }
  catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.get('/api/appointments', isAuthenticated, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .sort({ appointmentDate: -1 })
      .limit(10);
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch appointments' 
    });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Route to render the viewSales.ejs file
app.get("/viewSales", isAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate || isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
      const formData = await Form.find();
      return res.render('viewSales', { formData });
    }
    
    const adjustedEndDate = new Date(new Date(endDate).getTime() + 86400000); // Add one day (in milliseconds)
    
    const formData = await Form.find({
      submitDateTime: {
        $gte: new Date(startDate),
        $lte: adjustedEndDate
      }
    }).sort({ submitDateTime: -1 });

    res.render('viewSales', { formData });
  } catch (error) {
    console.error("Error retrieving form data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/viewPending", isAuthenticated, async (req, res) => {
  try {
    const pendingData = await Form.find({ paymentStatus: "unpaid" }).sort({ submitDateTime: -1 });
    res.render('pendingList', { pendingData, messages: req.flash() });
  } 
  catch (error) {
    console.error("Error retrieving sales data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/pendingList', isAuthenticated, async (req, res) => {
  try {
    const pendingItems = await Appointment.find({ status: 'pending' }).lean();
    
    // Ensure consistent data structure
    const processedItems = pendingItems.map(item => ({
      ...item,
      serviceType: item.serviceType || 'Not specified',
      paymentStatus: item.paymentStatus || 'unpaid',
      amountToBePaid: item.amountToBePaid || 0
    }));
    
    res.render('pendingList', { items: processedItems });
  } catch (error) {
    console.error('Error fetching pending list:', error);
    res.status(500).send('Error loading pending list');
  }
});

// Edit route
app.get("/edit/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;

    console.log("Received ID:", id); 
    if (!mongoose.isValidObjectId(id)) {
      req.flash('error', 'Invalid form ID');
      return res.status(404).redirect("/viewPending"); 
    }
    const formData = await Form.findById(id);
    if (!formData) {
      req.flash('error', 'Form not found');
      return res.status(404).redirect("/viewPending"); 
    }
    res.render('edit', { formData: formData, messages: req.flash() });
  } 
  catch (error) {
    console.error("Error retrieving form data for editing:", error);
    req.flash('error', 'Internal Server Error');
    res.status(500).redirect("/viewPending"); 
  }
});

// Update route
app.post("/update/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const { paymentStatus, paymentType } = req.body;
    const updatedForm = await Form.findByIdAndUpdate(id, {
      paymentStatus,
      paymentType
    }, { new: true }); 

    if (!updatedForm) {
      req.flash('error', 'Form not found');
      return res.status(404).redirect("/viewPending"); 
    }

    req.flash('success', 'Form updated successfully');
    res.redirect("/viewPending");
  } 
  catch (error) {
    console.error("Error updating form data:", error);
    req.flash('error', 'Internal Server Error');
    res.status(500).redirect("/viewPending");
  }
});


// Route to render the Sales Overview page
app.get("/salesOverview", isAuthenticated, async (req, res) => {
  try {
      const salesData = await Form.find({ 
        submitDateTime: { 
          $gte: new Date(new Date().setHours(0,0,0)), 
          $lt: new Date(new Date().setHours(23,59,59)) 
        } 
      });
      const totalCash = salesData.reduce((total, sale) => {
        if (sale.paymentType.includes('cash')) {
          return total + sale.amountToBePaid;
        }
        return total;
      }, 0);
      const totalOnline = salesData.reduce((total, sale) => {
        if (sale.paymentType.includes('online')) {
          return total + sale.amountToBePaid;
        }
        return total;
      }, 0);
      const totalCombined = totalCash + totalOnline;
    res.render('salesOverview', { salesData, totalCash, totalOnline, totalCombined });
  } 
  catch (error) {
    console.error("Error retrieving sales data:", error);
    res.status(500).send("Internal Server Error");
  }
});


// Delete route
app.delete("/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    await Form.findByIdAndDelete(id);
    req.flash('success', 'Customer deleted successfully');
    res.redirect("/cart");
  } catch (error) {
    console.error("Error deleting form data:", error);
    req.flash('error', 'Failed to delete customer');
    res.status(500).send("Internal Server Error");
  }
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.redirect("/login");
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});