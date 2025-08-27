from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import json
from datetime import datetime
import sqlite3

DB_FILE = "database.db"

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    # GPS-Daten, mit Tag als Gruppierung
    c.execute("""
        CREATE TABLE IF NOT EXISTS gps_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lat REAL,
            lon REAL,
            timestamp TEXT,
            device_id TEXT,
            day TEXT
        )
    """)
    # Felder
    c.execute("""
        CREATE TABLE IF NOT EXISTS fields (
            id TEXT PRIMARY KEY,
            name TEXT,
            fileName TEXT,
            geojson TEXT
        )
    """)
    # Aufgaben
    c.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            name TEXT,
            color TEXT,
            status TEXT,
            createdAt TEXT
        )
    """)
    # Aufgaben-Felder
    c.execute("""
        CREATE TABLE IF NOT EXISTS task_fields (
            task_id TEXT,
            field_id TEXT,
            completed INTEGER,
            PRIMARY KEY (task_id, field_id)
        )
    """)
    conn.commit()
    conn.close()

init_db()

app = Flask(__name__, static_url_path='/static', static_folder='static')

gps_data = []  # Liste zum Speichern der GPS-Punkte

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)


@app.route("/")
def index():
    return render_template("map.html", points=gps_data)

from datetime import datetime

@app.route("/gps", methods=["POST"])
def receive_gps():
    auth = request.headers.get("Authorization")
    if auth != "tQJxIjDs440Q":
        return "Unauthorized", 403

    data = request.get_json()
    if not data or "lat" not in data or "long" not in data or "device_id" not in data:
        return "Invalid data", 400

    try:
        lat = float(data["lat"])
        lon = float(data["long"])
        timestamp = data.get("timestamp", datetime.utcnow().isoformat())
        device_id = str(data["device_id"])
        day = timestamp[:10]  # YYYY-MM-DD
    except Exception as e:
        return f"Error parsing data: {str(e)}", 400

    conn = get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO gps_data (lat, lon, timestamp, device_id, day)
        VALUES (?, ?, ?, ?, ?)
    """, (lat, lon, timestamp, device_id, day))
    conn.commit()
    conn.close()

    return "OK", 200


@app.route("/api/gps")
def api_gps():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM gps_data ORDER BY timestamp DESC LIMIT 1000")
    data = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(data)

@app.route("/api/gps/day/<day>")
def api_gps_day(day):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM gps_data WHERE day=? ORDER BY timestamp", (day,))
    data = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(data)

@app.route("/api/gps/days")
def api_gps_days():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT DISTINCT day FROM gps_data ORDER BY day DESC")
    days = [row["day"] for row in c.fetchall()]
    conn.close()
    return jsonify(days)

@app.route("/api/clear", methods=["POST"])
def clear_gps_data():
    auth = request.headers.get("Authorization")
    if auth != "tQJxIjDs440Q":
        return "Unauthorized", 403
    gps_data.clear()
    return "Cleared", 200

@app.route("/api/save-field", methods=["POST"])
def save_field():
    data = request.get_json()
    if not data:
        return "Invalid data", 400
    conn = get_db()
    c = conn.cursor()
    for field_id, field in data.items():
        c.execute("""
            INSERT OR REPLACE INTO fields (id, name, fileName, geojson)
            VALUES (?, ?, ?, ?)
        """, (field_id, field.get("name", field_id), field.get("fileName", ""), json.dumps(field.get("geojson", {}))))
    conn.commit()
    conn.close()
    return "OK", 200

@app.route("/api/save-task", methods=["POST"])
def save_task():
    data = request.get_json()
    if not isinstance(data, list):
        return "Invalid data, expected list", 400
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM tasks")
    c.execute("DELETE FROM task_fields")
    for task in data:
        c.execute("""
            INSERT INTO tasks (id, name, color, status, createdAt)
            VALUES (?, ?, ?, ?, ?)
        """, (task["id"], task["name"], task["color"], task.get("status", ""), task.get("createdAt", "")))
        for field in task["fields"]:
            c.execute("""
                INSERT INTO task_fields (task_id, field_id, completed)
                VALUES (?, ?, ?)
            """, (task["id"], field["id"], int(field.get("completed", False))))
    conn.commit()
    conn.close()
    return jsonify({"status": "ok", "count": len(data)}), 200

@app.route("/api/get-fields")
def get_fields():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM fields")
    fields = {row["id"]: {"name": row["name"], "fileName": row["fileName"], "geojson": json.loads(row["geojson"])} for row in c.fetchall()}
    conn.close()
    return jsonify(fields)

@app.route("/api/get-tasks")
def get_tasks():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM tasks")
    tasks = []
    for row in c.fetchall():
        task = dict(row)
        c2 = conn.cursor()
        c2.execute("SELECT field_id, completed FROM task_fields WHERE task_id=?", (task["id"],))
        fields = [{"id": f["field_id"], "completed": bool(f["completed"])} for f in c2.fetchall()]
        task["fields"] = fields
        tasks.append(task)
    conn.close()
    return jsonify(tasks)

@app.route('/api/list-kml')
def list_kml_files():
    kml_dir = os.path.join(app.static_folder, 'fields')
    try:
        files = [f for f in os.listdir(kml_dir) if f.endswith('.kml')]
        return jsonify(files)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def delete_km_entries(entry_id=None):
    try:
        if entry_id:
            # Einzelnen Eintrag löschen
            response = requests.delete(f'/api/list-km/{entry_id}')
        else:
            # Alle Einträge löschen
            response = requests.delete('/api/list-km/all')
            
        if response.status_code == 200:
            return True
        return False
    except Exception as e:
        print(f"Fehler beim Löschen: {str(e)}")
        return False
