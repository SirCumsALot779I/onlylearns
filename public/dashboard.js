// public/dashboard.js

// Supabase Client Initialisierung sollte von script.js kommen
// const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hilfsfunktion zum Formatieren der Zeit
function formatTime(s) {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
}

// Hilfsfunktion: Prüft, ob ein Datum der heutige Tag ist
function isToday(someDate) {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
}

// Funktion zum Laden der Dashboard-Daten
async function loadDashboardData() {
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const chartContainers = document.querySelectorAll('.chart-container'); // Alle Chart-Container
    const topCategoriesList = document.getElementById('topCategoriesList');

    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    chartContainers.forEach(container => container.style.opacity = '0.5'); // Alle Charts abdunkeln
    if (topCategoriesList) topCategoriesList.innerHTML = '<li>Lade Top Kategorien...</li>';

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session || !session.access_token) {
            errorMessage.innerHTML = '<p>Bitte melden Sie sich an, um das Dashboard zu sehen.</p>';
            errorMessage.style.display = 'block';
            loadingMessage.style.display = 'none';
            chartContainers.forEach(container => container.style.opacity = '1');
            return;
        }

        const headers = {
            Authorization: `Bearer ${session.access_token}`
        };

        const res = await fetch('/api/get-time-entries', { headers });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Fehler beim Laden der Daten: ${errorText}`);
        }
        const entries = await res.json();

        if (entries.length === 0) {
            loadingMessage.style.display = 'none';
            errorMessage.innerHTML = '<p>Keine Zeit-Einträge gefunden, um das Dashboard zu erstellen.</p>';
            errorMessage.style.display = 'block';
            chartContainers.forEach(container => container.style.opacity = '1');
            return;
        }

        // --- Daten für das Balkendiagramm (Produktivität Heute nach Kategorie) ---
        const todayCategoryData = {};
        const todayEntries = entries.filter(entry => isToday(new Date(entry.timestamp)));

        if (todayEntries.length === 0) {
            // Keine Daten für heute, Chart entsprechend anzeigen
            renderTodayCategoryChart([], [], true); // Render mit leeren Daten und Flag für keine Daten
        } else {
            todayEntries.forEach(entry => {
                const category = entry.category || 'Unbekannt';
                todayCategoryData[category] = (todayCategoryData[category] || 0) + entry.duration_seconds;
            });

            const todayLabels = Object.keys(todayCategoryData);
            const todayData = Object.values(todayCategoryData).map(seconds => seconds / 3600); // In Stunden

            renderTodayCategoryChart(todayLabels, todayData);
        }

        // --- Daten für das Balkendiagramm (Letzte 7 Tage) ---
        const dailyProductivityData = {};
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0); // Setze auf Anfang des heutigen Tages

        // Erzeuge Labels für die letzten 7 Tage, beginnend mit heute rückwärts
        const chartLabels = [];
        const chartData = [];
        const dateStringsToProcess = [];

        for (let i = 6; i >= 0; i--) { // Von 6 Tagen zurück bis heute (0)
            const d = new Date(todayDate);
            d.setDate(todayDate.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            dateStringsToProcess.push(dateKey);
            dailyProductivityData[dateKey] = 0; // Initialisiere mit 0 Sekunden
            chartLabels.push(d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }));
        }

        entries.forEach(entry => {
            const entryDate = new Date(entry.timestamp);
            entryDate.setHours(0, 0, 0, 0);
            const dateString = entryDate.toISOString().split('T')[0];

            if (dailyProductivityData.hasOwnProperty(dateString)) {
                dailyProductivityData[dateString] += entry.duration_seconds;
            }
        });

        // Fülle chartData in der gleichen Reihenfolge wie chartLabels
        dateStringsToProcess.forEach(dateKey => {
            chartData.push(dailyProductivityData[dateKey] / 3600); // In Stunden
        });

        renderDailyProductivityChart(chartLabels, chartData);

        // --- Daten für die Top Kategorien (Alle Zeiten) ---
        const categoryTotals = {};
        entries.forEach(entry => {
            const category = entry.category || 'Unbekannt';
            categoryTotals[category] = (categoryTotals[category] || 0) + entry.duration_seconds;
        });

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5); // Top 5 Kategorien anzeigen

        renderTopCategoriesList(sortedCategories);

    } catch (err) {
        console.error('Fehler beim Laden der Dashboard-Daten:', err);
        errorMessage.innerHTML = `<p>Fehler: ${err.message}</p>`;
        errorMessage.style.display = 'block';
    } finally {
        loadingMessage.style.display = 'none';
        chartContainers.forEach(container => container.style.opacity = '1');
    }
}

// Funktion zum Rendern des Heute-Kategorien-Balkendiagramms
let todayCategoryChartInstance = null;
function renderTodayCategoryChart(labels, data, noData = false) {
    const ctx = document.getElementById('todayCategoryChart').getContext('2d');

    if (todayCategoryChartInstance) {
        todayCategoryChartInstance.destroy();
    }

    if (noData) {
        // Zeige eine Meldung anstelle des Diagramms
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Canvas leeren
        ctx.font = '16px Arial';
        ctx.fillStyle = '#6c757d';
        ctx.textAlign = 'center';
        ctx.fillText('Keine Zeit-Einträge für heute gefunden.', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    todayCategoryChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Zeit in Stunden',
                data: data,
                backgroundColor: 'rgba(255, 99, 132, 0.6)', // Eine andere Farbe
                borderColor: 'rgba(255, 99, 132, 1)',
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
                        text: 'Kategorie'
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
                            const totalSeconds = context.raw * 3600;
                            return label + formatTime(totalSeconds);
                        }
                    }
                }
            }
        }
    });
}


// Funktion zum Rendern des Balkendiagramms für die letzten 7 Tage
let dailyProductivityChartInstance = null;
function renderDailyProductivityChart(labels, data) {
    const ctx = document.getElementById('dailyProductivityChart').getContext('2d');

    if (dailyProductivityChartInstance) {
        dailyProductivityChartInstance.destroy();
    }

    dailyProductivityChartInstance = new Chart(ctx, {
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
                            const totalSeconds = context.raw * 3600;
                            return label + formatTime(totalSeconds);
                        }
                    }
                }
            }
        }
    });
}

// Funktion zum Rendern der Top Kategorien Liste (bleibt gleich)
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
    loadDashboardData();
});