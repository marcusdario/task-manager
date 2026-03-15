import os
import psycopg2
import psycopg2.extras

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "task_manager")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")


def get_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            priority INTEGER DEFAULT 1,
            due_date DATE,
            status TEXT DEFAULT 'todo',
            completed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        )
        """
    )

    cursor.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT")
    cursor.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1")
    cursor.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE")
    cursor.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo'")
    cursor.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()")

    conn.commit()
    cursor.close()
    conn.close()


def fetch_all(query, params=None):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cursor.execute(query, params or ())
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return rows


def execute(query, params=None, returning_id=False):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(query, params or ())

    last_id = None
    if returning_id:
        last_id = cursor.fetchone()[0]

    conn.commit()
    cursor.close()
    conn.close()

    return last_id
