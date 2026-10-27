const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Acces interzis. Trebuie să fii logat.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Sesiune expirată. Loghează-te din nou.' });
        req.user = user;
        next();
    });
};


router.get('/admin/dashboard', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        // Aducem numele clubului pe care îl administrează acest user
        const clubResult = await db.query('SELECT name FROM clubs WHERE admin_id = $1', [userId]);
        
        if (clubResult.rows.length === 0) {
            return res.status(403).json({ error: 'Nu ești administratorul niciunui club.' });
        }

        const clubName = clubResult.rows[0].name;

        // Aducem toate rezervările pentru terenurile acestui club
        const bookingsResult = await db.query(`
            SELECT 
                b.id AS booking_id, b.booking_date, b.start_hour, b.total_price, b.status, b.is_open_match,
                c.name AS court_name, 
                u.name AS player_name, u.email AS player_email
            FROM bookings b
            JOIN courts c ON b.court_id = c.id
            JOIN clubs cl ON c.club_id = cl.id
            JOIN users u ON b.creator_id = u.id
            WHERE cl.admin_id = $1
            ORDER BY b.booking_date DESC, b.start_hour DESC
        `, [userId]);

        res.json({
            clubName: clubName,
            bookings: bookingsResult.rows
        });
    } catch (err) {
        console.error('Eroare Admin Dashboard:', err.message);
        res.status(500).json({ error: 'Eroare internă a serverului.' });
    }
});


router.get('/open/matches', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                b.id AS booking_id, b.booking_date, b.start_hour, b.match_type,
                c.name AS court_name, 
                cl.name AS club_name, cl.city,
                u.name AS creator_name, u.skill_level AS creator_skill
            FROM bookings b
            JOIN courts c ON b.court_id = c.id
            JOIN clubs cl ON c.club_id = cl.id
            JOIN users u ON b.creator_id = u.id
            WHERE b.is_open_match = TRUE AND b.status = 'active' AND b.booking_date >= CURRENT_DATE
            ORDER BY b.booking_date ASC, b.start_hour ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Eroare internă.' });
    }
});

router.post('/:id/join', authenticateToken, async (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user.id;
    try {
        const checkBooking = await db.query('SELECT creator_id FROM bookings WHERE id = $1', [bookingId]);
        if (checkBooking.rows.length > 0 && checkBooking.rows[0].creator_id === userId) {
            return res.status(400).json({ error: 'Nu te poți alătura propriului meci.' });
        }
        const checkPlayer = await db.query('SELECT * FROM match_players WHERE booking_id = $1 AND user_id = $2', [bookingId, userId]);
        if (checkPlayer.rows.length > 0) return res.status(400).json({ error: 'Ești deja înscris.' });

        await db.query('INSERT INTO match_players (booking_id, user_id) VALUES ($1, $2)', [bookingId, userId]);
        res.status(201).json({ message: 'Te-ai alăturat cu succes!' });
    } catch (err) {
        res.status(500).json({ error: 'Eroare internă.' });
    }
});

router.delete('/:id/leave', authenticateToken, async (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user.id;
    try {
        const result = await db.query('DELETE FROM match_players WHERE booking_id = $1 AND user_id = $2 RETURNING *', [bookingId, userId]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'Nu ești înscris.' });
        res.json({ message: 'Te-ai retras cu succes!' });
    } catch (err) {
        res.status(500).json({ error: 'Eroare internă.' });
    }
});


router.get('/my-bookings', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.query(`
            SELECT 
                b.id AS booking_id, b.booking_date, b.start_hour, b.total_price, b.status,
                c.name AS court_name, cl.name AS club_name
            FROM bookings b
            JOIN courts c ON b.court_id = c.id
            JOIN clubs cl ON c.club_id = cl.id
            WHERE b.creator_id = $1
            ORDER BY b.booking_date DESC, b.start_hour DESC
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Eroare internă.' });
    }
});

router.patch('/:id/cancel', authenticateToken, async (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user.id;
    try {
        const result = await db.query(
            'UPDATE bookings SET status = $1 WHERE id = $2 AND creator_id = $3 RETURNING *',
            ['cancelled', bookingId, userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Rezervare negăsită.' });
        res.json({ message: 'Anulată cu succes!', booking: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Eroare internă.' });
    }
});



router.get('/:courtId', async (req, res) => {
    const { courtId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Data este obligatorie.' });

    try {
        const result = await db.query(
            'SELECT id, start_hour, creator_id FROM bookings WHERE court_id = $1 AND booking_date = $2 AND status = $3',
            [courtId, date, 'active']
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Eroare internă.' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    const { court_id, booking_date, start_hour, total_price, is_open_match, match_type } = req.body;
    const creator_id = req.user.id; 
    try {
        const conflictCheck = await db.query(
            'SELECT id FROM bookings WHERE court_id = $1 AND booking_date = $2 AND start_hour = $3 AND status = $4',
            [court_id, booking_date, start_hour, 'active']
        );
        if (conflictCheck.rows.length > 0) return res.status(400).json({ error: 'Acest interval orar este deja ocupat.' });

        const newBooking = await db.query(
            'INSERT INTO bookings (creator_id, court_id, booking_date, start_hour, total_price, is_open_match, match_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [creator_id, court_id, booking_date, start_hour, total_price || 0, is_open_match || false, match_type || 'Singles', 'active']
        );
        res.status(201).json({ message: 'Rezervare confirmată!', booking: newBooking.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Eroare la procesarea rezervării.' });
    }
});

module.exports = router;