// public/chat.js

// Supabase Client Initialisierung kommt von script.js
// const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUserId = null;
let selectedPartnerId = null;
let selectedPartnerName = null;
let realtimeChannel = null; // Für Supabase Realtime

const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessageButton');
const chatHeader = document.getElementById('chatHeader');
const chatPartnersList = document.getElementById('chatPartnersList');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');

// Hilfsfunktion zum Formatieren der Zeit
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Nachricht zum Chat-Container hinzufügen
function addMessageToChat(message, isOwnMessage) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    messageElement.classList.add(isOwnMessage ? 'own-message' : 'other-message');

    const senderName = message.sender_profile?.username || 'Unbekannt';
    const receiverName = message.receiver_profile?.username || 'Unbekannt';
    const timestamp = formatTimestamp(message.created_at);

    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${isOwnMessage ? 'Ich' : senderName}</span>
            <span class="message-time">${timestamp}</span>
        </div>
        <div class="message-content">${message.content}</div>
    `;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Zum neuesten scrollen
}

// Nachrichten laden
async function loadMessages() {
    if (!currentUserId || !selectedPartnerId) {
        messagesContainer.innerHTML = `<div class="no-messages-placeholder">Wählen Sie einen Chatpartner, um Nachrichten anzuzeigen.</div>`;
        return;
    }

    try {
        // Nachrichten abrufen, die vom aktuellen Benutzer an den Partner ODER vom Partner an den aktuellen Benutzer gesendet wurden
        const { data, error } = await supabaseClient
            .from('messages')
            .select(`
                *,
                sender_profile:sender_id(username),
                receiver_profile:receiver_id(username)
            `)
            .or(`(sender_id.eq.${currentUserId},receiver_id.eq.${selectedPartnerId}),(sender_id.eq.${selectedPartnerId},receiver_id.eq.${currentUserId})`)
            .order('created_at', { ascending: true });

        if (error) throw error;

        messagesContainer.innerHTML = ''; // Vorherige Nachrichten leeren
        if (data.length === 0) {
            messagesContainer.innerHTML = `<div class="no-messages-placeholder">Noch keine Nachrichten in diesem Chat. Seien Sie der Erste!</div>`;
        } else {
            data.forEach(msg => {
                addMessageToChat(msg, msg.sender_id === currentUserId);
            });
        }
    } catch (error) {
        console.error('Fehler beim Laden der Nachrichten:', error.message);
        messagesContainer.innerHTML = `<div class="error-message">Fehler beim Laden der Nachrichten: ${error.message}</div>`;
    }
}

// Nachricht senden
async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentUserId || !selectedPartnerId) {
        showStatusMessage('Bitte geben Sie eine Nachricht ein und wählen Sie einen Chatpartner.', true);
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('messages')
            .insert({
                sender_id: currentUserId,
                receiver_id: selectedPartnerId,
                content: content
            });

        if (error) throw error;

        messageInput.value = ''; // Eingabefeld leeren
        // Nachricht wird durch Realtime oder Polling hinzugefügt
    } catch (error) {
        console.error('Fehler beim Senden der Nachricht:', error.message);
        showStatusMessage('Fehler beim Senden der Nachricht: ' + error.message, true);
    }
}

// Event-Listener für Senden-Button und Enter-Taste
sendMessageButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Enter drücken sendet, Shift+Enter für Zeilenumbruch
        e.preventDefault(); // Verhindert einen Zeilenumbruch im Textfeld
        sendMessage();
    }
});


// Chatpartner laden
async function loadChatPartners() {
    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    chatPartnersList.innerHTML = '<li>Lade Chatpartner...</li>';

    try {
        // *** WICHTIGE ÄNDERUNG HIER: Holen der Session, die den access_token enthält ***
        const { data: { user, session } } = await supabaseClient.auth.getSession();
        if (!session || !session.access_token) { // Prüfen, ob Session und Token vorhanden sind
            errorMessage.innerHTML = '<p>Bitte melden Sie sich an, um Chatpartner zu sehen.</p>';
            errorMessage.style.display = 'block';
            loadingMessage.style.display = 'none';
            // Deaktiviere auch die Eingabe, falls der Benutzer nicht angemeldet ist
            messageInput.disabled = true;
            sendMessageButton.disabled = true;
            return; // Hier abbrechen, wenn kein Token verfügbar ist
        }
        currentUserId = user.id;

        // API-Aufruf, um alle Profile außer dem eigenen zu erhalten
        // Annahme: Es gibt einen Node.js Endpunkt /api/get-all-profiles
        const res = await fetch('/api/get-all-profiles', {
            headers: {
                'Authorization': `Bearer ${session.access_token}` // HIER wird der Token aus der Session gesendet
            }
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Fehler beim Laden der Profile: ${errorText}`);
        }
        const profiles = await res.json();

        chatPartnersList.innerHTML = '';
        const otherProfiles = profiles.filter(p => p.id !== currentUserId);

        if (otherProfiles.length === 0) {
            chatPartnersList.innerHTML = '<li>Keine anderen Chatpartner gefunden.</li>';
        } else {
            otherProfiles.forEach(profile => {
                const li = document.createElement('li');
                li.textContent = profile.username || profile.id; // Zeige Benutzername oder ID
                li.dataset.partnerId = profile.id;
                li.dataset.partnerName = profile.username;
                li.addEventListener('click', () => selectChatPartner(profile.id, profile.username));
                chatPartnersList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Fehler beim Laden der Chatpartner:', error.message);
        errorMessage.innerHTML = `<p>Fehler beim Laden der Chatpartner: ${error.message}</p>`;
        errorMessage.style.display = 'block';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

// Chatpartner auswählen
function selectChatPartner(partnerId, partnerName) {
    // Entferne 'selected' Klasse von allen
    document.querySelectorAll('#chatPartnersList li').forEach(li => {
        li.classList.remove('selected');
    });

    // Füge 'selected' Klasse zum aktuellen hinzu
    const selectedLi = document.querySelector(`#chatPartnersList li[data-partner-id="${partnerId}"]`);
    if (selectedLi) {
        selectedLi.classList.add('selected');
    }

    selectedPartnerId = partnerId;
    selectedPartnerName = partnerName;
    chatHeader.textContent = `Chat mit ${selectedPartnerName}`;
    messageInput.disabled = false;
    sendMessageButton.disabled = false;

    // Nachrichten laden, wenn Partner ausgewählt ist
    loadMessages();
    subscribeToMessages(); // Realtime-Abonnement aktualisieren
}


// Supabase Realtime-Abonnement
function subscribeToMessages() {
    if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel); // Bestehendes Abonnement beenden
    }

    if (!currentUserId || !selectedPartnerId) return;

    realtimeChannel = supabaseClient.channel(`chat_${currentUserId}_${selectedPartnerId}`);

    // Abonniere neue Nachrichten, die gesendet oder empfangen werden
    realtimeChannel
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `(sender_id=eq.${selectedPartnerId},receiver_id=eq.${currentUserId})` // Nachrichten, die der Partner an mich sendet
        }, async (payload) => {
            console.log('Realtime-Nachricht empfangen (von Partner):', payload.new);
            // Zusätzliche Daten wie Benutzername abrufen
            const { data: sender_profile, error: senderError } = await supabaseClient
                .from('profiles')
                .select('username')
                .eq('id', payload.new.sender_id)
                .single();

            const { data: receiver_profile, error: receiverError } = await supabaseClient
                .from('profiles')
                .select('username')
                .eq('id', payload.new.receiver_id)
                .single();

            payload.new.sender_profile = sender_profile;
            payload.new.receiver_profile = receiver_profile;

            addMessageToChat(payload.new, payload.new.sender_id === currentUserId);
        })
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `(sender_id=eq.${currentUserId},receiver_id=eq.${selectedPartnerId})` // Nachrichten, die ich an den Partner sende
        }, async (payload) => {
            console.log('Realtime-Nachricht empfangen (von mir):', payload.new);
            // Hier brauchen wir die Profile nicht unbedingt, da wir wissen, dass es von uns ist
            // Aber der Vollständigkeit halber, wenn man es für Anzeige braucht
            const { data: sender_profile, error: senderError } = await supabaseClient
                .from('profiles')
                .select('username')
                .eq('id', payload.new.sender_id)
                .single();

            const { data: receiver_profile, error: receiverError } = await supabaseClient
                .from('profiles')
                .select('username')
                .eq('id', payload.new.receiver_id)
                .single();

            payload.new.sender_profile = sender_profile;
            payload.new.receiver_profile = receiver_profile;

            addMessageToChat(payload.new, payload.new.sender_id === currentUserId);
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Realtime-Channel abonniert:', `chat_${currentUserId}_${selectedPartnerId}`);
            } else if (status === 'CHANNEL_ERROR') {
                console.error('Realtime-Channel Fehler. Fällt zurück auf Polling.', realtimeChannel.error);
                // Fallback auf Polling, wenn Realtime fehlschlägt
                // clearInterval(pollingInterval); // Falls ein Polling-Interval läuft, beenden
                // pollingInterval = setInterval(loadMessages, 5000); // Neues Polling starten
            }
        });
}

