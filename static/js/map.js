// map.js
export let map;

export function initializeMap() {
  map = L.map('map').setView([47.7381, 16.3969], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}