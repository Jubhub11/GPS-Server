// fields.js
import { addGeoJSON, onLayerClick } from './map.js';

export const fields = {};

export async function loadFields(updateFieldListCallback) {
  const res = await fetch('/api/list-kml');
  const files = await res.json();

  for (const file of files) {
    const url = `/static/fields/${file}`;
    const response = await fetch(url);
    const kmlText = await response.text();
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlText, 'text/xml');
    const geojson = toGeoJSON.kml(kml);

    geojson.features.forEach((feature, index) => {
      const fieldId = feature.properties.name || `${file}-${index + 1}`;
      if (fields[fieldId]) return;

      const layer = addGeoJSON(feature, {
        style: {
          color: '#3388ff',
          fillColor: '#3388ff',
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.2
        }
      });

      onLayerClick(layer, () => updateFieldSelection(fieldId));

      fields[fieldId] = {
        layer,
        name: fieldId,
        fileName: file,
        geojson: feature
      };
    });
  }

  updateFieldListCallback();
}

export function updateFieldSelection(fieldId, selected, color = '#ff3333') {
  const field = fields[fieldId];
  if (!field) return;

  field.layer.setStyle({
    color: selected ? color : '#3388ff',
    fillColor: selected ? color : '#3388ff',
    fillOpacity: selected ? 0.4 : 0.2
  });
}
