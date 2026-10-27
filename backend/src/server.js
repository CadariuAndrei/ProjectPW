const express = require('express');
const cors = require('cors');
require('dotenv').config();

require('./db');

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth.routes');
const clubsRoutes = require('./routes/clubs.routes');
const bookingsRoutes = require('./routes/bookings.routes');

app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/bookings', bookingsRoutes);

app.get('/api/status', (req, res) => {
    res.json({ message: 'Backend server functioneaza perfect, toate rutele sunt active!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`The server runs on http://localhost:${PORT}`);
});