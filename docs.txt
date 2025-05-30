GPS Tracker System Dokumentation
Systemübersicht

Das GPS Tracker System ist eine webbasierte Anwendung zur Visualisierung von GPS-Tracks und Verwaltung von Feldaufträgen. Es besteht aus einem Flask-Backend und einem JavaScript-Frontend mit Leaflet für die Kartendarstellung.
Systemarchitektur
Backend (app.py)

    Flask-Server
    Verwaltet GPS-Daten
    Handhabt KML-Datei-Verwaltung
    Speichert Auftrags- und Felddaten

Frontend

    map.html: Hauptansicht
    Modulare JavaScript-Dateien:
        map.js: Karteninitialisierung und GPS-Tracking
        fields.js: Feldverwaltung und KML-Import
        tasks.js: Auftragsverwaltung
        legend.js: Legendendarstellung
    styles.css: Styling der Benutzeroberfläche

Hauptfunktionen
1. GPS-Tracking

    Echtzeitanzeige von GPS-Positionen
    Farbcodierte Tracks für verschiedene Geräte
    Automatische Aktualisierung alle 10 Sekunden
    Optional: Automatische Zentrierung auf neueste Position

2. Feldverwaltung

    Import von KML-Dateien
    Visualisierung von Feldern auf der Karte
    Feldauswahl für Aufträge
    Dropdown-Menü mit allen geladenen Feldern

3. Auftragsverwaltung

    Erstellung neuer Aufträge
    Zuweisung von Feldern zu Aufträgen
    Fortschrittsverfolgung
    Farbcodierte Darstellung von Aufträgen

Dateisystem-Struktur
project/
├── app.py
├── templates/
│   └── map.html
└── static/
    ├── css/
    │   └── styles.css
    ├── js/
    │   ├── map.js
    │   ├── tasks.js
    │   ├── fields.js
    │   └── legend.js
    └── fields/
        └── [KML-Dateien]
API-Endpunkte

    /api/gps: GPS-Daten abrufen/speichern
    /api/clear: GPS-Tracks zurücksetzen
    /api/list-kml: Liste verfügbarer KML-Dateien
    /api/save-task: Aufträge speichern
    /api/get-stored-data: Gespeicherte Daten abrufen
