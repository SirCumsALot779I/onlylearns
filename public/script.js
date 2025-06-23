// public/script.js

// Supabase Client Initialisierung
// !!! WICHTIG: Ersetze diese Platzhalter durch deine tatsächlichen Supabase URL und ANON KEY !!!
// Diese Werte müssen exakt denen in auth.js und den Head-Skripten deiner geschützten Seiten entsprechen.
const SUPABASE_URL = 'https://ibwojujxyymvalwannza.supabase.co'; // Beispiel: 'https://abcde12345.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid29qdWp4eXltdmFsd2FubnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MzIxODYsImV4cCI6MjA2NjIwODE4Nn0.THsCEW7MwyTf25wi2NzSR7zLaplf6fNN_fATmcj5C2A'; // Beispiel: 'eyJhbGciOiJIUzI1Ni...'
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// Hamburgermenü-Logik
function toggleMenu() {
    const dropdown = document.getElementById('dropdown');
    dropdown.classList.toggle('visible');

    if (dropdown.classList.contains('visible')) {
        dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
    } else {
        dropdown.style.maxHeight = '0';
    }
}

// Timer-Mechanik
let timer;
let seconds = 0;
let isRunning = false;
let isPaused = false;

// DOM-Elemente abrufen
const startPauseButton = document.getElementById('startPauseButton');
const endButton = document.getElementById('endButton');
const uhrDisplay = document.getElementById('uhr');
const kategorieSelect = document.getElementById('kategorie');
const timeEntriesList = document.getElementById('timeEntriesList');

// NEU: Referenz zum Filter-Dropdown
const timeFilterSelect = document.getElementById('timeFilter');

// Funktion zum Formatieren der Zeit
function formatTime(s) {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
}

// Funktion zum Aktualisieren der Zeitanzeige
function updateTime() {
    seconds++;
    uhrDisplay.innerText = formatTime(seconds);
}

// Funktion zum Starten oder Pausieren des Timers
function startPauseTimer() {
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
        isPaused = true;
        startPauseButton.innerText = "Fortfahren";
    } else {
        timer = setInterval(updateTime, 1000);
        isRunning = true;
        isPaused = false;
        startPauseButton.innerText = "Pause";
        endButton.style.display = 'inline-block';
    }
}

// Funktion zum Beenden des Timers und Vorbereiten der Speicherung
async function endTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = false;

    const selectedCategory = kategorieSelect.value;
    const timeSpentSeconds = seconds;
    const formattedTime = formatTime(seconds);

    console.log(`Timer beendet!`);
    console.log(`Kategorie: ${selectedCategory}`);
    console.log(`Verbrachte Zeit (Sekunden): ${timeSpentSeconds}`);
    console.log(`Verbrachte Zeit (formatiert): ${formattedTime}`);

    try {
        // Option A: Füge hier das Supabase JWT zum Header hinzu,
        // wenn du möchtest, dass deine /api/save-time Funktion den angemeldeten Benutzer kennt.
        // Das ist der empfohlene Weg für Backend-Zugriffskontrolle basierend auf dem Benutzer.
        const { data: { session } } = await supabaseClient.auth.getSession();
        let headers = {
            'Content-Type': 'application/json',
        };
        if (session) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch('/api/save-time', {
            method: 'POST',
            headers: headers, // Verwende die aktualisierten Header
            body: JSON.stringify({
                category: selectedCategory,
                durationSeconds: timeSpentSeconds,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Daten erfolgreich gespeichert:', data);
            alert('Herlichen Glückwunsch, FWEITER SO DU FAULE RATTE!');
            loadTimeEntries(timeFilterSelect.value);
        } else {
            const errorText = await response.text();
            console.error('Fehler beim Speichern der Daten:', response.status, errorText);
            alert('Fehler beim Speichern der Zeit.');
        }
    } catch (error) {
        console.error('Netzwerkfehler beim Senden der Daten:', error);
        alert('Netzwerkfehler beim Speichern der Zeit.');
    }

    // Timer und Buttons in den Ausgangszustand zurücksetzen
    seconds = 0;
    uhrDisplay.innerText = "00:00:00";
    startPauseButton.innerText = "Start";
    startPauseButton.style.display = 'inline-block';
    endButton.style.display = 'none';
    kategorieSelect.value = "arbeit";
}

// NEUE FUNKTION: Daten aus dem Backend laden und anzeigen - mit Filterparameter
async function loadTimeEntries(filter = 'all') {
    timeEntriesList.innerHTML = '<li>Lade Daten...</li>';
    try {
        // Option B: Füge hier das Supabase JWT zum Header hinzu,
        // wenn du möchtest, dass deine /api/get-time-entries Funktion den angemeldeten Benutzer kennt.
        const { data: { session } } = await supabaseClient.auth.getSession();
        let headers = {};
        if (session) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const url = `/api/get-time-entries?filter=${filter}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: headers, // Verwende die aktualisierten Header
        });
        if (response.ok) {
            const entries = await response.json();
            timeEntriesList.innerHTML = '';

            if (entries.length === 0) {
                timeEntriesList.innerHTML = '<li>Noch keine Einträge vorhanden, oder keine für diesen Filter.</li>';
                return;
            }

            entries.forEach(entry => {
                const listItem = document.createElement('li');
                const date = new Date(entry.timestamp);
                const formattedDate = date.toLocaleDateString('de-DE', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                });

                listItem.innerHTML = `
                    <span class="category">${entry.category}</span>
                    <span class="duration">${formatTime(entry.duration_seconds)}</span>
                    <span class="timestamp">${formattedDate}</span>
                `;
                timeEntriesList.appendChild(listItem);
            });
        } else {
            const errorText = await response.text();
            timeEntriesList.innerHTML = `<li>Fehler beim Laden der Daten: ${response.status} - ${errorText}</li>`;
            console.error('Fehler beim Laden der Daten:', response.status, errorText);
        }
    } catch (error) {
        timeEntriesList.innerHTML = `<li>Netzwerkfehler beim Laden der Daten.</li>`;
        console.error('Netzwerkfehler beim Laden der Daten:', error);
    }
}

// NEU: Event-Listener für das Filter-Dropdown
timeFilterSelect.addEventListener('change', () => {
    loadTimeEntries(timeFilterSelect.value);
});


// Beim Laden der Seite die gespeicherten Zeiten anzeigen (Initialaufruf mit Standardfilter 'all')
document.addEventListener('DOMContentLoaded', () => {
    loadTimeEntries('all'); // Ruft loadTimeEntries beim Laden der Seite auf, initial 'Alle'

    // NEU: Logout-Button Event-Listener
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            const { error } = await supabaseClient.auth.signOut();

            if (error) {
                console.error('Logout Error:', error);
                alert('Fehler beim Abmelden: ' + error.message);
            } else {
                console.log('Erfolgreich abgemeldet.');
                alert('Du wurdest abgemeldet!');
                // Nach erfolgreichem Logout zur Anmeldeseite weiterleiten
                window.location.href = '/auth.html';
            }
        });
    }
});