const stickyWall = document.getElementById('stickyWall');
const addNoteButton = document.getElementById('addNoteButton');

const colors = ['#fff9c4', '#bbdefb', '#ffcdd2', '#ffe0b2', '#c3fbd8'];

let draggedNote = null;

function saveNotes() {
    const notes = [];
    document.querySelectorAll('.sticky-note').forEach(note => {
        notes.push({
            id: note.dataset.id,
            text: note.querySelector('textarea').value,
            color: note.querySelector('.color-picker').value
        });
    });
    localStorage.setItem('stickyNotes', JSON.stringify(notes));
}

function createNoteElement(id, text, color) {
    const note = document.createElement('div');
    note.classList.add('sticky-note');
    note.dataset.id = id;
    note.style.backgroundColor = color;
    note.setAttribute('draggable', 'true');

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.addEventListener('input', saveNotes);

    const colorPicker = document.createElement('select');
    colorPicker.classList.add('color-picker');
    colors.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.style.backgroundColor = c;
        option.textContent = c;
        if (c === color) option.selected = true;
        colorPicker.appendChild(option);
    });
    colorPicker.addEventListener('change', () => {
        note.style.backgroundColor = colorPicker.value;
        saveNotes();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', () => {
        note.remove();
        saveNotes();
    });

    note.appendChild(deleteBtn);
    note.appendChild(textarea);
    note.appendChild(colorPicker);

    note.addEventListener('dragstart', (e) => {
        draggedNote = note;
        note.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    note.addEventListener('dragend', () => {
        draggedNote = null;
        note.classList.remove('dragging');
    });

    note.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedNote === note) return;
        const bounding = note.getBoundingClientRect();
        const offset = e.clientY - bounding.top;
        if (offset > bounding.height / 2) {
            note.style['border-bottom'] = '2px solid #000';
            note.style['border-top'] = '';
        } else {
            note.style['border-top'] = '2px solid #000';
            note.style['border-bottom'] = '';
        }
    });

    note.addEventListener('dragleave', () => {
        note.style['border-bottom'] = '';
        note.style['border-top'] = '';
    });

    note.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedNote === note) return;

        note.style['border-bottom'] = '';
        note.style['border-top'] = '';

        const bounding = note.getBoundingClientRect();
        const offset = e.clientY - bounding.top;
        if (offset > bounding.height / 2) {
            stickyWall.insertBefore(draggedNote, note.nextSibling);
        } else {
            stickyWall.insertBefore(draggedNote, note);
        }
        saveNotes();
    });

    stickyWall.appendChild(note);
}

function loadNotes() {
    const savedNotes = JSON.parse(localStorage.getItem('stickyNotes')) || [];
    savedNotes.forEach(note => createNoteElement(note.id, note.text, note.color));
}

addNoteButton.addEventListener('click', () => {
    const id = Date.now().toString();
    const color = colors[Math.floor(Math.random() * colors.length)];
    createNoteElement(id, '', color);
    saveNotes();
});

window.addEventListener('load', loadNotes);
window.addEventListener('beforeunload', saveNotes);

function toggleMenu() {
    document.getElementById('dropdown').classList.toggle('visible');
}
