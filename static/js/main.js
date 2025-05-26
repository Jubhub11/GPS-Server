import { initMap } from './map.js';
import { loadFields } from './fields.js';
import { loadStoredData, applyTaskStyles } from './tasks.js';
import { fetchGPSData } from './gps.js';

async function initializeApp() {
  console.log("🧭 Initialisiere GPS-Tracker");

  // 1. Karte aufbauen
  initMap();

  // 2. Felder und Aufgaben laden
  await loadFields();
  await loadStoredData();

  // 3. Aufgabenstile auf Felder anwenden
  applyTaskStyles();

  // 4. GPS-Daten holen + zyklisch aktualisieren
  await fetchGPSData();
  setInterval(fetchGPSData, 10000);
}

initializeApp();
