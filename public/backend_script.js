// server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); // Für Cross-Origin Anfragen

const app = express();
const port = 3000; // Dies ist der Port, auf dem dein Backend lauscht

// Middleware
app.use(cors()); // Erlaubt Anfragen von anderen Domains/Ports (wichtig für Frontend-Kommunikation)
app.use(express.json()); // Erlaubt das Parsen von JSON-Anfragen im Body

// Datenbank-Initialisierung
const db = new sqlite3.Database('./timer.db', (err) => {
    if (err) {
        console.error('Fehler beim Öffnen der Datenbank:', err.message);
    } else {
        console.log('Verbindung zur SQLite-Datenbank hergestellt.');
        // Tabelle erstellen, falls sie nicht existiert
        db.run(`CREATE TABLE IF NOT EXISTS time_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            duration_seconds INTEGER NOT NULL,
            timestamp TEXT NOT NULL
        )`, (createErr) => {
            if (createErr) {
                console.error('Fehler beim Erstellen der Tabelle:', createErr.message);
            } else {
                console.log('Tabelle "time_entries" existiert oder wurde erstellt.');
            }
        });
    }
});

// POST-Endpunkt zum Speichern der Timer-Daten
app.post('/save-time', (req, res) => {
    const { category, durationSeconds } = req.body;

    if (!category || typeof durationSeconds === 'undefined') {
        return res.status(400).json({ error: 'Kategorie und Dauer sind erforderlich.' });
    }

    const timestamp = new Date().toISOString(); // Aktueller Zeitstempel

    const sql = `INSERT INTO time_entries (category, duration_seconds, timestamp) VALUES (?, ?, ?)`;
    db.run(sql, [category, durationSeconds, timestamp], function(err) {
        if (err) {
            console.error('Fehler beim Speichern der Daten:', err.message);
            res.status(500).json({ error: 'Interner Serverfehler beim Speichern der Daten.' });
        } else {
            console.log(`Eintrag gespeichert: ID ${this.lastID}, Kategorie: ${category}, Dauer: ${durationSeconds}s`);
            res.status(201).json({ message: 'Daten erfolgreich gespeichert!', id: this.lastID });
        }
    });
});

// Optional: GET-Endpunkt, um gespeicherte Daten abzurufen (z.B. für deine Report-Seite)
app.get('/get-time-entries', (req, res) => {
    db.all("SELECT * FROM time_entries ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) {
            console.error('Fehler beim Abrufen der Daten:', err.message);
            res.status(500).json({ error: 'Interner Serverfehler beim Abrufen der Daten.' });
        } else {
            res.json(rows);
        }
    });
});

// Server starten
app.listen(port, () => {
    console.log(`Backend-Server läuft auf http://localhost:${port}`);
    console.log(`Bereit, Daten zu speichern über POST an http://localhost:${port}/save-time`);
    console.log(`Daten abrufen über GET an http://localhost:${port}/get-time-entries`);
});