// Fallback: Polling (alle 5 Sekunden aktualisieren)
let pollingInterval = null;
function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval); // Vorhandenes Interval löschen
    pollingInterval = setInterval(loadMessages, 5000); // Alle 5 Sekunden Nachrichten laden
}
// stopPolling(); // Wenn Realtime funktioniert, Polling stoppen

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', async () => {
    // Stellen Sie sicher, dass der Benutzer angemeldet ist
    // Dies ist eine Redundanzprüfung, die aber schadet nicht, wenn sie hier bleibt.
    // Der wichtigste Check findet jetzt direkt in loadChatPartners statt.
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        errorMessage.innerHTML = '<p>Bitte melden Sie sich an, um den Chat zu nutzen.</p>';
        errorMessage.style.display = 'block';
        messageInput.disabled = true;
        sendMessageButton.disabled = true;
        return;
    }
    currentUserId = user.id;

    // Lade Chatpartner beim Start
    await loadChatPartners();

    // Wenn Realtime nicht genutzt wird, Polling starten
    // startPolling(); // Kommentar entfernen, um Polling zu aktivieren
});

// Bei Seitenwechsel oder Schließen des Tabs Realtime-Kanal aufräumen
window.addEventListener('beforeunload', () => {
    if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
    }
});

// Status-Nachrichten anzeigen (kopiert von settings.js, kann zentralisiert werden)
function showStatusMessage(message, isError = false) {
    const statusMessageElement = document.getElementById('statusMessage'); // Annahme, dass es ein Status-Element gibt
    if (!statusMessageElement) return;

    statusMessageElement.textContent = message;
    statusMessageElement.style.display = 'block';
    statusMessageElement.className = isError ? 'status-message error' : 'status-message success'; // CSS-Klassen für Styling

    setTimeout(() => {
        statusMessageElement.style.display = 'none';
    }, 3000);
}