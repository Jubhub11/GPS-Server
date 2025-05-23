from flask import Flask, request

app = Flask(__name__)

@app.route('/geolinker', methods=['POST'])
def receive_location():
    data = request.json
    print(f"Received location: {data}")
    return {'status': 'received'}, 200

@app.route('/')
def home():
    return "GPS Server läuft!", 200
