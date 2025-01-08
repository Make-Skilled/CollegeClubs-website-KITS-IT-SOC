const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize the app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:17017/KITS-SoC-clubsdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define User Schema
const userSchema = new mongoose.Schema({
    registrationNumber: { type: String, required: true, unique: true },
    branch: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, { timestamps: true });

// Create User Model
const User = mongoose.model('User', userSchema);

// Updated Event Schema to include clubName
const eventSchema = new mongoose.Schema({
    eventName: { type: String, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    time: { type: String, required: true }, // Format: HH:MM
    venue: { type: String, required: true },
}, { timestamps: true });

// Create Event Model
const Event = mongoose.model('Event', eventSchema);


app.get("/", (req, res) => {
    res.send("API server is running");
});

// API to create a new event
app.post('/events', async (req, res) => {
    const {eventName, date, time, venue } = req.body;

    try {
        // Validate required fields
        if ( !eventName || !date || !time || !venue) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newEvent = new Event({
            eventName,
            date,
            time,
            venue
        });

        await newEvent.save();
        res.status(201).json({ 
            message: 'Event created successfully', 
            event: newEvent 
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ 
            message: 'Error creating event', 
            error: error.message 
        });
    }
});

// API to get all events
app.get('/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1, time: 1 });
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ 
            message: 'Error fetching events', 
            error: error.message 
        });
    }
});

// API to get events by club name
app.get('/events/club/:clubName', async (req, res) => {
    try {
        const events = await Event.find({ 
            clubName: req.params.clubName 
        }).sort({ date: 1, time: 1 });
        
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching club events:', error);
        res.status(500).json({ 
            message: 'Error fetching club events', 
            error: error.message 
        });
    }
});

// API to delete an event
app.delete('/events/:id', async (req, res) => {
    try {
        const deletedEvent = await Event.findByIdAndDelete(req.params.id);
        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ 
            message: 'Error deleting event', 
            error: error.message 
        });
    }
});

// API to update an event
app.put('/events/:id', async (req, res) => {
    const { eventName, date, time, venue } = req.body;
    
    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            {eventName, date, time, venue },
            { new: true, runValidators: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ 
            message: 'Event updated successfully', 
            event: updatedEvent
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ 
            message: 'Error updating event', 
            error: error.message 
        });
    }
});

// API to handle user signup
app.post('/signup', async (req, res) => {
    const { registrationNumber, branch, email, password } = req.body;

    try {
        const newUser = new User({ registrationNumber, branch, email, password });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'User already exists' });
        } else {
            res.status(500).json({ message: 'Error registering user', error });
        }
    }
});

// API to handle user login
app.post('/login', async (req, res) => {
    const { registrationNumber, password } = req.body;

    try {
        // Find the user by registration number
        const user = await User.findOne({ registrationNumber });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the password matches
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        res.status(500).json({ message: 'Error during login', error });
    }
});

// Start the server


// Add this to your existing backend code

// Define Club Admin Schema
const clubAdminSchema = new mongoose.Schema({
    clubName: { 
        type: String, 
        required: true,
        enum: ['riseclub', 'ecellclub', 'innovationclub', 'jkclub', 'nssclub', 'nccclub', 'sportsclub', 'culturalclub']
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    }
}, { timestamps: true });

// Create Club Admin Model
const ClubAdmin = mongoose.model('ClubAdmin', clubAdminSchema);

// API to handle club admin registration (you might want to secure this endpoint)
app.post('/admin/register', async (req, res) => {
    const { clubName, email, password } = req.body;

    try {
        // Check if admin already exists
        const existingAdmin = await ClubAdmin.findOne({ 
            $or: [
                { email },
                { clubName }
            ]
        });

        if (existingAdmin) {
            return res.status(400).json({ 
                message: 'Admin already exists for this club or email' 
            });
        }

        // Create new admin
        const newAdmin = new ClubAdmin({
            clubName,
            email,
            password // Note: In production, you should hash the password
        });

        await newAdmin.save();
        res.status(201).json({ 
            message: 'Club admin registered successfully' 
        });

    } catch (error) {
        console.error('Error registering club admin:', error);
        res.status(500).json({ 
            message: 'Error registering club admin', 
            error: error.message 
        });
    }
});

// API to handle club admin login
app.post('/admin/login', async (req, res) => {
    const { clubName, email, password } = req.body;

    try {
        const admin = await ClubAdmin.findOne({ clubName, email });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check password (you should hash and compare in production)
        if (admin.password !== password) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});


// API to get admin details by club name
app.get('/admin/club/:clubName', async (req, res) => {
    try {
        const admin = await ClubAdmin.findOne({ 
            clubName: req.params.clubName 
        }).select('-password'); // Exclude password from response

        if (!admin) {
            return res.status(404).json({ 
                message: 'Admin not found'
            });
        }

        res.status(200).json(admin);
    } catch (error) {
        console.error('Error fetching admin details:', error);
        res.status(500).json({ 
            message: 'Error fetching admin details',
            error: error.message 
        });
    }
});

const PORT = 3006;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
