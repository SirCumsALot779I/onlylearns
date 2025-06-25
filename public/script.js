// public/script.js

// Supabase Client Initialisierung
// !!! WICHTIG: Ersetze diese Platzhalter durch deine tatsächlichen Supabase URL und ANON KEY !!!
// Diese Werte müssen exakt denen in auth.js und den Head-Skripten deiner geschützten Seiten entsprechen.
const SUPABASE_URL = 'https://ibwojujxyymvalwannza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid29qdWp4eXltdmFsd2FubnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MzIxODYsImV4cCI6MjA2NjIwODE4Nn0.THsCEW7MwyTf25wi2NzSR7zLaplf6fNN_fATmcj5C2A';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hamburger-Menü-Logik (wird via onclick="toggleMenu()" in HTML getriggert)
function toggleMenu() {
    const dropdown = document.getElementById('dropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('visible');
    dropdown.style.maxHeight = dropdown.classList.contains('visible')
        ? dropdown.scrollHeight + 'px'
        : '0';
}

// Timer-Variablen
let timer;
let seconds = 0;
let isRunning = false;
let isPaused = false;

// Funktion zum Formatieren der Zeit
function formatTime(s) {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
}

// Aktualisiert die Anzeige jede Sekunde
function updateTime() {
    seconds++;
    const uhrDisplay = document.getElementById('uhr');
    if (uhrDisplay) uhrDisplay.innerText = formatTime(seconds);
}

// Start/Pause-Logik
function startPauseTimer() {
    const startPauseButton = document.getElementById('startPauseButton');
    const endButton = document.getElementById('endButton');
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
        isPaused = true;
        if (startPauseButton) startPauseButton.innerText = 'Fortfahren';
    } else {
        timer = setInterval(updateTime, 1000);
        isRunning = true;
        isPaused = false;
        if (startPauseButton) startPauseButton.innerText = 'Pause';
        if (endButton) endButton.style.display = 'inline-block';
    }
}

// Timer beenden und speichern
async function endTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = false;
    const kategorieSelect = document.getElementById('kategorie');
    const selectedCategory = kategorieSelect?.value || 'arbeit';
    const timeSpentSeconds = seconds;
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const headers = { 'Content-Type': 'application/json' };
        if (session && session.access_token) { // Prüfen, ob Session und Token vorhanden sind
            headers.Authorization = `Bearer ${session.access_token}`;
        } else {
            console.warn("Keine aktive Supabase Session gefunden. Zeit kann nicht mit Benutzer-ID gespeichert werden.");
            alert('Bitte melden Sie sich an, um Ihre Arbeitszeit zu speichern.');
            // Optional: Hier könnte man auch zur Login-Seite umleiten
            // window.location.href = '/index.html';
            // Reset und return, da wir nicht speichern können
            seconds = 0;
            document.getElementById('uhr').innerText = '00:00:00';
            const startPauseButton = document.getElementById('startPauseButton');
            const endButton = document.getElementById('endButton');
            if (startPauseButton) startPauseButton.innerText = 'Start';
            if (endButton) endButton.style.display = 'none';
            if (kategorieSelect) kategorieSelect.value = 'arbeit';
            return; // Beende die Funktion hier
        }

        const response = await fetch('/api/save-time', {
            method: 'POST',
            headers,
            body: JSON.stringify({ category: selectedCategory, durationSeconds: timeSpentSeconds })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Speicher-Fehler Response:', errorText);
            throw new Error(errorText);
        }

        alert('Zeit erfolgreich gespeichert! 🎉');
        loadTimeEntries(document.getElementById('timeFilter')?.value || 'all');
    } catch (err) {
        console.error('Speicher-Fehler:', err);
        alert('Fehler beim Speichern der Zeit: ' + (err.message || 'Unbekannter Fehler.'));
    }
    // Reset (wird nur ausgeführt, wenn keine "return" von oben erfolgte oder Fehler nicht gravierend genug war)
    seconds = 0;
    document.getElementById('uhr').innerText = '00:00:00';
    const startPauseButton = document.getElementById('startPauseButton');
    const endButton = document.getElementById('endButton');
    if (startPauseButton) startPauseButton.innerText = 'Start';
    if (endButton) endButton.style.display = 'none';
    if (kategorieSelect) kategorieSelect.value = 'arbeit';
}

// Einträge laden
async function loadTimeEntries(filter = 'all') {
    const list = document.getElementById('timeEntriesList');
    if (!list) return;
    list.innerHTML = '<li>Lade Daten…</li>';
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const headers = {};
        if (session && session.access_token) { // Prüfen, ob Session und Token vorhanden sind
            headers.Authorization = `Bearer ${session.access_token}`;
        } else {
            console.log('Keine aktive Supabase Session. Laden der Zeiten wird eingeschränkt.');
            list.innerHTML = '<li>Bitte melden Sie sich an, um Ihre Zeiten zu sehen.</li>';
            return; // Beende die Funktion, wenn kein Token vorhanden ist
        }

        const res = await fetch(`/api/get-time-entries?filter=${filter}`, { headers });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Lade-Fehler Response:', errorText);
            throw new Error(errorText);
        }
        const entries = await res.json();
        list.innerHTML = entries.length
            ? entries.map(e => {
                // `timestamptz` wird von `new Date()` korrekt geparst
                const date = new Date(e.timestamp).toLocaleString('de-DE', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric' });
                return `<li><span>${e.category}</span> <span>${formatTime(e.duration_seconds)}</span> <span>${date}</span></li>`;
              }).join('')
            : '<li>Keine Einträge gefunden.</li>';
    } catch (err) {
        console.error('Lade-Fehler:', err);
        list.innerHTML = `<li>Fehler beim Laden: ${err.message}</li>`;
    }
}

// Alles, was beim Seiten-Load direkt ausgeführt werden soll
document.addEventListener('DOMContentLoaded', () => {
    // Logout-Button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            const { error } = await supabaseClient.auth.signOut();
            if (error) return alert('Logout fehlgeschlagen: ' + error.message);
            window.location.href = '/index.html';
        });
    }

    // Filter-Dropdown
    const timeFilterSelect = document.getElementById('timeFilter');
    if (timeFilterSelect) {
        timeFilterSelect.addEventListener('change', () => loadTimeEntries(timeFilterSelect.value));
    }

    // Initiales Laden der Einträge, falls Liste existiert
    if (document.getElementById('timeEntriesList')) {
        loadTimeEntries(timeFilterSelect?.value || 'all');
    }
});