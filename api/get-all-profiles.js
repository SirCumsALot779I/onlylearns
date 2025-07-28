const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
        return res.status(500).json({ error: 'Supabase credentials not configured.' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey); 

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
        const { data: profiles, error } = await supabase
            .from('profiles') 
            .select('id, username') 
            .neq('id', user.id); 

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
