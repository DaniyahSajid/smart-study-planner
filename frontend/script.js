const form = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');

let editId = null;

// ================= ADD / UPDATE =================
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const task = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            deadline: document.getElementById('deadline').value,
            priority: document.getElementById('priority').value,
            progress: 0
        };

        if (editId) {
            await fetch(`http://localhost:5000/tasks/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            });
            editId = null;
        } else {
            await fetch('http://localhost:5000/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            });
        }

        form.reset();
        loadTasks();
    });
}

// ================= LOAD TASKS =================
async function loadTasks() {
    const res = await fetch('http://localhost:5000/tasks');
    const data = await res.json();

    const totalEl = document.getElementById('totalTasks');
    const highEl = document.getElementById('highTasks');
    const pendingEl = document.getElementById('pendingTasks');

    if (totalEl) totalEl.innerText = data.length;

    if (highEl) {
        highEl.innerText = data.filter(t => t.priority === "High").length;
    }

    if (pendingEl) {
        const pending = data.filter(t => (t.progress || 0) < 100);
        pendingEl.innerText = pending.length;
    }

    if (taskList) {
        taskList.innerHTML = '';

        data.forEach(task => {
            const progress = task.progress || 0;

            let color = "#e74c3c";
            if (progress >= 50) color = "#f1c40f";
            if (progress >= 80) color = "#2ecc71";

            const badge = progress === 100
                ? `<span class="badge">✔ Completed</span>`
                : "";

            const li = document.createElement('li');

            li.innerHTML = `
                <div class="card-container">

                    <div class="flip-card" onclick="this.classList.toggle('flip')">
                        <div class="flip-card-inner">

                            <div class="flip-front">
                                <h3>${task.title}</h3>
                                <p>${task.priority}</p>
                                <p style="color:${color}">Progress: ${progress}%</p>
                                ${badge}
                            </div>

                            <div class="flip-back">
                                <p>${task.description || "No Description"}</p>
                                <p>${task.deadline ? task.deadline.split('T')[0] : ""}</p>
                            </div>

                        </div>
                    </div>

                    <input type="range" min="0" max="100"
                        value="${progress}"
                        onchange="updateProgress('${task._id}', this.value)">

                    <div class="task-buttons">
                        <button onclick="editTask('${task._id}', '${task.title}', '${task.description}', '${task.deadline}', '${task.priority}')">Edit</button>
                        <button onclick="deleteTask('${task._id}')">Delete</button>
                    </div>

                </div>
            `;

            taskList.appendChild(li);
        });
    }
}

// ================= UPDATE PROGRESS =================
async function updateProgress(id, value) {
    await fetch(`http://localhost:5000/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: Number(value) })
    });

    loadTasks();
    loadChart();
}

// ================= DELETE =================
async function deleteTask(id) {
    await fetch(`http://localhost:5000/tasks/${id}`, {
        method: 'DELETE'
    });
    loadTasks();
    loadChart();
}

// ================= EDIT =================
function editTask(id, titleVal, desc, deadline, priorityVal) {
    if (!form) return;

    document.getElementById('title').value = titleVal;
    document.getElementById('description').value = desc;

    if (deadline) {
        document.getElementById('deadline').value = deadline.split('T')[0];
    }

    document.getElementById('priority').value = priorityVal;

    editId = id;
}

// ================= ANALYTICS =================
let barChart, pieChart, subjectChart;

async function loadChart() {
    const res = await fetch('http://localhost:5000/tasks');
    const data = await res.json();

    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();
    if (subjectChart) subjectChart.destroy();

    const ctx = document.getElementById('chart');
    if (ctx) {
        barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(t => t.title),
                datasets: [{
                    label: 'Progress (%)',
                    data: data.map(t => t.progress || 0),
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    const priorityCount = { High: 0, Medium: 0, Low: 0 };
    data.forEach(t => priorityCount[t.priority]++);

    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['High', 'Medium', 'Low'],
                datasets: [{
                    data: [
                        priorityCount.High,
                        priorityCount.Medium,
                        priorityCount.Low
                    ],
                    backgroundColor: ['#e74c3c', '#f1c40f', '#2ecc71']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    const subjects = {};
    data.forEach(t => {
        const subject = t.title.split(" ")[0];
        subjects[subject] = (subjects[subject] || 0) + 1;
    });

    const subjectCtx = document.getElementById('subjectChart');
    if (subjectCtx) {
        subjectChart = new Chart(subjectCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(subjects),
                datasets: [{
                    data: Object.values(subjects),
                    backgroundColor: ['#3498db', '#9b59b6', '#1abc9c', '#e67e22']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// ================= TIMER (FIXED) =================

let time = 86400; // 24 hours
let timerInterval = null;

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h.toString().padStart(2, '0')}:` +
           `${m.toString().padStart(2, '0')}:` +
           `${s.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    const timer = document.getElementById('timer');
    if (!timer) return;

    timer.innerText = formatTime(time);
}

function startTimer() {
    if (timerInterval) return;

    timerInterval = setInterval(() => {
        if (time > 0) {
            time--;
            updateDisplay();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    time = 86400;
    updateDisplay();
}

// ================= INIT =================
loadTasks();
loadChart();
updateDisplay();