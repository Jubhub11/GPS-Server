// main.js
import { initMap } from './map.js';
import { loadFields } from './fields.js';
import { loadStoredData, applyTaskStyles, setupTaskEvents } from './tasks.js';
import { fetchGPSData, setupResetButton } from './gps.js';

async function start() {
  initMap();
  await loadFields();
  await loadStoredData();
  applyTaskStyles();
  fetchGPSData();
  setInterval(fetchGPSData, 10000);
}

setupResetButton();
setupTaskEvents();
start();
