function toggleMenu() {
    document.getElementById('dropdown').classList.toggle('visible');
}

const addNoteButton = document.getElementById('addNoteButton');
const stickyWall = document.getElementById('stickyWall');

const colorOptions = [
    { value: "#fff9c4", class: "color-option-fff9c4" },
    { value: "#bbdefb", class: "color-option-bbdefb" },
    { value: "#ffcdd2", class: "color-option-ffcdd2" },
    { value: "#ffe0b2", class: "color-option-ffe0b2" },
    { value: "#f5f5f5", class: "color-option-f5f5f5" },
    { value: "#e0e0e0", class: "color-option-e0e0e0" },
    { value: "#9e9e9e", class: "color-option-9e9e9e" }
];

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

function loadNotes() {
    const savedNotes = JSON.parse(localStorage.getItem('stickyNotes')) || [];
    savedNotes.forEach(note => createNoteElement(note.id, note.text, note.color));
}

function createNoteElement(id, text, color) {
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.dataset.id = id;
    note.style.backgroundColor = color;

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.addEventListener('input', saveNotes);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => {
        note.remove();
        saveNotes();
    });

    const colorSelect = document.createElement('select');
    colorSelect.className = 'color-select';
    colorOptions.forEach(({ value, class: cls }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        option.className = cls;
        if (value === color) option.selected = true;
        colorSelect.appendChild(option);
    });

    colorSelect.addEventListener('change', () => {
        note.style.backgroundColor = colorSelect.value;
        saveNotes();
    });

    note.appendChild(deleteBtn);
    note.appendChild(textarea);
    note.appendChild(colorSelect);
    stickyWall.appendChild(note);
}

addNoteButton.addEventListener('click', () => {
    const id = Date.now().toString();
    const color = colorOptions[Math.floor(Math.random() * colorOptions.length)].value;
    createNoteElement(id, '', color);
    saveNotes();
});

window.addEventListener('beforeunload', saveNotes);
loadNotes();
