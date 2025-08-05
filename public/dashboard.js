
function formatTime(s) {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
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

async function loadDashboardData() {
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const chartContainers = document.querySelectorAll('.chart-container');
    const topCategoriesList = document.getElementById('topCategoriesList');
    const categoryTotalTimesList = document.getElementById('categoryTotalTimesList'); 
    const totalTimeAll = document.getElementById('totalTimeAll'); 
    const totalTimeToday = document.getElementById('totalTimeToday'); 
    const totalTimeYesterday = document.getElementById('totalTimeYesterday'); 
    const totalTimeLast7Days = document.getElementById('totalTimeLast7Days'); 


    if (totalTimeAll) totalTimeAll.innerText = 'Lade...';
    if (totalTimeToday) totalTimeToday.innerText = 'Lade...';
    if (totalTimeYesterday) totalTimeYesterday.innerText = 'Lade...';
    if (totalTimeLast7Days) totalTimeLast7Days.innerText = 'Lade...';
    if (topCategoriesList) topCategoriesList.innerHTML = '<li>Lade Top Kategorien...</li>';
    if (categoryTotalTimesList) categoryTotalTimesList.innerHTML = '<li>Lade Kategorienzeiten...</li>';


    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    chartContainers.forEach(container => container.style.opacity = '0.5');

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session || !session.access_token) {
            errorMessage.innerHTML = '<p>Bitte melden Sie sich an, um das Dashboard zu sehen.</p>';
            errorMessage.style.display = 'block';
            loadingMessage.style.display = 'none';
            chartContainers.forEach(container => container.style.opacity = '1');
          
            if (totalTimeAll) totalTimeAll.innerText = 'N/A';
            if (totalTimeToday) totalTimeToday.innerText = 'N/A';
            if (totalTimeYesterday) totalTimeYesterday.innerText = 'N/A';
            if (totalTimeLast7Days) totalTimeLast7Days.innerText = 'N/A';
            if (topCategoriesList) topCategoriesList.innerHTML = '<li>Anmeldung erforderlich.</li>';
            if (categoryTotalTimesList) categoryTotalTimesList.innerHTML = '<li>Anmeldung erforderlich.</li>';
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
            
            if (totalTimeAll) totalTimeAll.innerText = formatTime(0);
            if (totalTimeToday) totalTimeToday.innerText = formatTime(0);
            if (totalTimeYesterday) totalTimeYesterday.innerText = formatTime(0);
            if (totalTimeLast7Days) totalTimeLast7Days.innerText = formatTime(0);
            if (topCategoriesList) topCategoriesList.innerHTML = '<li>Keine Einträge gefunden.</li>';
            if (categoryTotalTimesList) categoryTotalTimesList.innerHTML = '<li>Keine Einträge gefunden.</li>';
            return;
        }

        let totalAllSeconds = 0;
        let totalTodaySeconds = 0;
        let totalYesterdaySeconds = 0;
        let totalLast7DaysSeconds = 0;

        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0); 
        const yesterdayDate = new Date(todayDate);
        yesterdayDate.setDate(todayDate.getDate() - 1); 
        const sevenDaysAgo = new Date(todayDate);
        sevenDaysAgo.setDate(todayDate.getDate() - 6); 

        const todayEntries = [];
        const yesterdayEntries = [];
        const last7DaysEntries = [];
        const allCategoryTotals = {}; 


        entries.forEach(entry => {
            const entryDate = new Date(entry.timestamp);
            const duration = entry.duration_seconds;

            totalAllSeconds += duration; 

            const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());

            if (isToday(entryDate)) {
                totalTodaySeconds += duration;
                todayEntries.push(entry); 
            }
            if (isYesterday(entryDate)) {
                totalYesterdaySeconds += duration;
                yesterdayEntries.push(entry);
            }

            if (entryDateOnly >= sevenDaysAgo && entryDateOnly <= todayDate) {
                 totalLast7DaysSeconds += duration;
                 last7DaysEntries.push(entry); 
            }

            
            const category = entry.category || 'Unbekannt';
            allCategoryTotals[category] = (allCategoryTotals[category] || 0) + duration;
        });

    
        if (totalTimeAll) totalTimeAll.innerText = formatTime(totalAllSeconds);
        if (totalTimeToday) totalTimeToday.innerText = formatTime(totalTodaySeconds);
        if (totalTimeYesterday) totalTimeYesterday.innerText = formatTime(totalYesterdaySeconds);
        if (totalTimeLast7Days) totalTimeLast7Days.innerText = formatTime(totalLast7DaysSeconds);


     
        if (todayEntries.length === 0) {
            renderTodayCategoryChart([], [], true); 
        } else {
            const todayCategoryData = {};
            todayEntries.forEach(entry => {
                const category = entry.category || 'Unbekannt';
                todayCategoryData[category] = (todayCategoryData[category] || 0) + entry.duration_seconds;
            });
            const todayLabels = Object.keys(todayCategoryData);
            const todayData = Object.values(todayCategoryData).map(seconds => seconds / 3600); 
            renderTodayCategoryChart(todayLabels, todayData);
        }

        const dailyProductivityData = {};
        const chartLabels = [];
        const chartData = [];

        for (let i = 6; i >= 0; i--) { 
            const d = new Date(todayDate);
            d.setDate(todayDate.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            dailyProductivityData[dateKey] = 0;
            chartLabels.push(d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }));
        }

     
        last7DaysEntries.forEach(entry => {
            const entryDate = new Date(entry.timestamp);
            entryDate.setHours(0, 0, 0, 0); 
            const dateString = entryDate.toISOString().split('T')[0];
            if (dailyProductivityData.hasOwnProperty(dateString)) {
                dailyProductivityData[dateString] += entry.duration_seconds;
            }
        });

        chartLabels.forEach((label, index) => {
            const dateFromLabel = new Date(todayDate);
            dateFromLabel.setDate(todayDate.getDate() - (6 - index)); 
            const dateKey = dateFromLabel.toISOString().split('T')[0];
            chartData.push(dailyProductivityData[dateKey] / 3600);
        });

        renderDailyProductivityChart(chartLabels, chartData);

        const sortedTopCategories = Object.entries(allCategoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        renderTopCategoriesList(sortedTopCategories);

        const allCategoryTotalsArray = Object.entries(allCategoryTotals)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)); 
        renderCategoryTotalTimesList(allCategoryTotalsArray);


    } catch (err) {
        console.error('Fehler beim Laden der Dashboard-Daten:', err);
        errorMessage.innerHTML = `<p>Fehler: ${err.message}</p>`;
        errorMessage.style.display = 'block';
    } finally {
        loadingMessage.style.display = 'none';
        chartContainers.forEach(container => container.style.opacity = '1');
    }
}

