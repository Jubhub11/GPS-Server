from flask import Flask, request, jsonify, send_from_directory, render_template
import sqlite3, os, glob
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__, static_folder="static", template_folder="templates")

CORS(app)

DB_FILE = "database.db"
FIELDS_DIR = "fields"

# Optionaler API-Key (falls gesetzt, wird der "Authorization"-Header geprüft)
API_KEY = os.environ.get("GPS_API_KEY", None)  # z.B. export GPS_API_KEY="tQJxIjDs440Q"


def db():
    return sqlite3.connect(DB_FILE)


def init_db():
    conn = db()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS fields (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            filepath TEXT,     -- relativer Pfad in /fields
            ftype TEXT         -- 'kml' oder 'shpzip'
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS trackers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT,
            lat REAL,
            lon REAL,
            timestamp TEXT      -- beliebiges Zeitformat wie vom Gerät geliefert
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS job_fields (
            job_id INTEGER,
            field_id INTEGER
        )
    """)
    conn.commit()
    conn.close()


def import_fields():
    """Scanne /fields nach .kml und .zip (Shapefile-Bundles) und trage neue ein."""
    conn = db()
    c = conn.cursor()

    kmls = glob.glob(os.path.join(FIELDS_DIR, "*.kml"))
    zips = glob.glob(os.path.join(FIELDS_DIR, "*.zip"))  # erwartet Shapefile-Bundle als ZIP

    def upsert(path, ftype):
        name = os.path.splitext(os.path.basename(path))[0]
        relpath = os.path.basename(path)
        c.execute("SELECT id FROM fields WHERE name=? AND filepath=?", (name, relpath))
        if not c.fetchone():
            c.execute("INSERT INTO fields (name, filepath, ftype) VALUES (?, ?, ?)",
                      (name, relpath, ftype))

    for p in kmls:
        upsert(p, "kml")

    for p in zips:
        upsert(p, "shpzip")

    conn.commit()
    conn.close()


@app.route("/")
def index():
    return render_template("index.html")

# ---------- Felder ----------
@app.route("/api/fields", methods=["GET"])
def get_fields():
    conn = db()
    c = conn.cursor()
    c.execute("SELECT id, name, filepath, ftype FROM fields ORDER BY name")
    rows = c.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "name": r[1], "filepath": r[2], "ftype": r[3]} for r in rows])


@app.route("/api/fields_for_job/<int:job_id>", methods=["GET"])
def fields_for_job(job_id):
    conn = db()
    c = conn.cursor()
    c.execute("""
        SELECT f.id, f.name, f.filepath, f.ftype
        FROM fields f
        JOIN job_fields jf ON f.id = jf.field_id
        WHERE jf.job_id=?
        ORDER BY f.name
    """, (job_id,))
    rows = c.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "name": r[1], "filepath": r[2], "ftype": r[3]} for r in rows])


@app.route("/fields/<path:filename>")
def serve_field_file(filename):
    # dient dem Frontend zum Laden von KML/ZIP
    return send_from_directory(FIELDS_DIR, filename)


# ---------- Jobs ----------
@app.route("/api/jobs", methods=["GET", "POST"])
def jobs():
    conn = db()
    c = conn.cursor()
    if request.method == "POST":
        data = request.json
        name = data.get("name", "Auftrag")
        field_ids = data.get("field_ids", [])
        c.execute("INSERT INTO jobs (name) VALUES (?)", (name,))
        job_id = c.lastrowid
        for fid in field_ids:
            c.execute("INSERT INTO job_fields (job_id, field_id) VALUES (?, ?)", (job_id, fid))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok", "job_id": job_id})
    else:
        c.execute("SELECT id, name FROM jobs ORDER BY id DESC")
        rows = c.fetchall()
        conn.close()
        return jsonify([{"id": r[0], "name": r[1]} for r in rows])


# ---------- Tracker ----------
@app.route("/api/track", methods=["POST"])
def track():
    # Optionaler API-Key
    if API_KEY:
        auth = request.headers.get("Authorization", "")
        if auth.strip() != API_KEY:
            return jsonify({"error": "unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    # erwartetes Format (DEIN ESP32):
    # { "timestamp": "...", "lat": 48.x, "long": 16.x, "device_id": "ESP32_001" }
    try:
        device_id = str(data["device_id"])
        lat = float(data["lat"])
        lon = float(data["long"])  # Feld heißt 'long' bei dir
        timestamp = str(data.get("timestamp") or datetime.utcnow().isoformat())
    except Exception as e:
        return jsonify({"error": f"bad payload: {e}"}), 400

    conn = db()
    c = conn.cursor()
    c.execute("INSERT INTO trackers (device_id, lat, lon, timestamp) VALUES (?, ?, ?, ?)",
              (device_id, lat, lon, timestamp))
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"}), 200


@app.route("/api/trackers/latest", methods=["GET"])
def trackers_latest():
    """Neueste Position je Gerät."""
    conn = db()
    c = conn.cursor()
    c.execute("""
        SELECT t1.device_id, t1.lat, t1.lon, t1.timestamp
        FROM trackers t1
        JOIN (
            SELECT device_id, MAX(id) AS maxid
            FROM trackers
            GROUP BY device_id
        ) t2 ON t1.device_id = t2.device_id AND t1.id = t2.maxid
        ORDER BY t1.device_id
    """)
    rows = c.fetchall()
    conn.close()
    return jsonify([{"device_id": r[0], "lat": r[1], "lon": r[2], "timestamp": r[3]} for r in rows])


if __name__ == "__main__":
    os.makedirs(FIELDS_DIR, exist_ok=True)
    init_db()
    import_fields()
    app.run(host="0.0.0.0", port=5000, debug=True)
