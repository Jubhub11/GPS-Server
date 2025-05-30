// tasks.js
import { fields } from './fields.js';

let tasks = [];
export async function loadTasks() {
  const res = await fetch('/api/get-stored-data');
  const data = await res.json();
  tasks = data.tasks;
  applyTaskStyles();
}

function applyTaskStyles() {
  tasks.forEach(task => {
    task.fields.forEach(f => {
      const field = fields[f.id];
      if (field) {
        field.layer.setStyle({
          color: task.color,
          fillColor: task.color,
          weight: 2,
          opacity: 0.6,
          fillOpacity: f.completed ? 0.4 : 0.2
        });
      }
    });
  });
}