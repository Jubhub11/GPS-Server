export let map;
export function initMap() {
  map = L.map('map').setView([47.7381, 16.3969], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  return map;
}

export function fitMapToBounds(bounds) {
  if (bounds.length > 0) {
    const latLngBounds = L.latLngBounds(bounds);
    map.fitBounds(latLngBounds);
  }
}

export function panTo(lat, lon) {
  map.panTo([lat, lon]);
}

export function removeLayer(layer) {
  map.removeLayer(layer);
} 

export function addGeoJSON(geojson, options) {
  return L.geoJSON(geojson, options).addTo(map);
}

export function addPolyline(latlngs, options) {
  return L.polyline(latlngs, options).addTo(map);
}

export function addCircleMarker(coords, options) {
  return L.circleMarker(coords, options).addTo(map);
}

export function onLayerClick(layer, handler) {
  layer.on('click', handler);
}
