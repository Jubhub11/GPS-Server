// Erwartet: window.__Map.*, fetch* aus api.js
let ALL_FIELDS = [];
let ALL_JOBS = [];

const els = {
  fieldCount: document.getElementById("fieldCount"),
  fieldList: document.getElementById("fieldList"),
  jobSelect: document.getElementById("jobSelect"),
  filterByJob: document.getElementById("filterByJob"),
  trackerList: document.getElementById("trackerList"),
  newJobBtn: document.getElementById("newJobBtn")
};

async function init() {
  window.__Map.initMap();

  await loadFields();
  await loadJobs();

  // Standard: alle Felder anzeigen
  await window.__Map.renderFields(ALL_FIELDS);
  renderFieldSidebar(ALL_FIELDS);

  // Checkbox-Filter
  els.filterByJob.addEventListener("change", onFilterToggle);
  els.jobSelect.addEventListener("change", onFilterToggle);

  // Job anlegen
  els.newJobBtn.addEventListener("click", onCreateJob);

  // Tracker Polling
  pollTrackers();
  setInterval(pollTrackers, 5000);
}

async function loadFields() {
  ALL_FIELDS = await fetchFields();
  els.fieldCount.textContent = `${ALL_FIELDS.length} Felder`;
}

function renderFieldSidebar(fields) {
  els.fieldList.innerHTML = "";
  fields.forEach(f => {
    const li = document.createElement("li");
    li.textContent = f.name;
    els.fieldList.appendChild(li);
  });
}

async function loadJobs() {
  const jobs = await fetchJobs();
  ALL_JOBS = jobs;
  els.jobSelect.innerHTML = `<option value="">— Auftrag wählen —</option>`;
  jobs.forEach(j => {
    const opt = document.createElement("option");
    opt.value = j.id;
    opt.textContent = j.name;
    els.jobSelect.appendChild(opt);
  });
}

async function onFilterToggle() {
  // Wenn Checkbox aktiv und Job gewählt -> nur die Felder dieses Auftrags
  if (els.filterByJob.checked && els.jobSelect.value) {
    const jobId = parseInt(els.jobSelect.value, 10);
    const fields = await fetchFieldsForJob(jobId);
    await window.__Map.renderFields(fields);
    renderFieldSidebar(fields);
  } else {
    // sonst alle Felder sichtbar
    await window.__Map.renderFields(ALL_FIELDS);
    renderFieldSidebar(ALL_FIELDS);
  }
}

async function onCreateJob() {
  if (ALL_FIELDS.length === 0) {
    alert("Keine Felder vorhanden.");
    return;
  }
  const name = prompt("Name des neuen Auftrags:");
  if (!name) return;

  // einfache Mehrfachauswahl per Prompt (IDs kommasepariert) – für Produktion UI durch Mehrfachauswahl ersetzen
  const idsText = prompt(
    `Welche Felder zuweisen? IDs kommasepariert:\n` +
    ALL_FIELDS.map(f => `${f.id}: ${f.name}`).join("\n")
  );
  if (!idsText) return;

  const fieldIds = idsText
    .split(",")
    .map(x => parseInt(x.trim(), 10))
    .filter(x => !isNaN(x) && ALL_FIELDS.some(f => f.id === x));

  if (fieldIds.length === 0) {
    alert("Keine gültigen Feld-IDs gewählt.");
    return;
  }

  await createJob(name, fieldIds);
  await loadJobs();

  // Falls Filter aktiv und neuer Job gewählt werden soll
  const justCreated = ALL_JOBS.find(j => j.name === name);
  if (justCreated) {
    els.jobSelect.value = justCreated.id;
    els.filterByJob.checked = true;
    onFilterToggle();
  }
}

async function pollTrackers() {
  try {
    const latest = await fetchLatestTrackers();
    // Sidebar
    els.trackerList.innerHTML = "";
    latest.forEach(t => {
      const li = document.createElement("li");
      li.textContent = `${t.device_id} — ${t.lat.toFixed(5)}, ${t.lon.toFixed(5)} @ ${t.timestamp}`;
      els.trackerList.appendChild(li);
    });
    // Karte
    window.__Map.renderTrackers(latest);
  } catch (e) {
    console.warn("Tracker fetch failed:", e);
  }
}

init();
