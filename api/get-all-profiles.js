// api/get-all-profiles.js
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Stellen Sie sicher, dass Ihre Supabase URL und Anon Key hier verfügbar sind
    // Idealerweise über Umgebungsvariablen in einer Produktivumgebung
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Verwenden Sie den Service Role Key für sichere Serverabfragen

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
        return res.status(500).json({ error: 'Supabase credentials not configured.' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey); // Service Role Key verwenden

    // Verifiziere den Benutzer-Token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authorization token required.' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
        console.error("Auth error in /api/get-all-profiles:", userError);
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
    }

    try {
        // Holen Sie alle Profile, außer dem des aktuell angemeldeten Benutzers
        // Stellen Sie sicher, dass Ihre 'profiles'-Tabelle existiert und eine 'username'-Spalte hat
        const { data: profiles, error } = await supabase
            .from('profiles') // Oder 'auth.users', wenn Sie keine 'profiles' Tabelle haben und nur user.id/email nutzen wollen
            .select('id, username') // Wählen Sie die Spalten, die Sie benötigen
            .neq('id', user.id); // Schließe das eigene Profil aus

        if (error) {
            console.error('Error fetching profiles from Supabase:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json(profiles);
    } catch (err) {
        console.error('Server error in /api/get-all-profiles:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
};