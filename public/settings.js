// public/settings.js

// Supabase Client Initialisierung kommt von script.js
// const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // Nicht nötig, wenn script.js es schon macht

// Status-Nachrichten anzeigen
function showStatusMessage(message, isError = false) {
    const statusMessage = document.getElementById('statusMessage');
    if (!statusMessage) return;

    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    statusMessage.className = isError ? 'status-message error' : 'status-message success';

    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000); // Nachricht nach 3 Sekunden ausblenden
}

// Einstellungen laden (Platzhalter - in realer App von Supabase User Metadata laden)
async function loadUserSettings() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        // Beispiel: Laden der E-Mail (kommt von Supabase)
        const emailInput = document.getElementById('emailInput');
        if (emailInput) emailInput.value = user.email || '';

        // Beispiel: Laden des Benutzernamens aus user_metadata
        // Annahme: Sie speichern den Benutzernamen in user_metadata bei der Registrierung/Profilaktualisierung
        const userNameInput = document.getElementById('userNameInput');
        if (userNameInput) userNameInput.value = user.user_metadata?.username || '';

    } else {
        // Nicht angemeldet, Felder deaktivieren
        document.querySelectorAll('.settings-container input, .settings-container select, .settings-container button:not(#logoutButton)').forEach(el => {
            el.disabled = true;
        });
        showStatusMessage('Bitte melden Sie sich an, um Ihre Einstellungen zu verwalten.', true);
    }
}

// Einstellungen speichern (Platzhalter - in realer App an Supabase senden)
async function saveSetting(settingType) {
    let message = '';
    let isError = false;

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            showStatusMessage('Sie müssen angemeldet sein, um Einstellungen zu speichern.', true);
            return;
        }

        let updateData = {};

        switch (settingType) {
            case 'email':
                const emailInput = document.getElementById('emailInput');
                const newEmail = emailInput?.value;
                if (!newEmail || !newEmail.includes('@')) {
                    throw new Error('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
                }
                updateData = { email: newEmail }; // Aktualisiert die Haupt-E-Mail des Benutzers
                message = 'E-Mail-Adresse geändert. Sie müssen dies eventuell bestätigen.';
                break;
            case 'password':
                const passwordInput = document.getElementById('passwordInput');
                const newPassword = passwordInput?.value;
                if (!newPassword || newPassword.length < 6) {
                    throw new Error('Das Passwort muss mindestens 6 Zeichen lang sein.');
                }
                updateData = { password: newPassword }; // Aktualisiert das Passwort
                message = 'Passwort geändert.';
                passwordInput.value = ''; // Feld leeren
                break;
            case 'username':
                const userNameInput = document.getElementById('userNameInput');
                const newUsername = userNameInput?.value;
                if (!newUsername || newUsername.length < 3) {
                    throw new Error('Der Benutzername muss mindestens 3 Zeichen lang sein.');
                }
                updateData = { data: { username: newUsername } }; // Aktualisiert user_metadata
                message = 'Benutzername gespeichert.';
                break;
            default:
                message = 'Unbekannte Einstellung.';
                isError = true;
                break;
        }

        let { error } = { error: null }; // Standardwert für error

        if (settingType === 'email' || settingType === 'password') {
            // Diese Aktualisierungen gehen direkt an auth.updateUser
            const { error: authError } = await supabaseClient.auth.updateUser(updateData);
            error = authError;
        } else {
            // Alle anderen Einstellungen (die in user_metadata landen)
            const { error: profileError } = await supabaseClient.auth.updateUser(updateData);
            error = profileError;
        }

        if (error) {
            throw new Error(error.message);
        }

    } catch (err) {
        console.error('Fehler beim Speichern der Einstellung:', err);
        message = 'Fehler beim Speichern: ' + (err.message || 'Unbekannter Fehler.');
        isError = true;
    }

    showStatusMessage(message, isError);
}


// --- Spezielle Funktion für den Dark/White Mode Button (bleibt gleich) ---
function handleDarkModeButton() {
    // Öffne ein Alert-Fenster
    alert("Mehr Weiß gibt's nicht, Pech!");

    // Öffne den Link in einem neuen Tab
    window.open("https://en.wikipedia.org/wiki/Blue_light_spectrum", "_blank");
}


// Beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
    // Initiales Laden der Benutzereinstellungen
    loadUserSettings();

    // Event-Listener für Speichern-Buttons
    document.querySelectorAll('.save-button').forEach(button => {
        button.addEventListener('click', () => {
            const settingType = button.dataset.setting;
            saveSetting(settingType);
        });
    });

    // Event-Listener für den Dark/White Mode Button
    const darkModeButton = document.getElementById('darkModeButton');
    if (darkModeButton) {
        darkModeButton.addEventListener('click', handleDarkModeButton);
    }
});