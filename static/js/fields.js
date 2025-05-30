// fields.js
import { map } from './map.js';
export const fields = {};

export async function loadFields() {
  const res = await fetch('/api/list-kml');
  const files = await res.json();

  for (const file of files) {
    const url = `/static/fields/${file}`;
    const response = await fetch(url);
    const kmlText = await response.text();
    const kml = new DOMParser().parseFromString(kmlText, 'text/xml');
    const geojson = toGeoJSON.kml(kml);

    geojson.features.forEach((feature, index) => {
      const fieldId = feature.properties.name || `${file}-${index + 1}`;
      if (fields[fieldId]) return;

      const layer = L.geoJSON(feature, {
        style: { color: '#3388ff', fillColor: '#3388ff', weight: 2, opacity: 0.6, fillOpacity: 0.2 }
      }).addTo(map);

      fields[fieldId] = { layer, geojson: feature };
    });
  }
}