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

function updateLegend() {
  const legendList = document.getElementById("legend-list");
  legendList.innerHTML = "";
  for (const [id, color] of Object.entries(deviceColors)) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="legend-color" style="background:${color}"></span>${id}`;
    legendList.appendChild(li);
  }
}

function updateTaskLegend() {
  const legendList = document.getElementById('legend-list');
  legendList.innerHTML = '<h4>Aufträge</h4>';
  
  tasks.forEach(task => {
    const completedFields = task.fields.filter(f => f.completed).length;
    const totalFields = task.fields.length;
    
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="legend-color" style="background:${task.color}"></span>
      ${task.name} (${completedFields}/${totalFields})
    `;
    legendList.appendChild(li);
  });
}
