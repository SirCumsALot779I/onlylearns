# OnlyLearns: Lerntracking-Plattform

**Projekt-Website**: https://onlylearns.vercel.app/main.html
## Übersicht
Hierbei handelt es sich um eine unterstüzende Plattform, welche eninem helfen soll, seine Zeiten und Aufgaben zu tracken, analysieren und einen klaren Überblick zu behalten. 
Wir wollen damit Studenten, wie uns, die Auswahl zwischen etlichen timern, to-do-programmen (wie Microsoft To Do) erleichtern und Zettelwirrwarr auf dem Schreibtisch helfen zu vermeiden.
Die Bedienung der Website erfolgt über Mausklick und ist ziemlich einfach gestaltet um mögliche Verwirrungen zu vermeiden.
Wenn man das este Mal auf die Seite kommt, wird erstmal ein Login gefodert, da wir mit einer Datenbank arbeiten, um eure Daten zu speichern und euch die Möglichkeit zu bieten, eure Sticky-Notes, Zeiten und Dashboard zu speichern und an einem späteren Zeitpunkt wiederzugeben, ohne das Projekt auf einem bestimmten Gerät lokal laufen zu müssen. So könnt ihr eure Daten jederzeit aufrufen, wo auch immer ihr seid (ihr braucht natürlich dann aber eine Internetverbindung).

## Einführung 
Nach eurem Login werdet ihr von unserem lieben Editor begrüßt und aufgefordert durch weiteres Klicken auf das Menü in der linken oberen Ecke zu klicken. 
Ab da ist der Rest ziemlich selbsterklärend - die einzelnen Features erreichbar durch einen simplen Klick.

## Features
Die Websie bietet zwei Hauptfeatures, und zwar den Timer, welcher Zeiten erfasst und mithilfe eines Dashboards auswertet und das zweite Hauptfeature bietet euch eine To-Do-Liste mit Sticky Notes Optik, welche trotz des Darkmodes ein paar sanfte Farben reinbringt, ohne eure armen Augen verbrennen zu lassen.

## Tech-Stack
- JavaScript
- Vercel
- Supabase

## Ordnerstruktur
```plaintext
.
├── .idea/
│   ├── .gitignore
│   ├── misc.xml
│   └── modules.xml
├── api/
│   ├── get-all-profiles.js
│   ├── get-time-entries.js
│   ├── index.js
│   └── save-time.js
├── public/
│   ├── img/
│   ├── vids/
│   ├── auth-style.css
│   ├── auth.js
│   ├── chat-style.css
│   ├── chat.html
│   ├── chat.js
│   ├── dashboard-style.css
│   ├── dashboard.html
│   ├── dashboard.js
│   ├── index.html
│   ├── main-interactions.js
│   ├── main.css
│   ├── main.html
│   ├── scripts/
│   ├── settings-style.css
│   ├── settings.html
│   ├── settings.js
│   ├── style.css
│   ├── timer.css
│   ├── timer.html
│   ├── timer.js
│   ├── to-do.css
│   ├── to-do.html
│   └── to-do.js
├── .gitignore
├── OnlyLearns.iml
├── README.md
├── package-lock.json
├── package.json
└── vercel.json
```


