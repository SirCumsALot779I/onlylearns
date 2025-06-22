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

// DOM-Elemente abrufen (Einmalige Deklaration)
const startPauseButton = document.getElementById('startPauseButton');
const endButton = document.getElementById('endButton');
const uhrDisplay = document.getElementById('uhr');
const kategorieSelect = document.getElementById('kategorie');
const timeEntriesList = document.getElementById('timeEntriesList'); // Nur hier deklarieren

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
    if (isRunning) { // Timer läuft -> Pausieren
        clearInterval(timer);
        isRunning = false;
        isPaused = true;
        startPauseButton.innerText = "Fortfahren";
    } else { // Timer läuft nicht (entweder gestartet oder pausiert) -> Starten/Fortfahren
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
    const formattedTime = formatTime(seconds); // Für Anzeige/Protokollierung

    console.log(`Timer beendet!`);
    console.log(`Kategorie: ${selectedCategory}`);
    console.log(`Verbrachte Zeit (Sekunden): ${timeSpentSeconds}`);
    console.log(`Verbrachte Zeit (formatiert): ${formattedTime}`);

    try {
        const response = await fetch('http://localhost:3000/save-time', {
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
            loadTimeEntries(); // Daten nach dem Speichern neu laden
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

// Funktion: Daten aus dem Backend laden und anzeigen
async function loadTimeEntries() {
    timeEntriesList.innerHTML = '<li>Lade Daten...</li>';
    try {
        const response = await fetch('http://localhost:3000/get-time-entries');
        if (response.ok) {
            const entries = await response.json();
            timeEntriesList.innerHTML = ''; // Vorherige Einträge löschen

            if (entries.length === 0) {
                timeEntriesList.innerHTML = '<li>Noch keine Einträge vorhanden.</li>';
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

// Beim Laden der Seite die gespeicherten Zeiten anzeigen
document.addEventListener('DOMContentLoaded', loadTimeEntries);