const menu = document.getElementById('dropdown');
function toggleMenu() {
    menu.classList.toggle('visible');
}

const stickyWall = document.getElementById('stickyWall');
const addNoteButton = document.getElementById('addNote');

const colors = ['#FFEB99', '#FFD6E0', '#CDEAFF', '#C3FBD8', '#FFF6C3'];

function loadNotes() {
    const savedNotes = JSON.parse(localStorage.getItem('stickyNotes')) || [];
    savedNotes.forEach(note => createNoteElement(note.id, note.text, note.color));
}

function saveNotes() {
    const notes = [];
    document.querySelectorAll('.sticky-note').forEach(note => {
        notes.push({
            id: note.dataset.id,
            text: note.querySelector('textarea').value,
            color: note.style.backgroundColor
        });
    });
    localStorage.setItem('stickyNotes', JSON.stringify(notes));
}

function createNoteElement(id, text, color) {
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.style.backgroundColor = color;
    note.dataset.id = id;

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.addEventListener('input', saveNotes);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', () => {
        note.remove();
        saveNotes();
    });

    note.appendChild(deleteBtn);
    note.appendChild(textarea);
    stickyWall.appendChild(note);
}

addNoteButton.addEventListener('click', () => {
    const id = Date.now().toString();
    const color = colors[Math.floor(Math.random() * colors.length)];
    createNoteElement(id, '', color);
    saveNotes();
});

loadNotes();
