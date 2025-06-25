// api/save-time.js
const { createClient } = require('@supabase/supabase-js');

// Supabase-Konfiguration aus Umgebungsvariablen
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    // Nur POST-Anfragen zulassen
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // CORS für lokale Entwicklung oder spezifische Domains (Vercel handhabt das oft automatisch)
    res.setHeader('Access-Control-Allow-Origin', '*'); // Erlaube alle Ursprünge für Entwicklung
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { category, durationSeconds } = req.body;

        if (!category || typeof durationSeconds === 'undefined') {
            return res.status(400).json({ error: 'Kategorie und Dauer sind erforderlich.' });
        }

        const { data, error } = await supabase
            .from('time_entries')
            .insert([
                { category: category, duration_seconds: durationSeconds }
            ])
            .select(); // Fügt .select() hinzu, um die eingefügten Daten zurückzuerhalten

        if (error) {
            console.error('Supabase Insert Error:', error);
            return res.status(500).json({ error: 'Fehler beim Speichern der Daten in Supabase.', details: error.message });
        }

        res.status(201).json({ message: 'Daten erfolgreich gespeichert!', data: data });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Interner Serverfehler.', details: error.message });
    }
};