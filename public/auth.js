// Initialisiere den Supabase Client
// !!! WICHTIG: Ersetze diese Platzhalter durch deine tatsächlichen Supabase URL und ANON KEY !!!
// Diese sollten in einer realen Anwendung nicht direkt im Code stehen,
// sondern z.B. über Umgebungsvariablen eines Build-Tools eingefügt werden.
// Für dieses Beispiel verwenden wir sie direkt.
const SUPABASE_URL = process.env.SUPABASE_URL; // Beispiel: 'https://abcde12345.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY; // Beispiel: 'eyJhbGciOiJIUzI1Ni...'

const { createClient } = supabase; // Nutzt die globale Supabase-Bibliothek, die über CDN geladen wird

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM-Elemente abrufen
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');

const signupEmailInput = document.getElementById('signupEmail');
const signupPasswordInput = document.getElementById('signupPassword');
const signupConfirmPasswordInput = document.getElementById('signupConfirmPassword');

// Funktion zur Anzeige von Nachrichten (z.B. Erfolgs- oder Fehlermeldungen)
function showMessage(message, type = 'info') {
    // Hier kannst du ein Element auf der Seite aktualisieren, um Nachrichten anzuzeigen
    // Zum Beispiel: Ein div mit der ID 'message-area'
    // const messageArea = document.getElementById('message-area');
    // if (messageArea) {
    //     messageArea.textContent = message;
    //     messageArea.className = `message ${type}`; // Für Styling (message info, message error)
    // }
    alert(message); // Für den Anfang verwenden wir alert
}

// Event Listener für das Login-Formular
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Verhindert das Neuladen der Seite

        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error('Login Error:', error);
                showMessage(`Login fehlgeschlagen: ${error.message}`, 'error');
            } else {
                console.log('Login erfolgreich:', data);
                showMessage('Login erfolgreich!', 'success');
                // Weiterleitung zur Hauptanwendung oder Dashboard
                window.location.href = '/timer.html'; // Oder '/' wenn index.html der Standard ist
            }
        } catch (err) {
            console.error('Netzwerkfehler beim Login:', err);
            showMessage('Netzwerkfehler. Bitte versuchen Sie es später erneut.', 'error');
        }
    });
}

// Event Listener für das Registrierungs-Formular
if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Verhindert das Neuladen der Seite

        const email = signupEmailInput.value;
        const password = signupPasswordInput.value;
        const confirmPassword = signupConfirmPasswordInput.value;

        if (password !== confirmPassword) {
            showMessage('Passwörter stimmen nicht überein!', 'error');
            return;
        }

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            });

            if (error) {
                console.error('Signup Error:', error);
                showMessage(`Registrierung fehlgeschlagen: ${error.message}`, 'error');
            } else {
                console.log('Registrierung erfolgreich:', data);
                showMessage('Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Bestätigung.', 'success');
                // Optional: Benutzer nach Registrierung direkt einloggen oder zur Login-Formular wechseln lassen
                // window.location.href = '/timer.html';
            }
        } catch (err) {
            console.error('Netzwerkfehler bei der Registrierung:', err);
            showMessage('Netzwerkfehler. Bitte versuchen Sie es später erneut.', 'error');
        }
    });
}

// Optional: Überprüfen, ob der Benutzer bereits angemeldet ist (beim Laden der Seite)
async function checkAuthStatus() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        console.log('Benutzer ist angemeldet:', user);
        // Beispiel: Weiterleitung zur Hauptseite, wenn angemeldet
        // window.location.href = '/timer.html';
    } else {
        console.log('Kein Benutzer angemeldet.');
    }
}

// checkAuthStatus(); // Deaktiviere dies vorerst, da wir das Auth-Formular anzeigen wollen