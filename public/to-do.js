const supabaseClient = supabase.createClient("https://<YOUR_PROJECT>.supabase.co", "<YOUR_PUBLIC_ANON_KEY>");

async function loadTodos() {
    const todoList = document.getElementById("todoList");
    todoList.innerHTML = "Lade Aufgaben...";

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user) {
        todoList.innerHTML = "<li>Bitte einloggen, um Aufgaben zu sehen.</li>";
        return;
    }

    const { data, error } = await supabaseClient
        .from("todos")
        .select("*")
        .eq("user_id", session.user.id)
        .order("inserted_at", { ascending: false });

    if (error) {
        todoList.innerHTML = "<li>Fehler beim Laden</li>";
        console.error(error);
        return;
    }

    if (data.length === 0) {
        todoList.innerHTML = "<li>Keine Aufgaben</li>";
        return;
    }

    todoList.innerHTML = "";
    data.forEach(todo => {
        const li = document.createElement("li");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.checked;
        checkbox.addEventListener("change", () => toggleTodo(todo.id, checkbox.checked));

        const span = document.createElement("span");
        span.className = "todo-text";
        span.innerText = todo.text;

        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️";
        delBtn.onclick = () => deleteTodo(todo.id);

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(delBtn);
        todoList.appendChild(li);
    });
}

async function addTodo() {
    const input = document.getElementById("newTodoInput");
    const text = input.value.trim();
    if (!text) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user) {
        alert("Bitte anmelden.");
        return;
    }

    const { error } = await supabaseClient.from("todos").insert([
        {
            user_id: session.user.id,
            text,
            checked: false
        }
    ]);

    if (error) {
        alert("Fehler beim Speichern");
        console.error(error);
    } else {
        input.value = "";
        loadTodos();
    }
}

async function toggleTodo(id, checked) {
    await supabaseClient.from("todos").update({ checked }).eq("id", id);
}

async function deleteTodo(id) {
    await supabaseClient.from("todos").delete().eq("id", id);
    loadTodos();
}

function toggleMenu() {
    const dropdown = document.getElementById("dropdown");
    dropdown.classList.toggle("visible");
}

document.getElementById("logoutButton").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    location.reload();
});

document.addEventListener("DOMContentLoaded", () => {
    loadTodos();
});

