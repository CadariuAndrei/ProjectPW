const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Adăugat pentru a putea cripta parola noului admin creat automat
const db = require('../db');

const router = express.Router();

// Middleware de bază pentru autentificare (verifică dacă utilizatorul e logat)
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

// Middleware strict pentru Super Admin
const authorizeSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Acces interzis. Doar Super Admin-ul poate gestiona platforma.' });
    }
    next();
};

// Obține toate cluburile (inclusiv detalii despre terenuri și EMAIL-UL adminului alocat)
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                cl.id, cl.name, cl.city, cl.opening_hour, cl.closing_hour, cl.admin_id,
                u.email AS admin_email,
                ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.surface), NULL) AS surfaces,
                COALESCE(BOOL_OR(c.is_indoor), false) AS has_indoor
            FROM clubs cl
            LEFT JOIN courts c ON cl.id = c.club_id
            LEFT JOIN users u ON cl.admin_id = u.id
            GROUP BY cl.id, u.email
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

// Obține recenziile unui club și calculează media notelor
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

        let averageRating = 0;
        if (result.rows.length > 0) {
            const sum = result.rows.reduce((acc, curr) => acc + curr.rating, 0);
            averageRating = (sum / result.rows.length).toFixed(1);
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

// Adaugă o recenzie nouă pentru un club
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
        if (err.constraint === 'one_review_per_user_club') {
            return res.status(400).json({ error: 'Ai adăugat deja o recenzie pentru acest club.' });
        }
        console.error('Eroare la adăugarea recenziei:', err.message);
        res.status(500).json({ error: 'Eroare internă a serverului.' });
    }
});

// Obține lista tuturor utilizatorilor cu rol de 'club_admin' (pentru sugestii)
router.get('/admins/list', authenticateToken, authorizeSuperAdmin, async (req, res) => {
    try {
        const admins = await db.query("SELECT id, name, email FROM users WHERE role = 'club_admin'");
        res.json(admins.rows);
    } catch (err) {
        res.status(500).json({ error: 'Eroare la preluarea administratorilor.' });
    }
});

// Adaugă un club nou (POST) - Găsește sau creează automat adminul pe baza email-ului
router.post('/', authenticateToken, authorizeSuperAdmin, async (req, res) => {
    const { name, city, opening_hour, closing_hour, admin_email } = req.body;
    
    try {
        let finalAdminId = null;
        if (admin_email && admin_email.trim() !== '') {
            const emailClean = admin_email.trim();
            const userCheck = await db.query("SELECT id FROM users WHERE email = $1", [emailClean]);
            
            if (userCheck.rows.length > 0) {
                finalAdminId = userCheck.rows[0].id;
            } else {
                // Dacă emailul introdus nu există în baza de date, îl creăm automat ca 'club_admin'
                const hashedPassword = await bcrypt.hash('parola123', 10);
                const newUser = await db.query(
                    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'club_admin') RETURNING id",
                    ['Admin ' + emailClean.split('@')[0], emailClean, hashedPassword]
                );
                finalAdminId = newUser.rows[0].id;
            }
        }

        const newClub = await db.query(
            'INSERT INTO clubs (name, city, opening_hour, closing_hour, admin_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, city, opening_hour, closing_hour, finalAdminId]
        );
        res.status(201).json({ message: 'Club adăugat cu succes!', club: newClub.rows[0] });
    } catch (err) {
        console.error('Eroare la adăugarea clubului:', err.message);
        res.status(500).json({ error: 'Eroare la adăugarea clubului.' });
    }
});

// Actualizează un club existent (PUT) - Găsește sau creează automat adminul pe baza email-ului
router.put('/:id', authenticateToken, authorizeSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, city, opening_hour, closing_hour, admin_email } = req.body;
    
    try {
        let finalAdminId = null;
        if (admin_email && admin_email.trim() !== '') {
            const emailClean = admin_email.trim();
            const userCheck = await db.query("SELECT id FROM users WHERE email = $1", [emailClean]);
            
            if (userCheck.rows.length > 0) {
                finalAdminId = userCheck.rows[0].id;
            } else {
                // Dacă emailul introdus nu există la editare, îl creăm automat
                const hashedPassword = await bcrypt.hash('parola123', 10);
                const newUser = await db.query(
                    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'club_admin') RETURNING id",
                    ['Admin ' + emailClean.split('@')[0], emailClean, hashedPassword]
                );
                finalAdminId = newUser.rows[0].id;
            }
        }

        const updatedClub = await db.query(
            'UPDATE clubs SET name = $1, city = $2, opening_hour = $3, closing_hour = $4, admin_id = $5 WHERE id = $6 RETURNING *',
            [name, city, opening_hour, closing_hour, finalAdminId, id]
        );
        
        if (updatedClub.rows.length === 0) {
            return res.status(404).json({ error: 'Clubul nu a fost găsit.' });
        }
        
        res.json({ message: 'Club actualizat cu succes!', club: updatedClub.rows[0] });
    } catch (err) {
        console.error('Eroare la actualizarea clubului:', err.message);
        res.status(500).json({ error: 'Eroare la actualizarea clubului.' });
    }
});

// Șterge un club existent (DELETE)
router.delete('/:id', authenticateToken, authorizeSuperAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const deletedClub = await db.query('DELETE FROM clubs WHERE id = $1 RETURNING *', [id]);
        if (deletedClub.rows.length === 0) return res.status(404).json({ error: 'Clubul nu a fost găsit.' });
        res.json({ message: 'Club șters cu succes!' });
    } catch (err) {
        console.error('Eroare la ștergerea clubului:', err.message);
        res.status(500).json({ error: 'Eroare la ștergerea clubului.' });
    }
});

module.exports = router;