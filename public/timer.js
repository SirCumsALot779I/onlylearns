// public/timer.js

// Supabase Client Initialisierung kommt von script.js
// const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Stellen Sie sicher, dass script.js vor timer.js geladen wird, damit supabaseClient verfügbar ist.

// Timer-Variablen
let timer;
let seconds = 0;
let isRunning = false;
let isPaused = false;

// Funktion zum Formatieren der Zeit (HH:MM:SS)
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

// Start/Pause-Logik für den Timer
function startPauseTimer() {
    const startPauseButton = document.getElementById('startPauseButton');
    const endButton = document.getElementById('endButton');
    if (isRunning) {
        // Timer pausieren
        clearInterval(timer);
        isRunning = false;
        isPaused = true;
        if (startPauseButton) startPauseButton.innerText = 'Fortfahren';
    } else {
        // Timer starten oder fortsetzen
        timer = setInterval(updateTime, 1000);
        isRunning = true;
        isPaused = false;
        if (startPauseButton) startPauseButton.innerText = 'Pause';
        if (endButton) endButton.style.display = 'inline-block';
    }
}

// Timer beenden und die Zeit in Supabase speichern
async function endTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = false;
    const kategorieSelect = document.getElementById('kategorie');
    const selectedCategory = kategorieSelect?.value || 'algorithmen'; // Standardwert aktualisiert
    const timeSpentSeconds = seconds;

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const headers = { 'Content-Type': 'application/json' };

        if (session && session.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
        } else {
            console.warn("Keine aktive Supabase Session gefunden. Zeit kann nicht mit Benutzer-ID gespeichert werden.");
            alert('Bitte melden Sie sich an, um Ihre Arbeitszeit zu speichern.');
            // Reset und return, da wir nicht speichern können
            seconds = 0;
            document.getElementById('uhr').innerText = '00:00:00';
            const startPauseButton = document.getElementById('startPauseButton');
            const endButton = document.getElementById('endButton');
            if (startPauseButton) startPauseButton.innerText = 'Start';
            if (endButton) endButton.style.display = 'none';
            if (kategorieSelect) kategorieSelect.value = 'algorithmen'; // Standardwert aktualisiert
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
        // Nach dem Speichern alle Einträge neu laden und neu gruppieren
        loadTimeEntries(); // Ruft loadTimeEntries ohne spezifischen Filter auf
    } catch (err) {
        console.error('Speicher-Fehler:', err);
        alert('Fehler beim Speichern der Zeit: ' + (err.message || 'Unbekannter Fehler.'));
    } finally {
        // Reset (wird immer ausgeführt, egal ob Speichern erfolgreich war oder nicht)
        seconds = 0;
        document.getElementById('uhr').innerText = '00:00:00';
        const startPauseButton = document.getElementById('startPauseButton');
        const endButton = document.getElementById('endButton');
        if (startPauseButton) startPauseButton.innerText = 'Start';
        if (endButton) endButton.style.display = 'none';
        if (kategorieSelect) kategorieSelect.value = 'algorithmen'; // Standardwert aktualisiert
    }
}

// Hilfsfunktion zur Überprüfung des Datums (Heute)
function isToday(someDate) {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
}

// Hilfsfunktion zur Überprüfung des Datums (Gestern)
function isYesterday(someDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return someDate.getDate() === yesterday.getDate() &&
           someDate.getMonth() === yesterday.getMonth() &&
           yesterday.getFullYear() === someDate.getFullYear();
}

// Hilfsfunktion zur Überprüfung des Datums (Letzte 7 Tage, inkl. heute)
function isLast7Days(someDate) {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6); // Heute + 6 Tage zurück = 7 Tage Bereich
    sevenDaysAgo.setHours(0, 0, 0, 0); // Start des Tages vor 7 Tagen

    const entryDateOnly = new Date(someDate.getFullYear(), someDate.getMonth(), someDate.getDate());

    return entryDateOnly >= sevenDaysAgo && entryDateOnly <= today;
}


