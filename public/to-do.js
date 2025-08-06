const menu = document.getElementById('dropdown');
function toggleMenu() {
    menu.classList.toggle('visible');
}

const stickyGrid = document.getElementById('stickyGrid');
const addNoteButton = document.getElementById('addNoteButton');

const colors = ['yellow', 'blue', 'pink', 'orange'];

function saveNotes() {
    const notes = [];
    document.querySelectorAll('.sticky-note').forEach(note => {
        if (note.classList.contains('add-note')) return;
        const textarea = note.querySelector('textarea');
        notes.push({
            id: note.dataset.id,
            text: textarea.value,
            color: Array.from(note.classList).find(c => colors.includes(c)) || 'yellow'
        });
    });
    localStorage.setItem('stickyNotes', JSON.stringify(notes));
}

function createNoteElement(id, text, color) {
    const note = document.createElement('div');
    note.classList.add('sticky-note', color);
    note.dataset.id = id;
    note.setAttribute('contenteditable', 'false');

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.addEventListener('input', saveNotes);

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', e => {
        e.stopPropagation();
        note.remove();
        saveNotes();
    });

    note.appendChild(deleteBtn);
    note.appendChild(textarea);
    stickyGrid.insertBefore(note, addNoteButton);
}

function addNewNote() {
    const id = Date.now().toString();
    const color = colors[Math.floor(Math.random() * colors.length)];
    createNoteElement(id, '', color);
    saveNotes();
}

addNoteButton.addEventListener('click', addNewNote);

window.addEventListener('load', () => {
    const savedNotes = JSON.parse(localStorage.getItem('stickyNotes')) || [];
    savedNotes.forEach(note => createNoteElement(note.id, note.text, note.color));
});

window.addEventListener('beforeunload', saveNotes);
