const socket = io("http://127.0.0.1:5000");
const tellerTables = {
    1: document.querySelector("#queueTeller1"),
    2: document.querySelector("#queueTeller2"),
    3: document.querySelector("#queueTeller3")
};

let rows = {1:{}, 2:{}, 3:{}};


const statsQueue = document.getElementById("queue-count");  
const statsProcessing = document.getElementById("currently-processing");
const statsPaidToday = document.getElementById("paid-today");
const statsTotalCollected = document.getElementById("total-collected");


function formatMoney(value){
    return `₱ ${Number(value || 0).toLocaleString()}`;
}

// ================= ADD / UPDATE ROW =================
function addRowPerTeller(data){
    const tellerId = parseInt(data.Teller);
    const queueNum = data.Queue;
    const tableBody = tellerTables[tellerId];
    if(!tableBody) return;

    const studentCount = data.RFID_Count || 0;
    const amount_paid = Number(data.amount_paid || 0);
    const timestamp = data.Timestamp || "";
    const status = (data.Status || "waiting").toLowerCase();

    // UPDATE EXISTING ROW
    if(rows[tellerId][queueNum]){
        const row = rows[tellerId][queueNum];
        row.querySelector(".status").textContent = status.toUpperCase();
        row.querySelector(".status").className = `status ${status}`;
        row.querySelector(".amount").textContent = formatMoney(amount_paid);
        row.querySelector(".balance").textContent = data.Student_Balance || 0;
        row.querySelector(".timestamp").textContent = timestamp;
        row.querySelector(".id-number").textContent = data.Id_Number || "";
        return;
    }

    // CREATE NEW ROW
    const row = document.createElement("tr");
    row.dataset.studentId = data.student_id || data.Queue_ID || "";

    row.innerHTML = `
        <td>#${queueNum}</td>
        <td>${data.Name} ${data.Last_Name}<br><span class="subtext-id">${data.Id_Number}</span></td>

        <td><span class="status ${status}">${status.toUpperCase()}</span></td>
  
    
        <td class="amount">${formatMoney(amount_paid)}</td>
        <td class="balance">${data.Student_Balance || 0}</td>
        <td class="timestamp">${timestamp}</td>
        <td></td>
    `;

    tableBody.prepend(row);
    rows[tellerId][queueNum] = row;
}

// ================= LOAD DASHBOARD STATS =================
function loadDashboardStats(){
    fetch("http://127.0.0.1:5000/api/dashboard_stats") // IMPORTANT
    .then(res => res.json())
    .then(data => {
        console.log("STATS:", data);

        statsQueue.textContent = data.students_in_queue ?? 0;
        statsProcessing.textContent = data.currently_processing ?? 0;
        statsPaidToday.textContent = data.paid_today ?? 0;
        statsTotalCollected.textContent = `₱ ${Number(data.total_collected || 0).toLocaleString()}`;
    })
    .catch(err => console.error("Stats error:", err));
}

// ================= LOAD QUEUE =================
function loadQueue(){
    fetch("/api/queue_logs")
    .then(res => res.json())
    .then(data => {
 
        Object.values(rows).forEach(t => Object.values(t).forEach(r => r.remove()));
        rows = {1:{},2:{},3:{}};

        data.forEach(item => addRowPerTeller(item));

        loadDashboardStats();
    })
    .catch(err => console.error("Failed to load queue:", err));
}

// ================= SOCKET =================
socket.on("queue_update", data => {
    addRowPerTeller(data);

  
    loadDashboardStats();
});


socket.on("queue_update", data => {
    if(!data) return;

    addRowPerTeller(data);

    if ("students_in_queue" in data)
        statsQueue.textContent = data.students_in_queue;

    if ("currently_processing" in data)
        statsProcessing.textContent = data.currently_processing;

    if ("paid_today" in data)
        statsPaidToday.textContent = data.paid_today;

    if ("total_collected" in data)
        statsTotalCollected.textContent = formatMoney(data.total_collected);
});
// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    loadQueue();
});