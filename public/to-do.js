document.addEventListener('DOMContentLoaded', () => {
  function toggleMenu() {
    document.getElementById('dropdown').classList.toggle('visible');
  }

  const addNoteButton = document.getElementById('addNoteButton');
  const stickyWall = document.getElementById('stickyWall');

  const colorOptions = [
    "#fff9c4",
    "#bbdefb",
    "#ffcdd2",
    "#ffe0b2",
    "#f5f5f5",
    "#e0e0e0",
    "#9e9e9e"
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
    colorOptions.forEach(colorValue => {
      const option = document.createElement('option');
      option.value = colorValue;
      option.textContent = colorValue;
      if (colorValue === color) option.selected = true;
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
    const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    createNoteElement(id, '', color);
    saveNotes();
  });

  window.addEventListener('beforeunload', saveNotes);

  document.querySelector('.hamburger').addEventListener('click', toggleMenu);

  loadNotes();
});
