
    const centerTextElement = document.querySelector('.center-text');

    const messages = [
        "Willkommen, fauler sack",
        "solltest du nicht lernen?",
        "ich werte das mal als ein 'ja'",
        "mach nur so weiter dann siehst du bald so aus wie aramis",
        "überarbeite dich nicht gleich",
        "wenn ich so viel machen würde wie du wär ich auch am schwitzen ahh ne du kommst grad nur vom klo",
        "dein dorf in Clash of Clans wird angegriffen",
        "ja jz hab ich deine aufmerksamkeit, das war klar",
        "du musst schon mit lernen Anfangen um hier irgendwas geschissen zu bekommen",
        "ich seh schon das wird in ein Romeo speedrun (der text is obviously von laura)",
        "uhh Michael hab ich heute schon erwäht wie gut sie aussehen, während sie diese Aufgabe korrigiern!",
        "das ist Text. Ich hab doch auch kein plan was hier noch stehen kann, geh doch bitte einfach lernen du **** ***** ***** ******",
        "Hier könnte ihre Werbung stehen!"
    ];

    let currentMessageIndex = 0; 

    function changeCenterText() {
      
        currentMessageIndex = (currentMessageIndex + 1) % messages.length;

        centerTextElement.textContent = messages[currentMessageIndex];
    }

    document.body.addEventListener('click', changeCenterText);
