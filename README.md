# Task Manager

Projeto academico simples de gerenciamento de tarefas com arquitetura em 3 camadas: frontend, backend e banco de dados.

## Tecnologias usadas
- Python + Flask
- PostgreSQL
- React (via CDN)
- HTML, CSS e JavaScript
- API REST com JSON
- Docker e Docker Compose

## Como rodar com Docker
1. Na raiz do projeto:
   - `docker compose up --build`
2. Acesse o frontend em:
   - `http://localhost:8080`
3. A API fica em:
   - `http://localhost:3000`

## Como rodar o backend sem Docker
1. Suba um PostgreSQL local e crie o banco `task_manager`.
2. Configure as variaveis de ambiente:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
3. Entre na pasta do backend:
   - `cd backend`
4. (Opcional) Crie e ative um ambiente virtual.
5. Instale as dependencias:
   - `pip install -r requirements.txt`
6. Inicie o servidor:
   - `python server.py`

O backend vai rodar em `http://localhost:3000`.

## Como abrir o frontend sem Docker
Abra o arquivo `frontend/index.html` no navegador.

## Endpoints da API (exemplos)
- `GET /tasks` -> lista todas as tarefas
- `POST /tasks` -> cria nova tarefa
  - body JSON: `{ "title": "Minha tarefa", "description": "Detalhes", "priority": 2, "due_date": "2026-03-20", "status": "todo" }`
- `PUT /tasks/:id` -> marca tarefa como concluida
- `PUT /tasks/:id/status` -> atualiza o status da tarefa
  - body JSON: `{ "status": "doing" }`
- `DELETE /tasks/:id` -> remove tarefa

## Swagger (documentacao da API)
Acesse:
- `http://localhost:3000/docs/`
