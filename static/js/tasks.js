const taskColors = {};
const availableColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', 
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
];

let tasks = [];
let isCreatingTask = false;
let selectedFields = new Set();

function createNewTask() {
  if (isCreatingTask) {
    finishTaskCreation();
  } else {
    isCreatingTask = true;
    selectedFields.clear();
    alert('Bitte wählen Sie die Felder für den neuen Auftrag aus');
  }
}

function finishTaskCreation() {
  if (selectedFields.size === 0) {
    alert('Bitte wählen Sie mindestens ein Feld aus');
    return;
  }

  const taskName = prompt('Bitte geben Sie einen Namen für den Auftrag ein:', `Auftrag ${tasks.length + 1}`);
  if (!taskName) return;

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
  
  isCreatingTask = false;
  selectedFields.clear();
}

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
    await fetch('/api/save-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tasks)
    });
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
}
