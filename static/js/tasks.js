const taskColors = {};
const availableColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', 
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
];

let tasks = [];
let isCreatingTask = false; //Modus zur Aufgabenerstellung
let selectedFields = new Set();

// Startet die Erstellung eines neuen Auftrags
function createNewTask() {
  const btn = document.getElementById("new-task-btn");
  if (isCreatingTask) {
    finishTaskCreation();
  } else {
    isCreatingTask = true;
    selectedFields.clear();
    alert('Bitte wählen Sie die Felder für den neuen Auftrag aus');
    btn.textContent = "📝 Auftrag erstellen";
  }
}

// Beendet die Aufgabenerstellung und speichert den neuen Auftrag
function finishTaskCreation() {
  const btn = document.getElementById("new-task-btn");

  if (selectedFields.size === 0) {
    alert('Auftrag erstellen abgebrochen: Keine Felder ausgewählt.');
    btn.textContent = "➕ Neuer Auftrag";
    isCreatingTask = false;
    return;
  }

  const taskName = prompt('Bitte geben Sie einen Namen für den Auftrag ein:', `Auftrag ${tasks.length + 1}`);
  if (!taskName) { isCreatingTask = false; return; }

  const taskId = `task-${Date.now()}`;
  const taskColor = getTaskColor(taskId);
  
  const task = {
    id: taskId,
    name: taskName,
    color: taskColor,
    fields: Array.from(selectedFields).map(fieldId => ({
      id: fieldId,
      completed: false
    })),
    status: 'in_progress',
    createdAt: new Date().toISOString()
  };

  tasks.push(task);
  
  task.fields.forEach(field => {
    if (fields[field.id]) {
      fields[field.id].layer.setStyle({
        color: taskColor,
        fillColor: taskColor,
        weight: 2,
        opacity: 0.6,
        fillOpacity: 0.2
      });
    }
  });

  saveTasksToServer();
  updateTaskPanel();
  updateTaskLegend();
  btn.textContent = "➕ Neuer Auftrag";
  isCreatingTask = false;
  selectedFields.clear();
}

// Aktualisiert die Legende der Aufträge
function updateTaskPanel() {
  const taskContainer = document.getElementById('active-tasks');
  taskContainer.innerHTML = '';

  tasks.forEach(task => {
    const completedFields = task.fields.filter(f => f.completed).length;
    const totalFields = task.fields.length;
    const progress = (completedFields / totalFields) * 100;

    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    taskElement.style.borderLeft = `4px solid ${task.color}`;
    taskElement.innerHTML = `
      <h4>${task.name}</h4>
      <div class="task-progress">
        <div class="progress-bar" style="width: ${progress}%; background-color: ${task.color}"></div>
      </div>
      <div>Fortschritt: ${completedFields}/${totalFields} Felder</div>
      <div class="field-list">
        ${task.fields.map(field => `
          <div class="field-item">
            <input type="checkbox" 
              ${field.completed ? 'checked' : ''} 
              onchange="toggleFieldCompletion('${task.id}', '${field.id}')"
            >
            <span>${field.id}</span>
          </div>
        `).join('')}
      </div>
      <div class="task-buttons">
        ${task.fields.every(f => f.completed) ? 
          `<button onclick="deleteTask('${task.id}')">Auftrag löschen</button>` :
          ''
        }
      </div>
    `;
    taskContainer.appendChild(taskElement);
  });
  
  updateTaskLegend();
}

function toggleFieldCompletion(taskId, fieldId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    const field = task.fields.find(f => f.id === fieldId);
    if (field) {
      field.completed = !field.completed;
      
      fields[fieldId].layer.setStyle({
        color: task.color,
        fillColor: task.color,
        fillOpacity: field.completed ? 0.4 : 0.2
      });
      
      updateTaskPanel();
      saveTasksToServer();
    }
  }
}

function deleteTask(taskId) {
  if (!confirm('Möchten Sie diesen Auftrag wirklich löschen?')) return;
  
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex !== -1) {
    const task = tasks[taskIndex];
    
    task.fields.forEach(field => {
      if (fields[field.id]) {
        fields[field.id].layer.setStyle({
          color: '#3388ff',
          fillColor: '#3388ff',
          fillOpacity: 0.2
        });
      }
    });
    
    delete taskColors[task.id];
    tasks.splice(taskIndex, 1);
    saveTasksToServer();
    updateTaskPanel();
    updateTaskLegend();
  }
}

// Weist einer Aufgabe eine eindeutige Farbe zu
function getTaskColor(taskId) {
  if (!taskColors[taskId]) {
    const usedColors = Object.values(taskColors);
    const availableColor = availableColors.find(color => !usedColors.includes(color)) || availableColors[0];
    taskColors[taskId] = availableColor;
  }
  return taskColors[taskId];
}

async function saveTasksToServer() {
  try {
    const res = await fetch('/api/save-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Häufiger erwartet: Objekt statt rohes Array
      body: JSON.stringify(tasks)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Save failed (${res.status}): ${text}`);
    }

    // Falls der Server 204 No Content sendet, würde res.json() scheitern:
    // Also nur optional lesen:
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    }
    return data;
  } catch (err) {
    console.error('Error saving tasks:', err);
    alert('Speichern fehlgeschlagen. Details in der Konsole.');
    throw err;
  }
}

// Lädt gespeicherte Tasks vom Server und aktualisiert das Panel
async function loadTasksFromServer() {
  try {
    const res = await fetch('/api/get-stored-data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.tasks && Array.isArray(data.tasks)) {
      tasks = data.tasks;
      console.log("Tasks vom Server geladen:", tasks);

      // UI aktualisieren
      updateTaskPanel();
      applyTaskStyles();
    } else {
      console.log("Keine gespeicherten Tasks gefunden.");
    }
  } catch (err) {
    console.error('Fehler beim Laden der gespeicherten Tasks:', err);
  }
}

window.onload = async () => {
  await loadTasksFromServer(); // holt gespeicherte Tasks vom Server zurück
};
