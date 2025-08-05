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
        "Ja, jetzt hab ich deine Aufmerksamkeit, war klar.",
        "Du musst schon mit lernen Anfangen um hier irgendwas geschissen zu bekommen",
        "So endest du noch wie Aramis, Romeo und die anderen gefallenen Soldaten.",
        "Uhh Michael hab ich heute schon erwähnt wie gut sie aussehen, während sie diese Aufgabe korrigieren! (-Aramis)",
        "das ist Text. Ich hab doch auch kein plan was hier noch stehen kann, geh doch bitte einfach lernen du **** ***** ***** ******",
        "Ich entschuldige mich für meinen Kollegen, das war nicht nett...aber er hat Recht.",
        "Hier könnte ihre Werbung stehen!",
        "Ne. jetzt mal ehrlich, hat die Person, die das alles geschrieben hat nichts zu tun? (Doch aber ich prokrastiniere. Es warten noch nen Haufen anderer Sachen auf mich)",
        "Siehst du? Sei nicht so wie der Editor. Ran an die Arbeit, die Uhr tickt.",
        "Denkst du das reicht an Nachrichten?",
        "Ne, paar mehr gehen noch (Ich muss in 4h wieder aufstehen hilfe)",
        "Jetzt führe ich hier schon Selbstgespräche...die Stimmen werden lauter",
        "Mark Forster hat mal gesagt ich soll auf die Stimme hören. Ist es soweit?",
        "....Lieber nicht.",
        "Funfact! Als Edgar Allan Poe irgendwo in seinen 30s war, soll er seine 13 jährige Cousine geheiratet haben.",
        "Sei nicht wie Edgar Allan Poe.",
        "Noch ein Funfact? ehh...",
        "Ah! Wusstest du, dass die Punkte von Walhaien genauso individuell sind wie unsere Fingerabrücke?",
        "So jetzt hab ich aber true crime und Walhaie erwähnt...könnte dir noch mehr über meine Interessen erzählen aber geh mal lernen (oder korrigieren :))",
        "Ehrlich, wenn ich über alle meine Interessen reden würde, wäre das eine Endlosschleife.",
        "Dann lernst du nie richtig. Diese Generation ist so schon gefährdet. Sei nicht wie die anderen, geh lernen.",
        "Viel Spaß. Dies ist das Ende der Schleife.",
        "HAH, dachtest du.",
        "So einfach wirst du mich nicht los. Bin ein certified Yapper",
        "Du aber anscheinend auch, wenn du dich durch diesen ganzen Dialog durchklickst...vielleicht mal rausgehen und Menschen kennenlernen.",
        "Man munkelt dem Editor hier wäre langweilig",
        "Aber tatsächlich interessiert es mich nur, ob sich jemand wirklich die ganze Schleife gibt...",
        "Schick mir (Emily) mal ein Bild von einer Ente, wenn du so weit gekommen bist.",
        "Ich werde mich wahrscheinlich nicht daran erinnern und zutiefst verwirrt sein. Aber Enten sind cool. Kann man nix falsch machen mit einem Entenbild.",
        "Aber mach du dein Ding :)",
        "...wie zum Beispiel zu lernen...(oder zu korrigieren. Hoffe du konntest die Miete zahlen :P)",
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
