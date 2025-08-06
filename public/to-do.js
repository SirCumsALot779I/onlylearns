const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const list = document.getElementById('todo-list');

function getTodos() {
  const todos = sessionStorage.getItem('todos');
  return todos ? JSON.parse(todos) : [];
}

function saveTodos(todos) {
  sessionStorage.setItem('todos', JSON.stringify(todos));
}

function renderTodos() {
  const todos = getTodos();
  list.innerHTML = '';
  if (todos.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Noch keine To-Dos.';
    li.className = 'list-info';
    list.appendChild(li);
    return;
  }

  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.className = 'todo-list-item';

    const span = document.createElement('span');
    span.textContent = todo.text;
    if (todo.done) span.classList.add('done');

    span.addEventListener('click', () => {
      const updatedTodos = getTodos();
      updatedTodos[index].done = !updatedTodos[index].done;
      saveTodos(updatedTodos);
      renderTodos();
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', () => {
      const updatedTodos = getTodos();
      updatedTodos.splice(index, 1);
      saveTodos(updatedTodos);
      renderTodos();
    });

    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

addBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;

  const todos = getTodos();
  todos.push({ text, done: false });
  saveTodos(todos);
  input.value = '';
  renderTodos();
});

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') addBtn.click();
});

document.addEventListener('DOMContentLoaded', () => {
  renderTodos();
});
