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
const timeFilterSelect = document.getElementById('timeFilter'); // <--- HIER HINZUGEFÜGT

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
        const response = await fetch('/api/save-time', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                category: selectedCategory,
                durationSeconds: timeSpentSeconds,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Daten erfolgreich gespeichert:', data);
            alert('Herlichen Glückwunsch, FWEITER SO DU FAULE RATTE!');
            // NEU: Daten nach dem Speichern mit dem aktuell ausgewählten Filter neu laden
            loadTimeEntries(timeFilterSelect.value); // <--- HIER HINZUGEFÜGT
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
async function loadTimeEntries(filter = 'all') { // <--- filter-Parameter hinzugefügt, 'all' ist Standard
    timeEntriesList.innerHTML = '<li>Lade Daten...</li>';
    try {
        // Füge den Filter als Query-Parameter zur URL hinzu
        const url = `/api/get-time-entries?filter=${filter}`; // <--- HIER HINZUGEFÜGT
        const response = await fetch(url);
        if (response.ok) {
            const entries = await response.json();
            timeEntriesList.innerHTML = ''; // Vorherige Einträge löschen

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
timeFilterSelect.addEventListener('change', () => { // <--- HIER HINZUGEFÜGT
    loadTimeEntries(timeFilterSelect.value); // Lade Daten basierend auf der Auswahl
});


// Beim Laden der Seite die gespeicherten Zeiten anzeigen (Initialaufruf mit Standardfilter 'all')
document.addEventListener('DOMContentLoaded', () => { // <--- HIER HINZUGEFÜGT
    loadTimeEntries('all'); // Ruft loadTimeEntries beim Laden der Seite auf, initial 'Alle'
});