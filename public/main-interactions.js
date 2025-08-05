    const centerTextElement = document.querySelector('.center-text');

    const messages = [
        "Willkommen, fauler Sack.",
        "Du willst lernen? Fr?",
        "Dann bist du hier ja genau richtig, wow!",
        "Ist gar nicht so schwer sich hier zurechtzufinden...klick mal auf die 3 Striche oben links.",
        "Ja, genau die. Schau dich einfach mal um :)",
        "Noch immer hier? Jetzt wird's aber peinlich...",
        "An deiner Stelle würde ich endlich mal anfangen statt mit einer Schleife zu reden...cringe.",
        "Wenn ich so viel machen würde wie du, wär ich auch am schwitzen...ahh ne du kommst grad nur vom Klo.",
        "DEIN DORF IN CLASH OF CLANS WIRD ANGEGRIFFEN!!!!",
        "Ja, jetzt hab ich deine aufmerksamkeit, war klar.",
        "Du musst schon mit lernen Anfangen um hier irgendwas geschissen zu bekommen",
        "So endest du noch wie Aramis, Romeo und die anderen gefallenen Soldaten.",
        "Uhh Michael hab ich heute schon erwäht wie gut sie aussehen, während sie diese Aufgabe korrigiern! (-Aramis)",
        "das ist Text. Ich hab doch auch kein plan was hier noch stehen kann, geh doch bitte einfach lernen du **** ***** ***** ******",
        "Ich entschuldige mich für meinen Kollegen, das war nicht nett...aber er hat Recht."
        "Hier könnte ihre Werbung stehen!",
        "Ne. jetzt mal ehrlich, hat die Person, die das alles geschrieben hat nichts zu tun? (Doch aber ich prokrstiniere)",
        "Siehst du? Sei nicht so wie der Editor. Ran an die Arbeit, die Uhr tickt.",
        "Denkst du das reicht an Nachrichten?",
        "Ne, paar mehr gehen noch (Ich muss in 4h wieder aufstehen hilfe)",
        "Funfact! Als Edgar Allan Poe irgendwo in seinen 30s war, soll er seine 13 jährige Cousine geheiratet haben.",
        "Sei nicht wie Edgar Allan Poe.",
        "Noch ein Funfact? ehh...",
        "Ah! Wusstest du, dass die Punkte von Walhaien genauso individuell sind wie unsere Fingerabrücke?",
        "So jetzt hab ich aber true crime und Walhaie erwähnt...könnte dir noch mehr über meine Interessen erählen aber geh mal lernen (oder korrigieren :))",
        "Viel Spaß. Dies ist das Ende der Schleife.",
        "HAH, dachtest du.",
        "So einfach wirst du mich nicht los. Bin ein certified Yapper",
        "Du aber anscheinend auch, wenn du dich durch diesen ganzen Dialog rausklickst...vielleicht mal rausgehen und Menschen kennenlernen.",
        "Aber mach du dein Ding :)",
        "...wie zum Beispiel zu lernen...",
        "Jetzt ernsthaft-",
        "Auf geht's...vielleicht führe ich diesen Dialog (wohl eher Monolog) irgendwannmal fort...",
        "Tschüssiiiiiiiiiiii wowowowowowowowowoowowowowowowow (es ist viel zu spät dafür, sorry)"
    ];

    let currentMessageIndex = 0; 

    function changeCenterText() {
      
        currentMessageIndex = (currentMessageIndex + 1) % messages.length;

        centerTextElement.textContent = messages[currentMessageIndex];
    }

    document.body.addEventListener('click', changeCenterText);
