// public/dashboard.js

// Die Supabase Client Initialisierung kommt von script.js, da es global verfügbar ist.
// Stellen Sie sicher, dass script.js vor dashboard.js geladen wird.
// const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // Nicht nötig, wenn script.js es schon macht

// Hilfsfunktion zum Formatieren der Zeit
function formatTime(s) {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
}

// Funktion zum Laden der Dashboard-Daten
async function loadDashboardData() {
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const chartContainer = document.querySelector('.chart-container');
    const topCategoriesList = document.getElementById('topCategoriesList');

    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    chartContainer.style.opacity = '0.5'; // Visuell anzeigen, dass geladen wird
    if (topCategoriesList) topCategoriesList.innerHTML = '<li>Lade Top Kategorien...</li>';


    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session || !session.access_token) {
            errorMessage.innerHTML = '<p>Bitte melden Sie sich an, um das Dashboard zu sehen.</p>';
            errorMessage.style.display = 'block';
            loadingMessage.style.display = 'none';
            chartContainer.style.opacity = '1';
            return;
        }

        const headers = {
            Authorization: `Bearer ${session.access_token}`
        };

        // Rufe ALLE Zeit-Einträge ab (damit wir alle für Top-Kategorien und die letzten 7 Tage filtern können)
        const res = await fetch('/api/get-time-entries', { headers }); // Ihre API gibt jetzt alle Einträge zurück
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Fehler beim Laden der Daten: ${errorText}`);
        }
        const entries = await res.json();

        if (entries.length === 0) {
            loadingMessage.style.display = 'none';
            errorMessage.innerHTML = '<p>Keine Zeit-Einträge gefunden, um das Dashboard zu erstellen.</p>';
            errorMessage.style.display = 'block';
            chartContainer.style.opacity = '1';
            return;
        }

        // --- Daten für das Balkendiagramm (Letzte 7 Tage) ---
        const dailyData = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dailyData[d.toISOString().split('T')[0]] = 0; // Initialisiere mit 0 Sekunden für jeden der letzten 7 Tage
        }

        entries.forEach(entry => {
            const entryDate = new Date(entry.timestamp);
            entryDate.setHours(0, 0, 0, 0); // Nur Datum, ohne Uhrzeit
            const dateString = entryDate.toISOString().split('T')[0];

            if (dailyData.hasOwnProperty(dateString)) {
                dailyData[dateString] += entry.duration_seconds;
            }
        });

        const sortedDates = Object.keys(dailyData).sort(); // Sortiere die Daten chronologisch
        const chartLabels = sortedDates.map(dateStr => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
        });
        const chartData = sortedDates.map(dateStr => dailyData[dateStr] / 3600); // Umwandlung in Stunden für die Darstellung

        renderDailyProductivityChart(chartLabels, chartData);

        // --- Daten für die Top Kategorien (Alle Zeiten) ---
        const categoryTotals = {};
        entries.forEach(entry => {
            const category = entry.category || 'Unbekannt';
            categoryTotals[category] = (categoryTotals[category] || 0) + entry.duration_seconds;
        });

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a) // Absteigend nach Dauer sortieren
            .slice(0, 5); // Top 5 Kategorien anzeigen

        renderTopCategoriesList(sortedCategories);

    } catch (err) {
        console.error('Fehler beim Laden der Dashboard-Daten:', err);
        errorMessage.innerHTML = `<p>Fehler: ${err.message}</p>`;
        errorMessage.style.display = 'block';
    } finally {
        loadingMessage.style.display = 'none';
        chartContainer.style.opacity = '1';
    }
}

// Funktion zum Rendern des Balkendiagramms
let dailyChartInstance = null; // Um die Instanz zu speichern und zu zerstören, falls sie existiert
function renderDailyProductivityChart(labels, data) {
    const ctx = document.getElementById('dailyProductivityChart').getContext('2d');

    // Zerstöre vorherige Instanz, falls vorhanden
    if (dailyChartInstance) {
        dailyChartInstance.destroy();
    }

    dailyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Zeit in Stunden',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Stunden'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Datum'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            // Formatiere die Stunden zurück in HH:MM:SS
                            const totalSeconds = context.raw * 3600;
                            return label + formatTime(totalSeconds);
                        }
                    }
                }
            }
        }
    });
}

// Funktion zum Rendern der Top Kategorien Liste
function renderTopCategoriesList(categories) {
    const topCategoriesList = document.getElementById('topCategoriesList');
    if (!topCategoriesList) return;

    if (categories.length === 0) {
        topCategoriesList.innerHTML = '<li>Keine Kategorien gefunden.</li>';
        return;
    }

    topCategoriesList.innerHTML = categories.map(([category, totalSeconds]) => {
        return `<li><strong>${category}:</strong> ${formatTime(totalSeconds)}</li>`;
    }).join('');
}

// Beim Laden der Seite Dashboard-Daten laden
document.addEventListener('DOMContentLoaded', () => {
    // Initiales Laden der Dashboard-Daten
    loadDashboardData();
});