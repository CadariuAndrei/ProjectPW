# CourtReserve Web 

Platformă Full-Stack (MVP) pentru rezervarea terenurilor de tenis, gestionarea cluburilor sportive și matchmaking între jucători amatori. 

Acest proiect a fost dezvoltat pentru a digitaliza și simplifica procesul de găsire a unui teren disponibil, conectând totodată jucătorii de tenis din același oraș prin funcționalitatea de meciuri deschise.

## Funcționalități Principale

### 1. Sistem de Rezervări Interactiv
* **Matrice Orară:** Interfață vizuală intuitivă unde utilizatorii pot vedea instantaneu sloturile libere și cele ocupate pentru fiecare teren.
* **Filtrare Avansată:** Căutare rapidă a cluburilor după nume, oraș și tipul suprafeței (ex: exclusiv Indoor/Balon).
* **Prevenirea Dublei Rezervări:** Validări pe backend pentru a asigura că un interval orar nu poate fi rezervat de două persoane simultan.

### 2. Matchmaking ("Caut Partener")
* **Meciuri Deschise:** La crearea unei rezervări, jucătorul poate bifa opțiunea de a transforma meciul într-unul "Open" (pentru Simplu sau Dublu).
* **Join / Leave:** Alți jucători pot vizualiza detaliile meciului (inclusiv nivelul de experiență NTRP) și se pot alătura sau retrage printr-un singur click.

### 3. Role-Based Access Control (RBAC) & Gestiune (CRUD)
* **Autentificare Securizată:** Sesiuni bazate pe JSON Web Tokens (JWT) și parole criptate cu Bcrypt.
* **Rol de Jucător (`player`):** Poate face rezervări, se poate alătura meciurilor, își vede istoricul și poate lăsa recenzii (1-5 stele) cluburilor.
* **Rol de Administrator (`club_admin`):** Acces la un **Admin Dashboard** dedicat, unde managerii cluburilor pot vedea în timp real toate rezervările active și anulate pentru propriile terenuri.
* **Rol de Super Administrator (`super_admin`):** Acces la un **Panou de Sistem** pentru managementul general al platformei. Permite operațiuni de tip CRUD (Create, Read, Update, Delete) pentru a adăuga, edita sau șterge cluburi sportive partenere din baza de date.

## Tehnologii

* **Frontend:** React.js, Tailwind CSS, React Router, React Hot Toast
* **Backend:** Node.js, Express.js, JWT, Bcrypt
* **Bază de Date:** PostgreSQL
* **Infrastructură:** Docker & Docker Compose (Containerizare completă a întregului mediu)
