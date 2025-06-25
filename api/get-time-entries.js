// api/get-time-entries.js
const { createClient } = require('@supabase/supabase-js');

// Supabase-Konfiguration aus Umgebungsvariablen
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    // Nur GET-Anfragen zulassen
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // CORS für lokale Entwicklung oder spezifische Domains (Vercel handhabt das oft automatisch)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const filter = req.query.filter || 'all'; // Filter aus Query-Parametern lesen

        let query = supabase.from('time_entries').select('*');

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Setze auf den Anfang des heutigen Tages

        let startDate;
        let endDate;

        switch (filter) {
            case 'today':
                startDate = now.toISOString();
                // Add 24 hours to 'now' to get the end of today (exclusive) or 23:59:59.999 for inclusive
                endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
                query = query.gte('timestamp', startDate).lte('timestamp', endDate);
                break;
            case 'yesterday':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now.getTime() - 1);
                endDate.setHours(23, 59, 59, 999);
                query = query.gte('timestamp', startDate.toISOString()).lte('timestamp', endDate.toISOString());
                break;
            case 'last_7_days':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1); // Bis Ende heute
                query = query.gte('timestamp', startDate.toISOString()).lte('timestamp', endDate.toISOString());
                break;
            case 'all':
            default:
                // Keine Filterung
                break;
        }

        query = query.order('timestamp', { ascending: false }); // Nach Zeitstempel absteigend sortieren

        const { data, error } = await query;

        if (error) {
            console.error('Supabase Select Error:', error);
            return res.status(500).json({ error: 'Fehler beim Abrufen der Daten von Supabase.', details: error.message });
        }

        res.status(200).json(data);

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Interner Serverfehler.', details: error.message });
    }
};