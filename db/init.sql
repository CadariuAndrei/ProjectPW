-- Ștergem tabelele vechi (dacă există) pentru a preveni erorile la repornirea Docker-ului
DROP TABLE IF EXISTS reviews, match_players, bookings, courts, clubs, users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    -- Am adăugat rolul de 'super_admin' aici:
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'club_admin', 'super_admin')),
    skill_level NUMERIC(2,1) CHECK (skill_level >= 2.0 AND skill_level <= 5.0)
);

CREATE TABLE clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    opening_hour INTEGER CHECK (opening_hour >= 0 AND opening_hour <= 23),
    closing_hour INTEGER CHECK (closing_hour >= 0 AND closing_hour <= 24),
    night_lighting_hour INTEGER CHECK (night_lighting_hour >= 16 AND night_lighting_hour <= 23),
    -- Am integrat admin_id direct la creare:
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE courts (
    id SERIAL PRIMARY KEY,
    club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    surface VARCHAR(50) CHECK (surface IN ('Zgură', 'Hard', 'Iarbă')),
    is_indoor BOOLEAN DEFAULT FALSE,
    base_price NUMERIC(6,2) NOT NULL,
    night_price_supplement NUMERIC(6,2) DEFAULT 0,
    indoor_price_supplement NUMERIC(6,2) DEFAULT 0
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    court_id INTEGER REFERENCES courts(id) ON DELETE CASCADE,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    start_hour INTEGER CHECK (start_hour >= 0 AND start_hour <= 23),
    total_price NUMERIC(6,2) NOT NULL,
    is_open_match BOOLEAN DEFAULT FALSE,
    match_type VARCHAR(20) CHECK (match_type IN ('Singles', 'Doubles')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_double_booking UNIQUE (court_id, booking_date, start_hour)
);

CREATE TABLE match_players (
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (booking_id, user_id)
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT one_review_per_user_club UNIQUE (club_id, user_id)
);

-- ==========================================
-- INSERT-URI DATE DE BAZĂ
-- ==========================================

INSERT INTO users (name, email, password_hash, role, skill_level) VALUES 
('Ciprian', 'ciprian@test.com', '$2b$10$X...', 'player', 4.0),
('Alex', 'alex@test.com', '$2b$10$X...', 'player', 3.5),
('Elena', 'elena@test.com', '$2b$10$X...', 'player', 2.5),
('Mihai', 'mihai@test.com', '$2b$10$X...', 'player', 4.5),
('Admin Helios', 'admin@helios.ro', '$2b$10$X...', 'club_admin', NULL),      -- id: 5
('Admin Dyadora', 'admin@dyadora.ro', '$2b$10$X...', 'club_admin', NULL),    -- id: 6
('Admin Rogo', 'admin@rogo.ro', '$2b$10$X...', 'club_admin', NULL),          -- id: 7
('Admin Next Gen', 'admin@nextgen.ro', '$2b$10$X...', 'club_admin', NULL),   -- id: 8
('Admin2 Helios', 'admin2@helios.ro', '$2b$10$X...', 'club_admin', NULL),    -- id: 9 (Adăugat din update-ul tău)
('Super Admin', 'admin@test.com', '$2b$10$X...', 'super_admin', NULL);       -- id: 10 (Adăugat contul cu rol maxim)

-- Am integrat admin_id (id-urile corespund cu insertul de deasupra)
INSERT INTO clubs (name, city, opening_hour, closing_hour, night_lighting_hour, admin_id) VALUES 
('Club Helios', 'Timisoara', 8, 23, 19, 9), -- 9 este Admin2 Helios
('CS Dyadora', 'Timisoara', 7, 22, 18, 6),
('Baza Sportiva Politehnica', 'Timisoara', 8, 22, 19, NULL),
('Tenis Club Rogo', 'Timisoara', 8, 22, 19, 7),
('Next Gen', 'Timisoara', 7, 23, 19, 8);

INSERT INTO courts (club_id, name, surface, is_indoor, base_price, night_price_supplement, indoor_price_supplement) VALUES 
(1, 'Central', 'Zgură', FALSE, 60.00, 20.00, 0),
(1, 'Balon 1 (Incalzit)', 'Zgură', TRUE, 50.00, 20.00, 30.00),
(2, 'Teren Hard 1', 'Hard', FALSE, 70.00, 25.00, 0),
(2, 'Hala Indoor', 'Hard', TRUE, 80.00, 25.00, 40.00),
(3, 'Teren Zgura UPT', 'Zgură', FALSE, 40.00, 15.00, 0),
(4, 'Teren 1 Rogo', 'Zgură', FALSE, 50.00, 15.00, 0),
(4, 'Teren 2 Rogo', 'Zgură', FALSE, 50.00, 15.00, 0),
(5, 'Teren Central Next Gen', 'Zgură', FALSE, 60.00, 20.00, 0),
(5, 'Teren Hard Next Gen', 'Hard', FALSE, 65.00, 20.00, 0);

INSERT INTO bookings (court_id, creator_id, booking_date, start_hour, total_price, is_open_match, match_type, status) VALUES 
(1, 1, CURRENT_DATE, 18, 60.00, FALSE, 'Singles', 'active'),
(2, 2, CURRENT_DATE, 19, 100.00, FALSE, 'Singles', 'active'),
(3, 3, CURRENT_DATE, 20, 95.00, TRUE, 'Doubles', 'active'),
(5, 4, CURRENT_DATE, 10, 40.00, FALSE, 'Singles', 'active'),
(6, 1, CURRENT_DATE + INTERVAL '1 day', 17, 65.00, FALSE, 'Singles', 'active'),
(8, 2, CURRENT_DATE + INTERVAL '1 day', 18, 80.00, TRUE, 'Singles', 'active');

INSERT INTO match_players (booking_id, user_id) VALUES 
(3, 2);

INSERT INTO reviews (club_id, user_id, rating, comment) VALUES 
(1, 1, 5, 'Terenurile de zgură sunt excelent întreținute.'),
(1, 2, 4, 'Nocturna este puțin slabă, dar în rest super.'),
(2, 4, 5, 'Cel mai bun hard din Timișoara.'),
(3, 3, 4, 'Prețuri foarte bune pentru studenți.'),
(4, 1, 5, 'Atmosferă super la Rogo.'),
(5, 2, 5, 'Terenurile de la Next Gen sunt impecabile.');


