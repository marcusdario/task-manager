const { useEffect, useMemo, useState } = React;

function getApiUrl() {
  return "http://localhost:3000/tasks";
}

function formatarData(valor) {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(data);
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
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);
  const [dragOverStatus, setDragOverStatus] = useState(null);

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
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function onDrop(e, novoStatus) {
    e.preventDefault();
    setDragOverStatus(null);
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

  async function abrirComentarios(tarefa) {
    setTarefaSelecionada(tarefa);
    setNovoComentario("");
    setComentarios([]);

    try {
      setCarregandoComentarios(true);
      const response = await fetch(`${API_URL}/${tarefa.id}/comments?_=${Date.now()}`, {
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok) throw new Error("Resposta invalida");
      setComentarios(Array.isArray(data) ? data : []);
    } catch (e) {
      setComentarios([]);
      setErro("Nao foi possivel carregar os comentarios");
    } finally {
      setCarregandoComentarios(false);
    }
  }

  function fecharComentarios() {
    setTarefaSelecionada(null);
    setNovoComentario("");
    setComentarios([]);
  }

  async function adicionarComentario(e) {
    e.preventDefault();
    if (!tarefaSelecionada) return;

    const content = novoComentario.trim();
    if (!content) return;

    try {
      setErro("");
      await fetch(`${API_URL}/${tarefaSelecionada.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      setNovoComentario("");
      await abrirComentarios(tarefaSelecionada);
      carregarTarefas();
    } catch (e) {
      setErro("Nao foi possivel adicionar o comentario");
    }
  }

  useEffect(() => {
    carregarTarefas();
  }, []);

  const listaTarefas = Array.isArray(tarefas) ? tarefas : [];

  const colunas = [
    { id: "todo", titulo: "A Fazer" },
    { id: "doing", titulo: "Em Andamento" },
    { id: "done", titulo: "Concluidas" }
  ];

  function badgePrioridade(valor) {
    const p = Number(valor || 1);
    if (p === 3) return "p3";
    if (p === 2) return "p2";
    return "p1";
  }

  function renderCard(tarefa) {
    const commentsCount = tarefa.comments_count || 0;
    const due = tarefa.due_date ? formatarData(tarefa.due_date) : "";

    return (
      <li
        key={tarefa.id}
        className="card"
        draggable
        onDragStart={(e) => onDragStart(e, tarefa.id)}
        onDoubleClick={() => abrirComentarios(tarefa)}
      >
        <div className="card-top">
          <strong className="card-title" title={tarefa.title}>{tarefa.title}</strong>
          <span className={`badge ${badgePrioridade(tarefa.priority)}`} title="Prioridade">
            P{tarefa.priority || 1}
          </span>
        </div>

        {tarefa.description && <div className="card-desc">{tarefa.description}</div>}

        <div className="card-meta">
          {due ? <span title="Data limite">Limite: {due}</span> : <span className="muted">Sem data limite</span>}
        </div>

        <div className="actions">
          <button className="action-btn comment-btn" onClick={() => abrirComentarios(tarefa)} title="Abrir comentarios">
            Comentarios <span className="pill">{commentsCount}</span>
          </button>
          <button className="action-btn delete-btn" onClick={() => deletarTarefa(tarefa.id)} title="Excluir tarefa">
            Excluir
          </button>
        </div>
      </li>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <img className="brand-logo" src="./assets/impacta.png" alt="Faculdade Impacta" />
          <div>
            <h1>Task Manager</h1>
          <p className="subtitle">Arraste cards entre colunas. Clique em Comentarios para reportar detalhes.</p>
          </div>
        </div>
        <button className="action-btn" onClick={carregarTarefas} title="Atualizar lista">
          Atualizar
        </button>
      </div>

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
        {colunas.map((coluna) => (
          <div
            key={coluna.id}
            className={`column ${dragOverStatus === coluna.id ? "is-drop" : ""}`}
            onDragOver={onDragOver}
            onDragEnter={() => setDragOverStatus(coluna.id)}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={(e) => onDrop(e, coluna.id)}
          >
            <div className="column-head">
              <h2>{coluna.titulo}</h2>
              <span className="pill" title="Quantidade de tarefas">
                {
                  listaTarefas.filter((t) => (t.status || "todo") === coluna.id).length
                }
              </span>
            </div>
            <ul className="cards">
              {listaTarefas
                .filter((t) => (t.status || "todo") === coluna.id)
                .map((tarefa) => renderCard(tarefa))}
            </ul>
          </div>
        ))}
      </div>

      {!carregando && listaTarefas.length === 0 && (
        <p className="muted">Nenhuma tarefa cadastrada.</p>
      )}

      {tarefaSelecionada && (
        <div className="modal-overlay" onClick={fecharComentarios}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="icon-btn modal-close"
              onClick={fecharComentarios}
              title="Fechar"
              aria-label="Fechar"
            >
              ×
            </button>
            <div className="modal-header">
              <div>
                <h3>Comentarios</h3>
                <div className="muted">
                  {tarefaSelecionada.title} <span className="pill">{comentarios.length}</span>
                </div>
              </div>
            </div>

            {carregandoComentarios && <p className="muted">Carregando comentarios...</p>}

            <div className="comments">
              {comentarios.length === 0 && !carregandoComentarios && (
                <p className="muted">Nenhum comentario ainda.</p>
              )}
              {comentarios.map((c) => (
                <div key={c.id} className="comment">
                  <div className="comment-meta">{formatarData(c.created_at)}</div>
                  <div>{c.content}</div>
                </div>
              ))}
            </div>

            <form className="comment-form" onSubmit={adicionarComentario}>
              <textarea
                rows="2"
                placeholder="Escreva um comentario e pressione Adicionar"
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
              />
              <button type="submit">Adicionar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
