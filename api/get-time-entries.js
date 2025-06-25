// api/get-time-entries.js
const { createClient } = require('@supabase/supabase-js');

// Supabase-Konfiguration aus Umgebungsvariablen
// Für RLS-Filterung muss der Client pro Anfrage mit dem Benutzer-Token initialisiert werden.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Wir brauchen den Anon Key, um den Client mit User-Token zu initialisieren

module.exports = async (req, res) => {
    // Nur GET-Anfragen zulassen
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // CORS für lokale Entwicklung oder spezifische Domains (Vercel handhabt das oft automatisch)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Authorization-Header hinzufügen!

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const filter = req.query.filter || 'all'; // Filter aus Query-Parametern lesen
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Wenn kein Token vorhanden ist, keine Daten zurückgeben oder Fehler melden
            console.warn('get-time-entries: Autorisierungstoken fehlt oder ist ungültig.'); // Debugging
            return res.status(401).json({ error: 'Autorisierungstoken fehlt oder ist ungültig.' });
        }

        const accessToken = authHeader.split(' ')[1];
        console.log('get-time-entries: Extracted Access Token (first 10 chars):', accessToken.substring(0, 10) + '...'); // Debugging

        // Neuen Supabase-Client mit dem Benutzer-Access-Token initialisieren
        // Dieser Client respektiert die Row Level Security (RLS) Regeln basierend auf dem Token.
        const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false // Wichtig für Serverless Functions
            },
            global: {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }
        });

        // Überprüfen, ob der Token gültig ist und einen Benutzer hat
        const { data: { user }, error: userError } = await userSupabase.auth.getUser();

        if (userError || !user) {
            console.error('get-time-entries: Fehler beim Abrufen des Benutzers aus dem Token:', userError?.message || 'User is null'); // Debugging
            return res.status(401).json({ error: 'Ungültiger oder abgelaufener Autorisierungstoken.' });
        }
        console.log('get-time-entries: User ID obtained:', user.id); // Debugging


        let query = userSupabase.from('time_entries').select('*'); // RLS filtert automatisch nach user_id

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Setze auf den Anfang des heutigen Tages

        let startDate;
        let endDate;

        switch (filter) {
            case 'today':
                startDate = now.toISOString();
                // Add 24 hours to 'now' to get the end of today (exclusive) or 23:59:59.999 for inclusive
                // Wichtig: Enddatum sollte präzise sein, um nur den aktuellen Tag zu erwischen
                endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(); // Ende des heutigen Tages
                query = query.gte('timestamp', startDate).lte('timestamp', endDate);
                break;
            case 'yesterday':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now.getTime() - 1); // Ende des gestrigen Tages
                endDate.setHours(23, 59, 59, 999);
                query = query.gte('timestamp', startDate.toISOString()).lte('timestamp', endDate.toISOString());
                break;
            case 'last_7_days':
                // Beginn vor 7 Tagen (einschließlich heute)
                startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 Tage zurück + der heutige Tag = 7 Tage
                startDate.setHours(0, 0, 0, 0);
                // Ende des heutigen Tages
                endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1);
                query = query.gte('timestamp', startDate.toISOString()).lte('timestamp', endDate.toISOString());
                break;
            case 'all':
            default:
                // Keine Filterung außer RLS
                break;
        }

        query = query.order('timestamp', { ascending: false }); // Nach Zeitstempel absteigend sortieren

        const { data, error } = await query;

        if (error) {
            console.error('get-time-entries: Supabase Select Error:', error); // Debugging
            return res.status(500).json({ error: 'Fehler beim Abrufen der Daten von Supabase.', details: error.message });
        }

        res.status(200).json(data);

    } catch (error) {
        console.error('get-time-entries: API Error (catch block):', error); // Debugging
        res.status(500).json({ error: 'Interner Serverfehler.', details: error.message });
    }
};