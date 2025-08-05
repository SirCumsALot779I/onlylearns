const menuButton = document.getElementById('menuButton');
const dropdown = document.getElementById('dropdown');
const changeMessageButton = document.getElementById('changeMessageButton');
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

menuButton.addEventListener('click', () => {
  const isVisible = dropdown.classList.toggle('visible');
  menuButton.setAttribute('aria-expanded', isVisible);
  if (isVisible) {
    dropdown.focus();
    const firstItem = dropdown.querySelector('[role="menuitem"]');
    if (firstItem) {
      firstItem.tabIndex = 0;
      firstItem.focus();
    }
    dropdown.querySelectorAll('[role="menuitem"]').forEach(item => {
      if (item !== firstItem) item.tabIndex = -1;
    });
  } else {
    dropdown.querySelectorAll('[role="menuitem"]').forEach(item => {
      item.tabIndex = -1;
    });
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

function changeCenterText() {
  currentMessageIndex = (currentMessageIndex + 1) % messages.length;
  changeMessageButton.textContent = messages[currentMessageIndex];
}

document.addEventListener('click', changeCenterText);
document.addEventListener('keydown', changeCenterText);

function handleFirstTab(e) {
  if (e.key === 'Tab') {
    document.body.classList.add('user-is-tabbing');
    window.removeEventListener('keydown', handleFirstTab);
  }
}
window.addEventListener('keydown', handleFirstTab);