let todayCategoryChartInstance = null;
function renderTodayCategoryChart(labels, data, noData = false) {
    const ctx = document.getElementById('todayCategoryChart').getContext('2d');

    if (todayCategoryChartInstance) {
        todayCategoryChartInstance.destroy();
    }

    if (noData) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#aaa';
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
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
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
                        text: 'Stunden',
                        color: '#f0f0f0'
                    },
                    ticks: {
                        color: '#f0f0f0'
                    },
                    grid: {
                        color: '#333'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Kategorie',
                        color: '#f0f0f0'
                    },
                    ticks: {
                        color: '#f0f0f0'
                    },
                    grid: {
                        color: '#333'
                    }
                }
            },
            plugins: {
                tooltip: {
                    backgroundColor: '#222',
                    titleColor: '#fff',
                    bodyColor: '#ccc',
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
                },
                legend: {
                    labels: {
                        color: '#f0f0f0'
                    }
                }
            }
        }
    });
}


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
                        text: 'Stunden',
                        color: '#f0f0f0'
                    },
                    ticks: {
                        color: '#f0f0f0'
                    },
                    grid: {
                        color: '#333'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Datum',
                        color: '#f0f0f0'
                    },
                    ticks: {
                        color: '#f0f0f0'
                    },
                    grid: {
                        color: '#333'
                    }
                }
            },
            plugins: {
                tooltip: {
                    backgroundColor: '#222',
                    titleColor: '#fff',
                    bodyColor: '#ccc',
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
                },
                legend: {
                    labels: {
                        color: '#f0f0f0'
                    }
                }
            }
        }
    });
}



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

function renderCategoryTotalTimesList(categoryTotals) {
    const categoryTotalTimesList = document.getElementById('categoryTotalTimesList');
    if (!categoryTotalTimesList) return;

    if (categoryTotals.length === 0) {
        categoryTotalTimesList.innerHTML = '<li>Keine Kategorien-Gesamtzeiten gefunden.</li>';
        return;
    }

    categoryTotalTimesList.innerHTML = categoryTotals.map(([category, totalSeconds]) => {
        return `<li><strong>${category}:</strong> ${formatTime(totalSeconds)}</li>`;
    }).join('');
}


document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});
