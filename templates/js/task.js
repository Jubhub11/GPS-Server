import { fields, updateFieldSelection } from './fields.js';

export let tasks = [];
export const taskColors = {};
const availableColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', 
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
];

export function getTaskColor(taskId) {
  if (!taskColors[taskId]) {
    const used = Object.values(taskColors);
    const next = availableColors.find(c => !used.includes(c)) || availableColors[0];
    taskColors[taskId] = next;
  }
  return taskColors[taskId];
}

export function createTask(name, selectedFieldIds) {
  const id = `task-${Date.now()}`;
  const color = getTaskColor(id);

  const task = {
    id,
    name,
    color,
    fields: selectedFieldIds.map(id => ({ id, completed: false })),
    status: 'in_progress'
  };

  tasks.push(task);

  task.fields.forEach(field => {
    updateFieldSelection(field.id, true, color);
  });
}

export function toggleFieldCompletion(taskId, fieldId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  const field = task.fields.find(f => f.id === fieldId);
  if (!field) return;

  field.completed = !field.completed;
  updateFieldSelection(field.id, true, task.color);
}
