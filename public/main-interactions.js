    // Holen des Elements, dessen Text geändert werden soll
    const centerTextElement = document.querySelector('.center-text');

    // Array mit den Texten, die angezeigt werden sollen
    const messages = [
        "Willkommen, fauler sack",
        "solltest du nicht lernen?",
        "ich werte das mal als ein 'ja'",
        "mach nur so weiter dann siehst du bald so aus wie aramis",
        "Das ist ein neuer Text!",     // <--- Füge hier neue Texte hinzu
        "Und noch ein weiterer Text.", // <--- Oder hier
        "Der letzte Text in der Schleife."
    ];

    let currentMessageIndex = 0; // Index des aktuell angezeigten Textes

    // Funktion, die den Text ändert
    function changeCenterText() {
        // Erhöhe den Index und gehe zurück zu 0, wenn das Ende des Arrays erreicht ist
        currentMessageIndex = (currentMessageIndex + 1) % messages.length;

        // Setze den neuen Text
        centerTextElement.textContent = messages[currentMessageIndex];
    }

    // Event Listener für Klicks auf den gesamten Body
    document.body.addEventListener('click', changeCenterText);

    // Optional: Wenn du möchtest, dass der Starttext vom Array kommt
    // centerTextElement.textContent = messages[currentMessageIndex];
    // Aber da er schon im HTML steht, ist das nicht unbedingt nötig, wenn er der erste im Array ist.