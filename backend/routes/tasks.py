from flask import Blueprint, jsonify, request

from db import execute, execute_fetchone, fetch_all

bp = Blueprint("tasks", __name__)


@bp.get("/")
def listar_tarefas():
    """
    Lista todas as tarefas
    ---
    tags:
      - Tarefas
    responses:
      200:
        description: Lista de tarefas
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              title:
                type: string
              completed:
                type: integer
              description:
                type: string
              priority:
                type: integer
              due_date:
                type: string
                example: "2026-03-20"
              status:
                type: string
                example: "todo"
              comments_count:
                type: integer
              created_at:
                type: string
    """
    tarefas = fetch_all(
        """
        SELECT
          t.*,
          (SELECT COUNT(*) FROM task_comments c WHERE c.task_id = t.id) AS comments_count
        FROM tasks t
        ORDER BY t.id DESC
        """
    )
    return jsonify(tarefas)


@bp.post("/")
def criar_tarefa():
    """
    Cria uma nova tarefa
    ---
    tags:
      - Tarefas
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - title
          properties:
            title:
              type: string
              example: Minha tarefa
            description:
              type: string
              example: Detalhes da tarefa
            priority:
              type: integer
              example: 2
            due_date:
              type: string
              example: "2026-03-20"
            status:
              type: string
              example: "todo"
    responses:
      201:
        description: Tarefa criada
        schema:
          type: object
          properties:
            id:
              type: integer
            title:
              type: string
            completed:
              type: integer
            description:
              type: string
            priority:
              type: integer
            due_date:
              type: string
            status:
              type: string
            comments_count:
              type: integer
      400:
        description: Erro de validacao
    """
    dados = request.get_json(silent=True) or {}
    title = (dados.get("title") or "").strip()
    description = (dados.get("description") or "").strip()
    priority = dados.get("priority")
    due_date = (dados.get("due_date") or "").strip() or None
    status = (dados.get("status") or "todo").strip()

    if not title:
        return jsonify({"erro": "O titulo e obrigatorio"}), 400

    try:
        priority = int(priority) if priority is not None else 1
    except ValueError:
        return jsonify({"erro": "A prioridade deve ser um numero"}), 400

    if priority < 1 or priority > 3:
        return jsonify({"erro": "A prioridade deve estar entre 1 e 3"}), 400

    if status not in ["todo", "doing", "done"]:
        return jsonify({"erro": "Status invalido"}), 400

    completed = 1 if status == "done" else 0

    tarefa_id = execute(
        """
        INSERT INTO tasks (title, description, priority, due_date, status, completed)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (title, description or None, priority, due_date, status, completed),
        returning_id=True
    )

    return jsonify({
        "id": tarefa_id,
        "title": title,
        "description": description or None,
        "priority": priority,
        "due_date": due_date,
        "status": status,
        "completed": completed,
        "comments_count": 0
    }), 201


@bp.put("/<int:task_id>")
def concluir_tarefa(task_id):
    """
    Marca tarefa como concluida
    ---
    tags:
      - Tarefas
    parameters:
      - in: path
        name: task_id
        required: true
        type: integer
    responses:
      200:
        description: Tarefa concluida
      404:
        description: Tarefa nao encontrada
    """
    execute("UPDATE tasks SET completed = 1, status = 'done' WHERE id = %s", (task_id,))

    # Verifica se a tarefa existe
    tarefas = fetch_all("SELECT id FROM tasks WHERE id = %s", (task_id,))
    if not tarefas:
        return jsonify({"erro": "Tarefa nao encontrada"}), 404

    return jsonify({"mensagem": "Tarefa marcada como concluida"})


@bp.put("/<int:task_id>/status")
def atualizar_status(task_id):
    """
    Atualiza o status da tarefa
    ---
    tags:
      - Tarefas
    parameters:
      - in: path
        name: task_id
        required: true
        type: integer
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - status
          properties:
            status:
              type: string
              example: "doing"
    responses:
      200:
        description: Status atualizado
      400:
        description: Status invalido
      404:
        description: Tarefa nao encontrada
    """
    dados = request.get_json(silent=True) or {}
    status = (dados.get("status") or "").strip()

    if status not in ["todo", "doing", "done"]:
        return jsonify({"erro": "Status invalido"}), 400

    completed = 1 if status == "done" else 0

    execute(
        "UPDATE tasks SET status = %s, completed = %s WHERE id = %s",
        (status, completed, task_id)
    )

    tarefas = fetch_all("SELECT id FROM tasks WHERE id = %s", (task_id,))
    if not tarefas:
        return jsonify({"erro": "Tarefa nao encontrada"}), 404

    return jsonify({"mensagem": "Status atualizado"})


@bp.delete("/<int:task_id>")
def excluir_tarefa(task_id):
    """
    Deleta uma tarefa
    ---
    tags:
      - Tarefas
    parameters:
      - in: path
        name: task_id
        required: true
        type: integer
    responses:
      200:
        description: Tarefa deletada
      404:
        description: Tarefa nao encontrada
    """
    # Verifica se a tarefa existe
    tarefas = fetch_all("SELECT id FROM tasks WHERE id = %s", (task_id,))
    if not tarefas:
        return jsonify({"erro": "Tarefa nao encontrada"}), 404

    execute("DELETE FROM tasks WHERE id = %s", (task_id,))
    return jsonify({"mensagem": "Tarefa deletada com sucesso"})


@bp.get("/<int:task_id>/comments")
def listar_comentarios(task_id):
    """
    Lista comentarios de uma tarefa
    ---
    tags:
      - Comentarios
    parameters:
      - in: path
        name: task_id
        required: true
        type: integer
    responses:
      200:
        description: Lista de comentarios
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              task_id:
                type: integer
              content:
                type: string
              created_at:
                type: string
      404:
        description: Tarefa nao encontrada
    """
    tarefas = fetch_all("SELECT id FROM tasks WHERE id = %s", (task_id,))
    if not tarefas:
        return jsonify({"erro": "Tarefa nao encontrada"}), 404

    comentarios = fetch_all(
        "SELECT id, task_id, content, created_at FROM task_comments WHERE task_id = %s ORDER BY id ASC",
        (task_id,)
    )
    return jsonify(comentarios)


@bp.post("/<int:task_id>/comments")
def criar_comentario(task_id):
    """
    Cria um comentario em uma tarefa
    ---
    tags:
      - Comentarios
    parameters:
      - in: path
        name: task_id
        required: true
        type: integer
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - content
          properties:
            content:
              type: string
              example: "Esse e um comentario"
    responses:
      201:
        description: Comentario criado
        schema:
          type: object
          properties:
            id:
              type: integer
            task_id:
              type: integer
            content:
              type: string
            created_at:
              type: string
      400:
        description: Erro de validacao
      404:
        description: Tarefa nao encontrada
    """
    dados = request.get_json(silent=True) or {}
    content = (dados.get("content") or "").strip()

    if not content:
        return jsonify({"erro": "O comentario e obrigatorio"}), 400

    tarefas = fetch_all("SELECT id FROM tasks WHERE id = %s", (task_id,))
    if not tarefas:
        return jsonify({"erro": "Tarefa nao encontrada"}), 404

    comentario = execute_fetchone(
        """
        INSERT INTO task_comments (task_id, content)
        VALUES (%s, %s)
        RETURNING id, task_id, content, created_at
        """,
        (task_id, content)
    )

    return jsonify(comentario), 201
