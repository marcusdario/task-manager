import os
import time

from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger

from db import init_db
from routes.tasks import bp as tasks_bp

app = Flask(__name__)
CORS(app)
app.url_map.strict_slashes = False

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "Task Manager API",
        "description": "Documentacao simples da API de tarefas",
        "version": "1.0.0"
    },
    "basePath": "/",
    "schemes": ["http"]
}

swagger_config = {
    "headers": [],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs/",
    "specs": [
        {
            "endpoint": "apispec_1",
            "route": "/docs/apispec_1.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True
        }
    ]
}

Swagger(app, template=swagger_template, config=swagger_config)


def tentar_init_db():
    tentativas = 5
    while tentativas > 0:
        try:
            init_db()
            return
        except Exception:
            tentativas -= 1
            time.sleep(2)

    # Se falhar, deixa o erro aparecer ao iniciar as rotas


tentar_init_db()

app.register_blueprint(tasks_bp, url_prefix="/tasks")


@app.get("/")
def index():
    return jsonify({"mensagem": "API do Task Manager funcionando"})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "3000"))
    app.run(host="0.0.0.0", port=port, debug=False)
