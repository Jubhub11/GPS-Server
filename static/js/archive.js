async function loadDays() {
  const res = await fetch('/api/gps/days');
  const days = await res.json();
  // Zeige die Tage z.B. als Dropdown oder Liste an
}
async function loadGPSForDay(day) {
  const res = await fetch(`/api/gps/day/${day}`);
  const gpsPoints = await res.json();
  // Zeige die Punkte auf der Karte oder in einer Tabelle
}

async function setupDayDropdown() {
  const res = await fetch('/api/gps/days');
  const days = await res.json();
  const select = document.getElementById('day-select');
  select.innerHTML = '';
  days.forEach(day => {
    const option = document.createElement('option');
    option.value = day;
    option.textContent = day;
    select.appendChild(option);
  });
  select.onchange = () => loadGPSForDay(select.value);
}