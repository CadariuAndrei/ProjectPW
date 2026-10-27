const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});


pool.connect((err, client, release) => {
    if (err) {
        console.error('Error conecting to database', err.stack);
    } else {
        console.log('Success conection at PostgreSQL!');
        release();
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};