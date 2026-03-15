function getApiUrl() {
  // Se estiver rodando via servidor (http/https), usa o mesmo host
  if (window.location.protocol.startsWith("http")) {
    return `${window.location.origin}/tasks`;
  }

  // Se abrir o arquivo direto (file://), usa localhost
  return "http://localhost:3000/tasks";
}

const API_URL = getApiUrl();

const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

async function carregarTarefas() {
  const response = await fetch(API_URL);
  const tarefas = await response.json();

  taskList.innerHTML = "";

  tarefas.forEach((tarefa) => {
    const li = document.createElement("li");
    if (tarefa.completed === 1) {
      li.classList.add("completed");
    }

    const span = document.createElement("span");
    span.textContent = tarefa.title;

    const actions = document.createElement("div");
    actions.classList.add("actions");

    const doneBtn = document.createElement("button");
    doneBtn.textContent = "Concluir";
    doneBtn.classList.add("action-btn", "done-btn");
    doneBtn.onclick = () => concluirTarefa(tarefa.id);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Excluir";
    deleteBtn.classList.add("action-btn", "delete-btn");
    deleteBtn.onclick = () => excluirTarefa(tarefa.id);

    actions.appendChild(doneBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(span);
    li.appendChild(actions);

    taskList.appendChild(li);
  });
}

async function adicionarTarefa() {
  const title = taskInput.value.trim();
  if (!title) return;

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title })
  });

  taskInput.value = "";
  carregarTarefas();
}

async function concluirTarefa(id) {
  await fetch(`${API_URL}/${id}`, {
    method: "PUT"
  });

  carregarTarefas();
}

async function excluirTarefa(id) {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  });

  carregarTarefas();
}

addTaskBtn.addEventListener("click", adicionarTarefa);

window.addEventListener("load", carregarTarefas);
