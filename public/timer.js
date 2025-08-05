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
    const selectedCategory = kategorieSelect?.value || 'algorithmen';
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
            if (kategorieSelect) kategorieSelect.value = 'algorithmen';
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
        loadTimeEntries();
    } catch (err) {
        console.error('Speicher-Fehler:', err);
        alert('Fehler beim Speichern der Zeit: ' + (err.message || 'Unbekannter Fehler.'));
    } finally {
        seconds = 0;
        document.getElementById('uhr').innerText = '00:00:00';
        const startPauseButton = document.getElementById('startPauseButton');
        const endButton = document.getElementById('endButton');
        if (startPauseButton) startPauseButton.innerText = 'Start';
        if (endButton) endButton.style.display = 'none';
        if (kategorieSelect) kategorieSelect.value = 'algorithmen';
    }
}

function isToday(someDate) {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
}

function isYesterday(someDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return someDate.getDate() === yesterday.getDate() &&
           someDate.getMonth() === yesterday.getMonth() &&
           yesterday.getFullYear() === someDate.getFullYear();
}

function isLast7Days(someDate) {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const entryDateOnly = new Date(someDate.getFullYear(), someDate.getMonth(), someDate.getDate());

    return entryDateOnly >= sevenDaysAgo && entryDateOnly <= today;
}

async function loadTimeEntries() {
    const list = document.getElementById('timeEntriesList');
    if (!list) return;
    list.innerHTML = '<li>Lade Daten…</li>';
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const headers = {};
        if (session && session.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
        } else {
            list.innerHTML = '<li>Bitte melden Sie sich an, um Ihre Zeiten zu sehen.</li>';
            return;
        }

        const res = await fetch(`/api/get-time-entries`, { headers });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Lade-Fehler Response:', errorText);
            throw new Error(errorText);
        }
        const entries = await res.json();

        if (entries.length === 0) {
            list.innerHTML = '<li>Keine Einträge gefunden.</li>';
            return;
        }

        const categorizedTimes = {
            today: { total: 0, entries: [] },
            yesterday: { total: 0, entries: [] },
            last7Days: { total: 0, entries: [] },
            other: { total: 0, entries: [] }
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
            if (isLast7Days(entryDate)) {
                categorizedTimes.last7Days.total += duration;
                categorizedTimes.last7Days.entries.push(e);
            } else {
                categorizedTimes.other.total += duration;
                categorizedTimes.other.entries.push(e);
            }
        });

        let htmlContent = '';
        const selectedFilter = document.getElementById('timeFilter')?.value || 'all';

        const renderCategory = (categoryName, data) => {
            if (data.entries.length === 0) return '';

            let categoryHtml = `
                <h3>${categoryName} - Gesamt: ${formatTime(data.total)}</h3>
                <ul class="time-category-list">
            `;

            data.entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            categoryHtml += data.entries.map(e => {
                const date = new Date(e.timestamp).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
                return `<li><span>${e.category}</span> <span>${formatTime(e.duration_seconds)}</span> <span>${date}</span></li>`;
            }).join('');
            categoryHtml += '</ul>';
            return categoryHtml;
        };

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

document.addEventListener('DOMContentLoaded', () => {
    const timeFilterSelect = document.getElementById('timeFilter');
    if (timeFilterSelect) {
        timeFilterSelect.addEventListener('change', () => loadTimeEntries());
    }
    if (document.getElementById('timeEntriesList')) {
        loadTimeEntries();
    }
});
