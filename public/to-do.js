import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient('https://DEINE_SUPABASE_URL', 'DEIN_ANON_KEY');

const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const list = document.getElementById('todo-list');

async function getUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.user;
}

function renderMessage(text, type = 'info') {
  const msg = document.createElement('div');
  msg.className = type === 'error' ? 'error-message' : 'loading-message';
  msg.textContent = text;
  list.innerHTML = '';
  list.appendChild(msg);
}

function renderTodos(todos) {
  list.innerHTML = '';
  if (todos.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Noch keine To-Dos.';
    li.className = 'list-info';
    list.appendChild(li);
    return;
  }

  todos.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-list-item';

    const span = document.createElement('span');
    span.textContent = todo.text;
    span.className = todo.done ? 'done' : '';
    span.addEventListener('click', async () => {
      await supabase.from('todos').update({ done: !todo.done }).eq('id', todo.id);
      loadTodos();
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', async () => {
      await supabase.from('todos').delete().eq('id', todo.id);
      loadTodos();
    });

    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

async function loadTodos() {
  const user = await getUser();
  if (!user) {
    renderMessage('Bitte zuerst einloggen.', 'error');
    return;
  }

  renderMessage('Lade Aufgaben...');
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    renderMessage('Fehler beim Laden der Aufgaben.', 'error');
    console.error(error);
    return;
  }

  renderTodos(data);
}

addBtn.addEventListener('click', async () => {
  const user = await getUser();
  const text = input.value.trim();
  if (!text || !user) return;

  const { error } = await supabase
    .from('todos')
    .insert({ user_id: user.id, text, done: false });

  if (error) {
    console.error("Fehler beim Speichern:", error);
    renderMessage("Fehler beim Hinzufügen des To-Dos.", "error");
    return;
  }

  input.value = '';
  loadTodos();
});

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') addBtn.click();
});

document.addEventListener('DOMContentLoaded', () => {
  loadTodos();
});
