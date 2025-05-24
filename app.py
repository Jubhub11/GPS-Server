from flask import Flask, request, jsonify, render_template
from datetime import datetime
import json
import os

app = Flask(__name__)

gps_data = []  # Liste zum Speichern der GPS-Punkte
DATA_FILE = 'stored_data.json'

# Lade gespeicherte Daten beim Start
def load_stored_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except:
            return {'fields': {}, 'tasks': []}
    return {'fields': {}, 'tasks': []}

# Speichere Daten in JSON-Datei
def save_stored_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)

# Initialisiere gespeicherte Daten
stored_data = load_stored_data()

@app.route("/")
def index():
    return render_template("map.html", points=gps_data)

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
    except Exception as e:
        return f"Error parsing data: {str(e)}", 400

    gps_data.append({
        "lat": lat,
        "lon": lon,
        "timestamp": timestamp,
        "device_id": device_id
    })

    return "OK", 200

@app.route("/api/gps")
def api_gps():
    return jsonify(gps_data)

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
    print(data)
    if not data:
        return "Invalid data", 400
    
    stored_data['fields'].update(data)
    save_stored_data(stored_data)
    return "OK", 200

@app.route("/api/save-task", methods=["POST"])
def save_task():
    data = request.get_json()
    if not data:
        return "Invalid data", 400
    
    stored_data['tasks'] = data
    save_stored_data(stored_data)
    return "OK", 200

@app.route("/api/get-stored-data")
def get_stored_data():
    return jsonify(stored_data)

@app.route('/api/list-kml')
def list_kml_files():
    kml_dir = os.path.join(app.static_folder, 'fields')
    try:
        files = [f for f in os.listdir(kml_dir) if f.endswith('.kml')]
        return jsonify(files)
    except Exception as e:
        return jsonify({"error": str(e)}), 500