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


// Obține toate cluburile (inclusiv detalii despre terenurile lor pentru filtre)
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                cl.id, cl.name, cl.city, cl.opening_hour, cl.closing_hour,
                ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.surface), NULL) AS surfaces,
                COALESCE(BOOL_OR(c.is_indoor), false) AS has_indoor
            FROM clubs cl
            LEFT JOIN courts c ON cl.id = c.club_id
            GROUP BY cl.id
            ORDER BY cl.name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Eroare la preluarea cluburilor:', err.message);
        res.status(500).json({ error: 'Eroare la preluarea cluburilor.' });
    }
});

// Obține terenurile unui club specific
router.get('/:id/courts', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM courts WHERE club_id = $1', [id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Eroare la preluarea terenurilor.' });
    }
});



// 1. Obține recenziile unui club și calculează media notelor
router.get('/:id/reviews', async (req, res) => {
    const clubId = req.params.id;
    try {
        const result = await db.query(`
            SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.club_id = $1
            ORDER BY r.created_at DESC
        `, [clubId]);

        // Calculăm media notelor
        let averageRating = 0;
        if (result.rows.length > 0) {
            const sum = result.rows.reduce((acc, curr) => acc + curr.rating, 0);
            averageRating = (sum / result.rows.length).toFixed(1); // o singură zecimală (ex: 4.5)
        }

        res.json({
            averageRating,
            totalReviews: result.rows.length,
            reviews: result.rows
        });
    } catch (err) {
        console.error('Eroare la preluarea recenziilor:', err.message);
        res.status(500).json({ error: 'Eroare la preluarea recenziilor.' });
    }
});

// 2. Adaugă o recenzie nouă pentru un club
router.post('/:id/reviews', authenticateToken, async (req, res) => {
    const clubId = req.params.id;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Nota trebuie să fie un număr între 1 și 5.' });
    }

    try {
        const newReview = await db.query(
            'INSERT INTO reviews (club_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
            [clubId, userId, rating, comment]
        );
        res.status(201).json({ message: 'Recenzie adăugată cu succes!', review: newReview.rows[0] });
    } catch (err) {
        // Interceptăm eroarea specifică de la baza de date (constraint-ul UNIQUE creat)
        if (err.constraint === 'one_review_per_user_club') {
            return res.status(400).json({ error: 'Ai adăugat deja o recenzie pentru acest club.' });
        }
        console.error('Eroare la adăugarea recenziei:', err.message);
        res.status(500).json({ error: 'Eroare internă a serverului.' });
    }
});

module.exports = router;