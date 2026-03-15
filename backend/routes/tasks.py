from flask import Blueprint, jsonify, request

from db import execute, fetch_all

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
    """
    tarefas = fetch_all("SELECT * FROM tasks ORDER BY id DESC")
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
      400:
        description: Erro de validacao
    """
    dados = request.get_json(silent=True) or {}
    title = (dados.get("title") or "").strip()

    if not title:
        return jsonify({"erro": "O titulo e obrigatorio"}), 400

    tarefa_id = execute(
        "INSERT INTO tasks (title, completed) VALUES (%s, 0) RETURNING id",
        (title,),
        returning_id=True
    )

    return jsonify({"id": tarefa_id, "title": title, "completed": 0}), 201


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
    execute("UPDATE tasks SET completed = 1 WHERE id = %s", (task_id,))

    # Verifica se a tarefa existe
    tarefas = fetch_all("SELECT id FROM tasks WHERE id = %s", (task_id,))
    if not tarefas:
        return jsonify({"erro": "Tarefa nao encontrada"}), 404

    return jsonify({"mensagem": "Tarefa marcada como concluida"})


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
