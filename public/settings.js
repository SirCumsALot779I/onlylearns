function showStatusMessage(message, isError = false) {
    const statusMessage = document.getElementById('statusMessage');
    if (!statusMessage) return;

    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    statusMessage.className = isError ? 'status-message error' : 'status-message success';
    statusMessage.setAttribute('role', 'alert');
    statusMessage.setAttribute('aria-live', 'assertive');

    setTimeout(() => {
        statusMessage.style.display = 'none';
        statusMessage.removeAttribute('role');
        statusMessage.removeAttribute('aria-live');
    }, 3000);
}

async function loadUserSettings() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        const emailInput = document.getElementById('emailInput');
        if (emailInput) {
            emailInput.value = user.email || '';
            emailInput.disabled = false;
            emailInput.setAttribute('aria-label', 'E-Mail Adresse');
        }

        const userNameInput = document.getElementById('userNameInput');
        if (userNameInput) {
            userNameInput.value = user.user_metadata?.username || '';
            userNameInput.disabled = false;
            userNameInput.setAttribute('aria-label', 'Benutzername');
        }

        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.disabled = false;
            passwordInput.setAttribute('aria-label', 'Neues Passwort');
        }

        document.querySelectorAll('.settings-container button:not(#logoutButton)').forEach(el => {
            el.disabled = false;
        });

    } else {
        document.querySelectorAll('.settings-container input, .settings-container select, .settings-container button:not(#logoutButton)').forEach(el => {
            el.disabled = true;
        });
        showStatusMessage('Bitte melden Sie sich an, um Ihre Einstellungen zu verwalten.', true);
    }
}

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
            case 'email': {
                const emailInput = document.getElementById('emailInput');
                const newEmail = emailInput?.value;
                if (!newEmail || !newEmail.includes('@')) {
                    throw new Error('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
                }
                updateData = { email: newEmail };
                message = 'E-Mail-Adresse geändert. Sie müssen dies eventuell bestätigen.';
                break;
            }
            case 'password': {
                const passwordInput = document.getElementById('passwordInput');
                const newPassword = passwordInput?.value;
                if (!newPassword || newPassword.length < 6) {
                    throw new Error('Das Passwort muss mindestens 6 Zeichen lang sein.');
                }
                updateData = { password: newPassword };
                message = 'Passwort geändert.';
                if (passwordInput) passwordInput.value = '';
                break;
            }
            case 'username': {
                const userNameInput = document.getElementById('userNameInput');
                const newUsername = userNameInput?.value;
                if (!newUsername || newUsername.length < 3) {
                    throw new Error('Der Benutzername muss mindestens 3 Zeichen lang sein.');
                }
                updateData = { data: { username: newUsername } };
                message = 'Benutzername gespeichert.';
                break;
            }
            default:
                message = 'Unbekannte Einstellung.';
                isError = true;
                break;
        }

        let { error } = { error: null };

        if (settingType === 'email' || settingType === 'password') {
            const { error: authError } = await supabaseClient.auth.updateUser(updateData);
            error = authError;
        } else {
            const { error: profileError } = await supabaseClient.auth.updateUser(updateData);
            error = profileError;
        }

        if (error) {
            throw new Error(error.message);
        }
    } catch (err) {
        message = 'Fehler beim Speichern: ' + (err.message || 'Unbekannter Fehler.');
        isError = true;
    }

    showStatusMessage(message, isError);
}

function handleDarkModeButton() {
    alert("Mehr Weiß gibt's nicht, Pech!");
    window.open("https://en.wikipedia.org/wiki/Blue_light_spectrum", "_blank");
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserSettings();

    document.querySelectorAll('.save-button').forEach(button => {
        button.addEventListener('click', () => {
            const settingType = button.dataset.setting;
            saveSetting(settingType);
        });
    });

    const darkModeButton = document.getElementById('darkModeButton');
    if (darkModeButton) {
        darkModeButton.addEventListener('click', handleDarkModeButton);
        darkModeButton.setAttribute('aria-label', 'Dark Mode Info anzeigen');
    }
});
