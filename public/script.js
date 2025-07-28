const SUPABASE_URL = 'https://ibwojujxyymvalwannza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid29qdWp4eXltdmFsd2FubnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MzIxODYsImV4cCI6MjA2NjIwODE4Nn0.THsCEW7MwyTf25wi2NzSR7zLaplf6fNN_fATmcj5C2A';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function toggleMenu() {
    const dropdown = document.getElementById('dropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('visible');
    dropdown.style.maxHeight = dropdown.classList.contains('visible')
        ? dropdown.scrollHeight + 'px'
        : '0';
}

let timer;
let seconds = 0;
let isRunning = false;
let isPaused = false;

function formatTime(s) {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
}

function updateTime() {
    seconds++;
    const uhrDisplay = document.getElementById('uhr');
    if (uhrDisplay) uhrDisplay.innerText = formatTime(seconds);
}

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
        if (session && session.access_token) { 
            headers.Authorization = `Bearer ${session.access_token}`;
        } else {
            console.warn("Keine aktive Supabase Session gefunden. Zeit kann nicht mit Benutzer-ID gespeichert werden.");
            alert('Bitte melden Sie sich an, um Ihre Arbeitszeit zu speichern.');
            seconds = 0;
            document.getElementById('uhr').innerText = '00:00:00';
            const startPauseButton = document.getElementById('startPauseButton');
            const endButton = document.getElementById('endButton');
            if (startPauseButton) startPauseButton.innerText = 'Start';
            if (endButton) endButton.style.display = 'none';
            if (kategorieSelect) kategorieSelect.value = 'arbeit';
            return; 
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
    seconds = 0;
    document.getElementById('uhr').innerText = '00:00:00';
    const startPauseButton = document.getElementById('startPauseButton');
    const endButton = document.getElementById('endButton');
    if (startPauseButton) startPauseButton.innerText = 'Start';
    if (endButton) endButton.style.display = 'none';
    if (kategorieSelect) kategorieSelect.value = 'arbeit';
}

async function loadTimeEntries(filter = 'all') {
    const list = document.getElementById('timeEntriesList');
    if (!list) return;
    list.innerHTML = '<li>Lade Daten…</li>';
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const headers = {};
        if (session && session.access_token) { 
            headers.Authorization = `Bearer ${session.access_token}`;
        } else {
            console.log('Keine aktive Supabase Session. Laden der Zeiten wird eingeschränkt.');
            list.innerHTML = '<li>Bitte melden Sie sich an, um Ihre Zeiten zu sehen.</li>';
            return; 
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
                const date = new Date(e.timestamp).toLocaleString('de-DE', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric' });
                return `<li><span>${e.category}</span> <span>${formatTime(e.duration_seconds)}</span> <span>${date}</span></li>`;
              }).join('')
            : '<li>Keine Einträge gefunden.</li>';
    } catch (err) {
        console.error('Lade-Fehler:', err);
        list.innerHTML = `<li>Fehler beim Laden: ${err.message}</li>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            const { error } = await supabaseClient.auth.signOut();
            if (error) return alert('Logout fehlgeschlagen: ' + error.message);
            window.location.href = '/index.html';
        });
    }

    const timeFilterSelect = document.getElementById('timeFilter');
    if (timeFilterSelect) {
        timeFilterSelect.addEventListener('change', () => loadTimeEntries(timeFilterSelect.value));
    }

    if (document.getElementById('timeEntriesList')) {
        loadTimeEntries(timeFilterSelect?.value || 'all');
    }
});
