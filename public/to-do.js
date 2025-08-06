function toggleMenu() {
    document.getElementById('dropdown').classList.toggle('visible');
}

const stickyGrid = document.getElementById('stickyGrid');
const addNoteButton = document.getElementById('addNoteButton');

const colors = [
    {name: 'Gelb', value: '#fff9c4'},
    {name: 'Blau', value: '#bbdefb'},
    {name: 'Pink', value: '#ffcdd2'},
    {name: 'Orange', value: '#ffe0b2'},
    {name: 'Grün', value: '#c3fbd8'}
];

function saveNotes() {
    const notes = [];
    stickyGrid.querySelectorAll('.sticky-note:not(.add-note)').forEach(note => {
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
    note.setAttribute('draggable', 'true');

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.addEventListener('input', saveNotes);
    note.appendChild(textarea);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', e => {
        e.stopPropagation();
        note.remove();
        saveNotes();
    });
    note.appendChild(deleteBtn);

    const colorPicker = document.createElement('select');
    colorPicker.className = 'color-picker';
    colors.forEach(c => {
        const option = document.createElement('option');
        option.value = c.value;
        option.textContent = c.name;
        if (c.value === color) option.selected = true;
        colorPicker.appendChild(option);
    });
    colorPicker.addEventListener('change', () => {
        note.style.backgroundColor = colorPicker.value;
        saveNotes();
    });
    note.appendChild(colorPicker);

    // Drag & Drop Events
    note.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        note.style.opacity = '0.5';
    });
    note.addEventListener('dragend', () => {
        note.style.opacity = '1';
    });
    note.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    note.addEventListener('drop', e => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        if(draggedId === id) return;
        const draggedNote = stickyGrid.querySelector(`.sticky-note[data-id="${draggedId}"]`);
        if (!draggedNote) return;
        stickyGrid.insertBefore(draggedNote, note);
        saveNotes();
    });

    stickyGrid.insertBefore(note, addNoteButton);
}

function loadNotes() {
    const savedNotes = JSON.parse(localStorage.getItem('stickyNotes')) || [];
    savedNotes.forEach(note => createNoteElement(note.id, note.text, note.color));
}

addNoteButton.addEventListener('click', () => {
    const id = Date.now().toString();
    const color = colors[Math.floor(Math.random() * colors.length)].value;
    createNoteElement(id, '', color);
    saveNotes();
});

loadNotes();
