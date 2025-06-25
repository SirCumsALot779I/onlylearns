// api/save-time.js
const { createClient } = require('@supabase/supabase-js');

// Supabase-Konfiguration aus Umgebungsvariablen
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Wir brauchen den Anon Key, um den Client mit User-Token zu initialisieren

module.exports = async (req, res) => {
    // Nur POST-Anfragen zulassen
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // CORS für lokale Entwicklung oder spezifische Domains (Vercel handhabt das oft automatisch)
    res.setHeader('Access-Control-Allow-Origin', '*'); // Erlaube alle Ursprünge für Entwicklung
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Authorization-Header hinzufügen!

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { category, durationSeconds } = req.body;
        const authHeader = req.headers.authorization;

        if (!category || typeof durationSeconds === 'undefined') {
            return res.status(400).json({ error: 'Kategorie und Dauer sind erforderlich.' });
        }

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Autorisierungstoken fehlt oder ist ungültig.' });
        }

        const accessToken = authHeader.split(' ')[1];

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

        // Benutzerinformationen aus dem Token abrufen
        const { data: { user }, error: userError } = await userSupabase.auth.getUser();

        if (userError || !user) {
            console.error('Fehler beim Abrufen des Benutzers aus dem Token (save-time):', userError?.message);
            return res.status(401).json({ error: 'Ungültiger oder abgelaufener Autorisierungstoken.' });
        }

        const userId = user.id; // Die ID des angemeldeten Benutzers

        const { data, error } = await userSupabase // Verwende den userSupabase Client!
            .from('time_entries') // Ersetze 'time_entries' mit deinem tatsächlichen Tabellennamen
            .insert([
                {
                    // <-- Hier die user_id hinzufügen!
                    category: category,
                    duration_seconds: durationSeconds,
                    timestamp: new Date().toISOString(), // Datumsformat für PostgreSQL
                    user_id: userId
                }
            ])
            .select(); // Fügt .select() hinzu, um die eingefügten Daten zurückzuerhalten

        if (error) {
            console.error('Supabase Insert Error (save-time):', error);
            return res.status(500).json({ error: 'Fehler beim Speichern der Daten in Supabase.', details: error.message });
        }

        res.status(201).json({ message: 'Daten erfolgreich gespeichert!', data: data });

    } catch (error) {
        console.error('API Error (save-time):', error);
        res.status(500).json({ error: 'Interner Serverfehler.', details: error.message });
    }
};