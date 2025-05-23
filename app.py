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
    if not data or "lat" not in data or "long" not in data:
        return "Invalid data", 400

    lat = data["lat"][0]
    lon = data["long"][0]
    timestamp = data["timestamp"][0] if "timestamp" in data else datetime.utcnow().isoformat()
    gps_data.append({"lat": lat, "lon": lon, "timestamp": timestamp})
    return "OK", 200

@app.route("/api/gps")
def api_gps():
    return jsonify(gps_data)
