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

//zum Formatieren der Zeit
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
    messagesContainer.scrollTop = messagesContainer.scrollHeight; 
}

async function loadMessages() {
    if (!currentUserId || !selectedPartnerId) {
        messagesContainer.innerHTML = `<div class="no-messages-placeholder">Wählen Sie einen Chatpartner, um Nachrichten anzuzeigen.</div>`;
        return;
    }

    try {
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

        messagesContainer.innerHTML = ''; 
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

        messageInput.value = ''; 
    } catch (error) {
        console.error('Fehler beim Senden der Nachricht:', error.message);
        showStatusMessage('Fehler beim Senden der Nachricht: ' + error.message, true);
    }
}

// Event-Listener für Senden-Button und Enter-Taste
sendMessageButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); 
        sendMessage();
    }
});


// Chatpartner laden
async function loadChatPartners() {
    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    chatPartnersList.innerHTML = '<li>Lade Chatpartner...</li>';

    try {
        // DEBUG START: Temporär entfernt, um sicherzustellen, dass der fetch-Aufruf immer ausgeführt wird
        const { data: { user, session } } = await supabaseClient.auth.getSession();

        // Temporäre user.id Zuweisung für Debug-Zwecke
        if (!user) {
             console.warn("User not logged in. Using a dummy ID for debugging. Please log in for full functionality.");
             currentUserId = "dummy-user-id-for-debug-123"; 
        } else {
             currentUserId = user.id;
        }

        let authToken = session?.access_token;
        if (!authToken) {
            console.warn("No access token found. The backend API call will likely fail with 401 Unauthorized.");
            authToken = 'debug_no_token'; 
        }
        // DEBUG ENDE

        const res = await fetch('/api/get-all-profiles', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        // DEBUG START: Verbessertes Error Handling für den API-Aufruf
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`API response was not OK: Status ${res.status}, Message: ${errorText}`);
            throw new Error(`Fehler beim Laden der Profile: ${errorText} (Status: ${res.status})`);
        }
        // DEBUG ENDE

        const profiles = await res.json();

        // DEBUG START
        console.log("Received profiles data:", profiles);
        // DEBUG END

        chatPartnersList.innerHTML = '';

        // DEBUG START: Add a check if profiles is an array before filtering
        if (!Array.isArray(profiles)) {
            console.error("Profiles data is not an array:", profiles);
            errorMessage.innerHTML = `<p>Fehler: Unerwartetes Datenformat vom Server. Konnte Chatpartner nicht laden.</p>`;
            errorMessage.style.display = 'block';
            return; 
        }
        // DEBUG END

        const otherProfiles = profiles.filter(p => p.id !== currentUserId);

        if (otherProfiles.length === 0) {
            chatPartnersList.innerHTML = '<li>Keine anderen Chatpartner gefunden.</li>';
        } else {
            otherProfiles.forEach(profile => {
                const li = document.createElement('li');
                li.textContent = profile.username || profile.id; 
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


function selectChatPartner(partnerId, partnerName) {
    document.querySelectorAll('#chatPartnersList li').forEach(li => {
        li.classList.remove('selected');
    });

    const selectedLi = document.querySelector(`#chatPartnersList li[data-partner-id="${partnerId}"]`);
    if (selectedLi) {
        selectedLi.classList.add('selected');
    }

    selectedPartnerId = partnerId;
    selectedPartnerName = partnerName;
    chatHeader.textContent = `Chat mit ${selectedPartnerName}`;
    messageInput.disabled = false;
    sendMessageButton.disabled = false;
    
    loadMessages();
    subscribeToMessages(); 
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
            filter: `(sender_id=eq.${selectedPartnerId},receiver_id=eq.${currentUserId})` // Nachrichten an mich
        }, async (payload) => {
            console.log('Realtime-Nachricht empfangen (von Partner):', payload.new);
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
            filter: `(sender_id=eq.${currentUserId},receiver_id=eq.${selectedPartnerId})` // Nachrichten and Person B
        }, async (payload) => {
            console.log('Realtime-Nachricht empfangen (von mir):', payload.new);

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
            }
        });
}

let pollingInterval = null;
function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval); 
    pollingInterval = setInterval(loadMessages, 5000); 
}

document.addEventListener('DOMContentLoaded', async () => {

    // Lade Chatpartner beim Start
    await loadChatPartners(); // Dieser Aufruf wird jetzt immer gemacht
    // DEBUG ENDE
    
});

window.addEventListener('beforeunload', () => {
    if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
    }
});

function showStatusMessage(message, isError = false) {
    const statusMessageElement = document.getElementById('statusMessage'); 
    if (!statusMessageElement) return;

    statusMessageElement.textContent = message;
    statusMessageElement.style.display = 'block';
    statusMessageElement.className = isError ? 'status-message error' : 'status-message success'; 

    setTimeout(() => {
        statusMessageElement.style.display = 'none';
    }, 3000);
}
