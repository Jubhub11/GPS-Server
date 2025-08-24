// Leaflet Karte & Layer-Verwaltung
let map;
let fieldLayerGroup = L.layerGroup();        // enthält alle aktuell gezeigten Felder
let trackersLayerGroup = L.layerGroup();     // enthält die neuesten Tracker-Positionen
let fieldLayersById = new Map();             // fieldId -> Layer (für spätere Entfernung)

function initMap() {
  map = L.map("map", { zoomControl: true }).setView([48.2082, 16.3738], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  fieldLayerGroup.addTo(map);
  trackersLayerGroup.addTo(map);
}

// Hilfsfunktionen zum Laden von Feldern
async function addFieldToMap(field) {
  // field: {id, name, filepath, ftype}
  const url = `/fields/${field.filepath}`;

  // Bereits vorhanden? Erst entfernen (z.B. bei Re-Render)
  if (fieldLayersById.has(field.id)) {
    fieldLayerGroup.removeLayer(fieldLayersById.get(field.id));
    fieldLayersById.delete(field.id);
  }

  let layer = null;

  if (field.ftype === "kml") {
    // KML via leaflet-omnivore
    layer = omnivore.kml(url, null, L.geoJSON(null, {
      onEachFeature: (feature, lyr) => {
        lyr.bindPopup(`${field.name}`);
      },
      style: () => ({
        color: "#60a5fa",
        weight: 2,
        fillOpacity: 0.2
      })
    }));
    layer.on("ready", () => { /* bounds update optional */ });
    layer.addTo(fieldLayerGroup);
    fieldLayersById.set(field.id, layer);

  } else if (field.ftype === "shpzip") {
    // Shapefile (ZIP) via shp.js -> GeoJSON -> L.geoJSON
    const geojson = await window.shp(url);
    layer = L.geoJSON(geojson, {
      onEachFeature: (feature, lyr) => {
        lyr.bindPopup(`${field.name}`);
      },
      style: () => ({
        color: "#34d399",
        weight: 2,
        fillOpacity: 0.2
      })
    }).addTo(fieldLayerGroup);
    fieldLayersById.set(field.id, layer);
  }
}

function clearAllFieldsFromMap() {
  fieldLayerGroup.clearLayers();
  fieldLayersById.clear();
}

async function renderFields(fields) {
  clearAllFieldsFromMap();
  for (const f of fields) {
    try {
      await addFieldToMap(f);
    } catch (e) {
      console.error("Feld konnte nicht geladen werden:", f, e);
    }
  }
  // Optional: auf alle Felder zoomen
  try {
    const bounds = fieldLayerGroup.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.1));
  } catch {}
}

// Tracker Render
function renderTrackers(latestList) {
  trackersLayerGroup.clearLayers();
  latestList.forEach(t => {
    const m = L.marker([t.lat, t.lon]).bindPopup(
      `<b>${t.device_id}</b><br>${t.lat.toFixed(6)}, ${t.lon.toFixed(6)}<br><small>${t.timestamp}</small>`
    );
    m.addTo(trackersLayerGroup);
  });
}

window.__Map = { initMap, renderFields, renderTrackers };
