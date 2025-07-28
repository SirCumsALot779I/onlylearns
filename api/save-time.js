const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; 

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); 

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { category, durationSeconds } = req.body;
        const authHeader = req.headers.authorization;

        console.log('save-time: Request received.'); // Debugging
        console.log('save-time: Request body:', req.body); // Debugging
        console.log('save-time: Authorization header:', authHeader); // Debugging

        if (!category || typeof durationSeconds === 'undefined') {
            console.error('save-time: Missing category or durationSeconds.'); // Debugging
            return res.status(400).json({ error: 'Kategorie und Dauer sind erforderlich.' });
        }

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('save-time: Missing or invalid Authorization header.'); // Debugging
            return res.status(401).json({ error: 'Autorisierungstoken fehlt oder ist ungültig.' });
        }

        const accessToken = authHeader.split(' ')[1];
        console.log('save-time: Extracted Access Token (first 10 chars):', accessToken.substring(0, 10) + '...'); // Debugging

        const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false 
            },
            global: {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }
        });

        const { data: { user }, error: userError } = await userSupabase.auth.getUser();

        if (userError || !user) {
            console.error('save-time: Error getting user from token:', userError?.message || 'User is null'); // Debugging
            return res.status(401).json({ error: 'Ungültiger oder abgelaufener Autorisierungstoken.', details: userError?.message });
        }

        const userId = user.id; 
        console.log('save-time: User ID obtained for insert:', userId); // Debugging

        const { data, error } = await userSupabase 
            .from('time_entries') 
            .insert([
                {
                    user_id: userId, 
                    category: category,
                    duration_seconds: durationSeconds,
                    timestamp: new Date().toISOString() 
                }
            ])
            .select(); 
        if (error) {
            console.error('save-time: Supabase Insert Error:', error); // Debugging
            return res.status(500).json({ error: 'Fehler beim Speichern der Daten in Supabase.', details: error.message });
        }

        res.status(201).json({ message: 'Daten erfolgreich gespeichert!', data: data });

    } catch (error) {
        console.error('save-time: API Error (catch block):', error); // Debugging
        res.status(500).json({ error: 'Interner Serverfehler.', details: error.message });
    }
};
