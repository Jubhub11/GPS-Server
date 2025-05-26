import { removeLayer, addPolyline, addCircleMarker, panTo } from './map.js';

let markers = [];
let polylines = {};
const deviceColors = {};
const colorList = ['red', 'blue', 'green', 'orange', 'purple', 'magenta', 'teal', 'brown'];

function getColor(deviceId) {
  if (!deviceColors[deviceId]) {
    const idx = Object.keys(deviceColors).length % colorList.length;
    deviceColors[deviceId] = colorList[idx];
  }
  return deviceColors[deviceId];
}

function formatTimeAgo(timestamp) {
  const time = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - time) / 1000);
  if (seconds < 60) return `${seconds} Sekunden`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} Minuten`;
  const hours = Math.floor(minutes / 60);
  return `${hours} Stunden`;
}

export async function fetchGPSData() {
  const res = await fetch('/api/gps');
  const data = await res.json();

  markers.forEach(m => removeLayer(m));
  markers = [];

  Object.values(polylines).forEach(p => removeLayer(p));
  polylines = {};

  const grouped = {};
  data.forEach(p => {
    if (!grouped[p.device_id]) grouped[p.device_id] = [];
    grouped[p.device_id].push(p);
  });

  for (const id in grouped) {
    const color = getColor(id);
    const latlngs = grouped[id].map(p => [p.lat, p.lon]);
    polylines[id] = addPolyline(latlngs, { color });

    grouped[id].forEach(p => {
      const marker = addCircleMarker([p.lat, p.lon], {
        radius: 6,
        fillColor: color,
        color,
        weight: 1,
        fillOpacity: 0.8
      }).bindPopup(`${id}<br>vor ${formatTimeAgo(p.timestamp)}`);

      markers.push(marker);
    });
  }

  if (data.length > 0 && document.getElementById('auto-center').checked) {
    const last = data[data.length - 1];
    panTo(last.lat, last.lon);
  }
}
