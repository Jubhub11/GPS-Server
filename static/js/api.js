async function apiGet(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPost(url, data) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// Felder
async function fetchFields() {
  return apiGet("/api/fields");
}
async function fetchFieldsForJob(jobId) {
  return apiGet(`/api/fields_for_job/${jobId}`);
}

// Jobs
async function fetchJobs() {
  return apiGet("/api/jobs");
}
async function createJob(name, fieldIds) {
  return apiPost("/api/jobs", { name, field_ids: fieldIds });
}

// Tracker
async function fetchLatestTrackers() {
  return apiGet("/api/trackers/latest");
}
