from flask import Flask, request, jsonify, render_template
from datetime import datetime

app = Flask(__name__)

gps_data = []  # Liste zum Speichern der GPS-Punkte

@app.route("/")
def index():
    return render_template("map.html", points=gps_data)

@app.route("/gps", methods=["POST"])
def receive_gps():
    auth = request.headers.get("Authorization")
    if auth != "tQJxIjDs440Q":
        return "Unauthorized", 403

    data = request.get_json()

    # Prüfe, ob alle benötigten Felder vorhanden sind
    if not data or "lat" not in data or "long" not in data or "device_id" not in data:
        return "Invalid data", 400

    try:
        lat = float(data["lat"])
        lon = float(data["long"])
        timestamp = data.get("timestamp", datetime.utcnow().isoformat())
        device_id = str(data["ID"])
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