// Einträge laden und gruppieren
async function loadTimeEntries() { // Filter-Parameter wird hier nicht mehr direkt verwendet
    const list = document.getElementById('timeEntriesList');
    if (!list) return;
    list.innerHTML = '<li>Lade Daten…</li>'; // Anfangsanzeige
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const headers = {};
        if (session && session.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
        } else {
            list.innerHTML = '<li>Bitte melden Sie sich an, um Ihre Zeiten zu sehen.</li>';
            return;
        }

        // NEU: API-Aufruf ohne Filter-Parameter (API gibt jetzt alle Zeiten zurück)
        const res = await fetch(`/api/get-time-entries`, { headers });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Lade-Fehler Response:', errorText);
            throw new Error(errorText);
        }
        const entries = await res.json();

        // Wenn keine Einträge vorhanden sind
        if (entries.length === 0) {
            list.innerHTML = '<li>Keine Einträge gefunden.</li>';
            return;
        }

        // Daten strukturieren und summieren
        const categorizedTimes = {
            today: { total: 0, entries: [] },
            yesterday: { total: 0, entries: [] },
            last7Days: { total: 0, entries: [] },
            other: { total: 0, entries: [] } // Für alle anderen Einträge
        };

        entries.forEach(e => {
            const entryDate = new Date(e.timestamp);
            const duration = e.duration_seconds;

            if (isToday(entryDate)) {
                categorizedTimes.today.total += duration;
                categorizedTimes.today.entries.push(e);
            } else if (isYesterday(entryDate)) {
                categorizedTimes.yesterday.total += duration;
                categorizedTimes.yesterday.entries.push(e);
            }
            // Immer prüfen, ob innerhalb der letzten 7 Tage, auch wenn es heute/gestern ist
            if (isLast7Days(entryDate)) {
                 categorizedTimes.last7Days.total += duration;
                 categorizedTimes.last7Days.entries.push(e); // Alle 7-Tage-Einträge hier sammeln
            } else {
                // Wenn nicht in den letzten 7 Tagen, dann "andere"
                categorizedTimes.other.total += duration;
                categorizedTimes.other.entries.push(e);
            }
        });

        // HTML für die Anzeige generieren
        let htmlContent = '';
        const selectedFilter = document.getElementById('timeFilter')?.value || 'all'; // Aktueller Filter

        // Funktion zum Rendern einer Kategorie
        const renderCategory = (categoryName, data) => {
            if (data.entries.length === 0) return ''; // Keine Einträge für diese Kategorie

            let categoryHtml = `
                <h3>${categoryName} - Gesamt: ${formatTime(data.total)}</h3>
                <ul class="time-category-list">
            `;
            // Sortiere Einträge innerhalb der Kategorie (z.B. nach Zeitstempel absteigend)
            data.entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            categoryHtml += data.entries.map(e => {
                const date = new Date(e.timestamp).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
                return `<li><span>${e.category}</span> <span>${formatTime(e.duration_seconds)}</span> <span>${date}</span></li>`;
              }).join('');
            categoryHtml += '</ul>';
            return categoryHtml;
        };

        // Abhängig vom ausgewählten Filter anzeigen
        switch (selectedFilter) {
            case 'today':
                htmlContent += renderCategory('Heute', categorizedTimes.today);
                break;
            case 'yesterday':
                htmlContent += renderCategory('Gestern', categorizedTimes.yesterday);
                break;
            case 'last_7_days':
                htmlContent += renderCategory('Letzte 7 Tage', categorizedTimes.last7Days);
                break;
            case 'all':
            default:
                // Zeige alle Kategorien
                htmlContent += renderCategory('Heute', categorizedTimes.today);
                htmlContent += renderCategory('Gestern', categorizedTimes.yesterday);

                const last7DaysOnly = { total: 0, entries: [] };
                categorizedTimes.last7Days.entries.forEach(entry => {
                    const entryDate = new Date(entry.timestamp);
                    if (!isToday(entryDate) && !isYesterday(entryDate)) {
                        last7DaysOnly.entries.push(entry);
                        last7DaysOnly.total += entry.duration_seconds;
                    }
                });
                htmlContent += renderCategory('Letzte 7 Tage (exkl. Heute & Gestern)', last7DaysOnly);

                htmlContent += renderCategory('Ältere Einträge', categorizedTimes.other);
                break;
        }

        list.innerHTML = htmlContent;

    } catch (err) {
        console.error('Lade-Fehler:', err);
        list.innerHTML = `<li>Fehler beim Laden: ${err.message}</li>`;
    }
}

// Alles, was beim Seiten-Load direkt ausgeführt werden soll
document.addEventListener('DOMContentLoaded', () => {
    // Filter-Dropdown
    const timeFilterSelect = document.getElementById('timeFilter');
    if (timeFilterSelect) {
        timeFilterSelect.addEventListener('change', () => loadTimeEntries());
    }

    // Initiales Laden der Einträge, falls Liste existiert
    if (document.getElementById('timeEntriesList')) {
        loadTimeEntries();
    }
});
