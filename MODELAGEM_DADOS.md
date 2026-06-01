# Modelagem de Dados - Task Manager

![Modelagem de Dados](MODELAGEM_DADOS.png)

```mermaid
flowchart LR
    TASKS["TASKS<br/><br/>PK id: int<br/>title: text<br/>description: text<br/>priority: int<br/>due_date: date<br/>status: text<br/>completed: int<br/>created_at: timestamp"]

    TASK_COMMENTS["TASK_COMMENTS<br/><br/>PK id: int<br/>FK task_id: int<br/>content: text<br/>created_at: timestamp"]

    TASKS -->|1 possui 0..N comentarios| TASK_COMMENTS

    classDef tabela fill:#f8fafc,stroke:#334155,stroke-width:1px,color:#0f172a;
    class TASKS,TASK_COMMENTS tabela;
```

## Regras dos Dados

- `TASKS.status` aceita os valores `todo`, `doing` e `done`.
- `TASKS.priority` usa valores de `1` a `3`.
- `TASK_COMMENTS.task_id` referencia `TASKS.id` com exclusao em cascata.
