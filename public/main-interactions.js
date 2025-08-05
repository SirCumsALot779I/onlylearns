const menuButton = document.getElementById('menuButton');
const dropdown = document.getElementById('dropdown');

menuButton.addEventListener('click', () => {
  const isVisible = dropdown.classList.toggle('visible');
  menuButton.setAttribute('aria-expanded', isVisible);

  const menuItems = dropdown.querySelectorAll('[role="menuitem"]');

  if (isVisible) {
    menuItems.forEach(item => item.tabIndex = 0);
    if (menuItems.length > 0) menuItems[0].focus();
    
  } else {
    menuItems.forEach(item => item.tabIndex = -1);
    menuButton.focus();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && dropdown.classList.contains('visible')) {
    dropdown.classList.remove('visible');
    menuButton.setAttribute('aria-expanded', 'false');
    dropdown.querySelectorAll('[role="menuitem"]').forEach(item => {
      item.tabIndex = -1;
    });
    menuButton.focus();
  }
});

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

const changeMessageButton = document.getElementById('changeMessageButton');
let currentMessageIndex = 0;

const changeMessageButton = document.getElementById('changeMessageButton');
let currentMessageIndex = 0;

function changeCenterText() {
  currentMessageIndex = (currentMessageIndex + 1) % messages.length;
  changeMessageButton.textContent = messages[currentMessageIndex];
}

changeMessageButton.addEventListener('click', changeCenterText);

changeMessageButton.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();  
    changeCenterText();
  }
});


function changeCenterText() {
  currentMessageIndex = (currentMessageIndex + 1) % messages.length;
  changeMessageButton.textContent = messages[currentMessageIndex];
}

document.addEventListener('click', () => {
  changeCenterText();
});

document.addEventListener('keydown', () => {
  changeCenterText();
});
