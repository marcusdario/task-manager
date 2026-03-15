const { useEffect, useMemo, useState } = React;

function getApiUrl() {
  return "http://localhost:3000/tasks";
}

function App() {
  const API_URL = useMemo(() => getApiUrl(), []);
  const [tarefas, setTarefas] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("1");
  const [dataLimite, setDataLimite] = useState("");
  const [status, setStatus] = useState("todo");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregarTarefas() {
    try {
      setCarregando(true);
      setErro("");
      const response = await fetch(`${API_URL}?_=${Date.now()}`, {
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Resposta invalida");
      }
      if (Array.isArray(data)) {
        setTarefas(data);
      } else {
        setTarefas([]);
        setErro("Resposta inesperada da API");
      }
    } catch (e) {
      setErro("Nao foi possivel carregar as tarefas");
      setTarefas([]);
    } finally {
      setCarregando(false);
    }
  }

  async function criarTarefa(e) {
    e.preventDefault();
    const title = titulo.trim();
    if (!title) return;

    try {
      setErro("");
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: descricao.trim(),
          priority: Number(prioridade),
          due_date: dataLimite || null,
          status
        })
      });
      setTitulo("");
      setDescricao("");
      setPrioridade("1");
      setDataLimite("");
      setStatus("todo");
      carregarTarefas();
    } catch (e) {
      setErro("Nao foi possivel criar a tarefa");
    }
  }

  async function atualizarStatus(id, novoStatus) {
    try {
      setErro("");
      await fetch(`${API_URL}/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus })
      });
      carregarTarefas();
    } catch (e) {
      setErro("Nao foi possivel atualizar o status");
    }
  }

  function onDragStart(e, tarefaId) {
    e.dataTransfer.setData("text/plain", String(tarefaId));
  }

  function onDragOver(e) {
    e.preventDefault();
  }

  async function onDrop(e, novoStatus) {
    e.preventDefault();
    const tarefaId = e.dataTransfer.getData("text/plain");
    if (tarefaId) {
      await atualizarStatus(tarefaId, novoStatus);
    }
  }

  async function deletarTarefa(id) {
    try {
      setErro("");
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      carregarTarefas();
    } catch (e) {
      setErro("Nao foi possivel deletar a tarefa");
    }
  }

  useEffect(() => {
    carregarTarefas();
  }, []);

  const listaTarefas = Array.isArray(tarefas) ? tarefas : [];

  return (
    <div className="container">
      <h1>Task Manager</h1>

      <form className="form" onSubmit={criarTarefa}>
        <input
          type="text"
          placeholder="Titulo da tarefa"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <input
          type="text"
          placeholder="Descricao (opcional)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <div className="row">
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
          >
            <option value="1">Prioridade 1</option>
            <option value="2">Prioridade 2</option>
            <option value="3">Prioridade 3</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todo">A Fazer</option>
            <option value="doing">Em Andamento</option>
            <option value="done">Concluida</option>
          </select>
          <input
            type="date"
            value={dataLimite}
            onChange={(e) => setDataLimite(e.target.value)}
          />
          <button type="submit">Adicionar</button>
        </div>
      </form>

      {erro && <p className="error">{erro}</p>}
      {carregando && <p className="muted">Carregando...</p>}

      <div className="board">
        <div className="column" onDragOver={onDragOver} onDrop={(e) => onDrop(e, "todo")}>
          <h2>A Fazer</h2>
          <ul>
            {listaTarefas
              .filter((t) => (t.status || "todo") === "todo")
              .map((tarefa) => (
                <li key={tarefa.id} draggable onDragStart={(e) => onDragStart(e, tarefa.id)}>
                  <div className="task-info">
                    <strong>{tarefa.title}</strong>
                    {tarefa.description && (
                      <span className="muted">{tarefa.description}</span>
                    )}
                    <span className="meta">
                      Prioridade: {tarefa.priority || 1}
                      {tarefa.due_date ? ` | Limite: ${tarefa.due_date}` : ""}
                    </span>
                  </div>
                  <div className="actions">
                    <button
                      className="action-btn"
                      onClick={() => atualizarStatus(tarefa.id, "doing")}
                    >
                      Ir para Em Andamento
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => deletarTarefa(tarefa.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>

        <div className="column" onDragOver={onDragOver} onDrop={(e) => onDrop(e, "doing")}>
          <h2>Em Andamento</h2>
          <ul>
            {listaTarefas
              .filter((t) => (t.status || "todo") === "doing")
              .map((tarefa) => (
                <li key={tarefa.id} draggable onDragStart={(e) => onDragStart(e, tarefa.id)}>
                  <div className="task-info">
                    <strong>{tarefa.title}</strong>
                    {tarefa.description && (
                      <span className="muted">{tarefa.description}</span>
                    )}
                    <span className="meta">
                      Prioridade: {tarefa.priority || 1}
                      {tarefa.due_date ? ` | Limite: ${tarefa.due_date}` : ""}
                    </span>
                  </div>
                  <div className="actions">
                    <button
                      className="action-btn"
                      onClick={() => atualizarStatus(tarefa.id, "todo")}
                    >
                      Voltar
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => atualizarStatus(tarefa.id, "done")}
                    >
                      Concluir
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => deletarTarefa(tarefa.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>

        <div className="column" onDragOver={onDragOver} onDrop={(e) => onDrop(e, "done")}>
          <h2>Concluidas</h2>
          <ul>
            {listaTarefas
              .filter((t) => (t.status || "todo") === "done")
              .map((tarefa) => (
                <li key={tarefa.id} draggable onDragStart={(e) => onDragStart(e, tarefa.id)}>
                  <div className="task-info">
                    <strong>{tarefa.title}</strong>
                    {tarefa.description && (
                      <span className="muted">{tarefa.description}</span>
                    )}
                    <span className="meta">
                      Prioridade: {tarefa.priority || 1}
                      {tarefa.due_date ? ` | Limite: ${tarefa.due_date}` : ""}
                    </span>
                  </div>
                  <div className="actions">
                    <button
                      className="action-btn"
                      onClick={() => atualizarStatus(tarefa.id, "doing")}
                    >
                      Reabrir
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => deletarTarefa(tarefa.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {!carregando && listaTarefas.length === 0 && (
        <p className="muted">Nenhuma tarefa cadastrada.</p>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
