import os
import sqlite3
import json
import uuid
from lxml import etree
from shapely.geometry import Polygon, MultiPolygon, LineString, mapping
import sqlite3

DB_FILE = "database.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS fields (
            id TEXT PRIMARY KEY,
            name TEXT,
            fileName TEXT,
            geojson TEXT
        )
    """)
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("✅ Tabelle 'fields' erstellt (falls sie noch nicht existierte).")
DB_FILE = "database.db"
KML_DIR = "static/fields"

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def parse_coordinates(coord_text):
    """KML Koordinaten-Text in Liste von [lon, lat] umwandeln"""
    coords = []
    for line in coord_text.strip().split():
        parts = line.split(',')
        if len(parts) >= 2:
            lon, lat = float(parts[0]), float(parts[1])
            coords.append([lon, lat])
    return coords

def extract_geometry(placemark, ns):
    """Versucht Polygon, MultiGeometry oder LineString zu extrahieren"""
    polygon_elem = placemark.find('.//kml:Polygon', namespaces=ns)
    if polygon_elem is not None:
        coords_elem = polygon_elem.find('.//kml:coordinates', namespaces=ns)
        if coords_elem is not None and coords_elem.text:
            coords = parse_coordinates(coords_elem.text)
            if coords:
                return Polygon(coords)

    # MultiGeometry: mehrere Geometrien innerhalb eines Placemarks
    multi_elem = placemark.find('.//kml:MultiGeometry', namespaces=ns)
    if multi_elem is not None:
        polygons = []
        for poly_elem in multi_elem.findall('.//kml:Polygon', namespaces=ns):
            coords_elem = poly_elem.find('.//kml:coordinates', namespaces=ns)
            if coords_elem is not None and coords_elem.text:
                coords = parse_coordinates(coords_elem.text)
                if coords:
                    polygons.append(Polygon(coords))
        if polygons:
            return MultiPolygon(polygons)

    # LineString
    line_elem = placemark.find('.//kml:LineString', namespaces=ns)
    if line_elem is not None:
        coords_elem = line_elem.find('.//kml:coordinates', namespaces=ns)
        if coords_elem is not None and coords_elem.text:
            coords = parse_coordinates(coords_elem.text)
            if coords:
                return LineString(coords)

    return None  # keine Geometrie gefunden

def kml_to_geojson(file_path):
    with open(file_path, 'rb') as f:
        tree = etree.parse(f)
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}

    features = []
    for placemark in tree.xpath('//kml:Placemark', namespaces=ns):
        name_elem = placemark.find('kml:name', namespaces=ns)
        name = name_elem.text if name_elem is not None else None

        geom = extract_geometry(placemark, ns)
        if geom is not None:
            features.append({
                "type": "Feature",
                "geometry": mapping(geom),
                "properties": {"name": name}
            })

    return {"type": "FeatureCollection", "features": features}

def import_kml_file(file_path, conn):
    geojson = kml_to_geojson(file_path)
    if not geojson['features']:
        print(f"⚠️ Keine Features in {file_path}")
        return

    c = conn.cursor()
    field_id = str(uuid.uuid4())
    file_name = os.path.basename(file_path)
    c.execute("""
        INSERT OR REPLACE INTO fields (id, name, fileName, geojson)
        VALUES (?, ?, ?, ?)
    """, (field_id, file_name, file_name, json.dumps(geojson)))
    print(f"✅ Importiert: {file_name}")

def main():
    conn = get_db()
    kml_files = [f for f in os.listdir(KML_DIR) if f.lower().endswith(".kml")]
    for kml_file in kml_files:
        import_kml_file(os.path.join(KML_DIR, kml_file), conn)
    conn.commit()
    conn.close()
    print("🎉 Alle KML-Dateien importiert.")

if __name__ == "__main__":
    main()
