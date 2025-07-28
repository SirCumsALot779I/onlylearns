const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; 

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); 

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const filter = req.query.filter || 'all'; 
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn('get-time-entries: Autorisierungstoken fehlt oder ist ungültig.'); // Debugging
            return res.status(401).json({ error: 'Autorisierungstoken fehlt oder ist ungültig.' });
        }

        const accessToken = authHeader.split(' ')[1];
        console.log('get-time-entries: Extracted Access Token (first 10 chars):', accessToken.substring(0, 10) + '...'); // Debugging

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
            console.error('get-time-entries: Fehler beim Abrufen des Benutzers aus dem Token:', userError?.message || 'User is null'); // Debugging
            return res.status(401).json({ error: 'Ungültiger oder abgelaufener Autorisierungstoken.' });
        }
        console.log('get-time-entries: User ID obtained:', user.id); // Debugging


        let query = userSupabase.from('time_entries').select('*'); 

        const now = new Date();
        now.setHours(0, 0, 0, 0); 

        let startDate;
        let endDate;

        switch (filter) {
            case 'today':
                startDate = now.toISOString();
                endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(); 
                query = query.gte('timestamp', startDate).lte('timestamp', endDate);
                break;
                // Beginn Gestern
            case 'yesterday':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now.getTime() - 1); 
                endDate.setHours(23, 59, 59, 999);
                query = query.gte('timestamp', startDate.toISOString()).lte('timestamp', endDate.toISOString());
                break;
            case 'last_7_days':
                // Beginn vor 7 Tagen 
                startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); 
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1);
                query = query.gte('timestamp', startDate.toISOString()).lte('timestamp', endDate.toISOString());
                break;
            case 'all':
            default:
                break;
        }

        query = query.order('timestamp', { ascending: false }); // Nach Zeit absteigend sortieren

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
