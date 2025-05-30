// gps.js
import { map } from './map.js';

let markers = [], polylines = {}, deviceColors = {};
const colorList = ['red', 'blue', 'green', 'orange', 'purple'];

export async function fetchGPSData() {
  const res = await fetch('/api/gps');
  const data = await res.json();

  markers.forEach(m => map.removeLayer(m));
  Object.values(polylines).forEach(p => map.removeLayer(p));
  markers = [];
  polylines = {};

  const groups = {};
  data.forEach(d => {
    if (!groups[d.device_id]) groups[d.device_id] = [];
    groups[d.device_id].push(d);
  });

  Object.entries(groups).forEach(([id, points]) => {
    const color = getColor(id);
    const latlngs = points.map(p => [p.lat, p.lon]);
    polylines[id] = L.polyline(latlngs, { color }).addTo(map);

    points.forEach(p => {
      const m = L.circleMarker([p.lat, p.lon], {
        radius: 6,
        fillColor: color,
        color,
        weight: 1,
        fillOpacity: 0.8
      }).bindPopup(`${id}<br>${new Date(p.timestamp).toLocaleString()}`);
      m.addTo(map);
      markers.push(m);
    });
  });
}

function getColor(id) {
  if (!deviceColors[id]) {
    const index = Object.keys(deviceColors).length % colorList.length;
    deviceColors[id] = colorList[index];
  }
  return deviceColors[id];
}
