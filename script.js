const STORAGE_KEY = "studentPlannerTasks";

const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskSubject = document.getElementById("taskSubject");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");
const taskType = document.getElementById("taskType");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let tasks = loadTasks();
let editingId = null;

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  return new Date(dateString + "T00:00:00").toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric"
  });
}

function renderTasks() {
  const query = searchInput.value.trim().toLowerCase();
  const filter = filterSelect.value;

  const visibleTasks = tasks.filter(task => {
    const matchesText = [task.title, task.subject, task.type]
      .join(" ").toLowerCase().includes(query);
    const matchesFilter = filter === "all" ||
      (filter === "completed" && task.completed) ||
      (filter === "pending" && !task.completed);
    return matchesText && matchesFilter;
  });

  taskList.innerHTML = "";
  emptyState.classList.toggle("hidden", visibleTasks.length > 0);
  if (!visibleTasks.length) {
    emptyState.textContent = tasks.length
      ? "No tasks match your search or filter."
      : "✨ No tasks yet. Add your first task to get started!";
  }

  visibleTasks.sort((a, b) => a.date.localeCompare(b.date)).forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.title} as completed`);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const content = document.createElement("div");
    content.className = "task-content";

    const title = document.createElement("p");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";
    const subject = document.createElement("span");
    subject.textContent = task.subject || "General";
    const due = document.createElement("span");
    due.textContent = `Due: ${formatDate(task.date)}`;
    const type = document.createElement("span");
    type.textContent = task.type;
    const priority = document.createElement("span");
    priority.className = `pill priority-${task.priority.toLowerCase()}`;
    priority.textContent = task.priority;

    meta.append(subject, due, type, priority);
    content.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const editButton = document.createElement("button");
    editButton.className = "icon-btn";
    editButton.type = "button";
    editButton.textContent = "✎";
    editButton.title = "Edit task";
    editButton.setAttribute("aria-label", `Edit ${task.title}`);
    editButton.addEventListener("click", () => startEdit(task.id));

    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.title = "Delete task";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    actions.append(editButton, deleteButton);
    item.append(checkbox, content, actions);
    taskList.append(item);
  });

  document.getElementById("totalCount").textContent = tasks.length;
  document.getElementById("pendingCount").textContent = tasks.filter(t => !t.completed).length;
  document.getElementById("completedCount").textContent = tasks.filter(t => t.completed).length;
  document.getElementById("listCount").textContent = `${visibleTasks.length} task${visibleTasks.length === 1 ? "" : "s"}`;
}

function resetForm() {
  taskForm.reset();
  editingId = null;
  document.getElementById("formTitle").textContent = "Add a new task";
  submitBtn.textContent = "＋ Add task";
  cancelEditBtn.classList.add("hidden");
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = taskTitle.value.trim();
  if (!title || !taskDate.value) return;

  const taskData = {
    title,
    subject: taskSubject.value.trim(),
    date: taskDate.value,
    priority: taskPriority.value,
    type: taskType.value
  };

  if (editingId) {
    tasks = tasks.map(task => task.id === editingId ? { ...task, ...taskData } : task);
  } else {
    tasks.push({ id: makeId(), ...taskData, completed: false });
  }

  saveTasks();
  resetForm();
  renderTasks();
});

function startEdit(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  editingId = id;
  taskTitle.value = task.title;
  taskSubject.value = task.subject;
  taskDate.value = task.date;
  taskPriority.value = task.priority;
  taskType.value = task.type;
  document.getElementById("formTitle").textContent = "Edit task";
  submitBtn.textContent = "Save changes";
  cancelEditBtn.classList.remove("hidden");
  taskTitle.focus();
  document.querySelector(".form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task || !confirm(`Delete "${task.title}"?`)) return;
  tasks = tasks.filter(item => item.id !== id);
  if (editingId === id) resetForm();
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  renderTasks();
}

cancelEditBtn.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderTasks);
filterSelect.addEventListener("change", renderTasks);

document.getElementById("todayLabel").textContent =
  new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

renderTasks();
