let map;
let markers = [];
let polylines = {};

// Map initialization
function initMap() {
  map = L.map('map').setView([47.7381, 16.3969], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

// GPS data fetching
async function fetchGPSData() {
  // GPS data fetching code...
}

// Reset track
async function resetTrack() {
  // Reset track code...
}

// Initialize
(async function() {
  initMap();
  await loadFields();
  await loadStoredData();
  applyTaskStyles();
  fetchGPSData();
  setInterval(fetchGPSData, 10000);
})();
