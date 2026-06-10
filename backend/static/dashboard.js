const socket = io("http://127.0.0.1:5000");


const tellerTables = {
    1: document.querySelector("#queueTeller1"),
    2: document.querySelector("#queueTeller2"),
    3: document.querySelector("#queueTeller3")
};

const waitingTable = document.querySelector("#waitingQueue");


let rows = {1:{}, 2:{}, 3:{}};
let waitingRows = {};


const statsQueue = document.getElementById("queue-count");  
const statsProcessing = document.getElementById("currently-processing");
const statsPaidToday = document.getElementById("paid-today");
const statsTotalCollected = document.getElementById("total-collected");


function formatMoney(value){
    return `₱ ${Number(value || 0).toLocaleString()}`;
}

function addRowPerTeller(data){

    const status = (data.Status || "waiting").toLowerCase();
    const queueNum = data.Queue;
    const tellerId = parseInt(data.Teller);

    const amount_paid = Number(data.amount_paid || 0);

    const timestamp = data.Timestamp
        ? new Date(data.Timestamp).toLocaleString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        })
        : "";

    // ================= WAITING QUEUE =================
    if(status === "waiting"){

        if(waitingRows[queueNum]) return;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${tellerId || "TBA"}</td>
            <td>#${queueNum}</td>
            <td>
                ${data.Name} ${data.Last_Name}<br>
                <span class="subtext-id">${data.Id_Number || ""}</span>
            </td>
            <td>${data.Student_Year}<br><span class="subtext-year">${data.Student_Course}</span></td>
            <td><span class="status waiting">waiting</span></td>
            <td>${timestamp}</td>
        `;

        waitingTable.appendChild(row);
        waitingRows[queueNum] = row;
        return;
    }

    // ================= TELLER QUEUE =================
    const tableBody = tellerTables[tellerId];
    if(!tableBody) return;

    
    if(rows[tellerId][queueNum]){
        const row = rows[tellerId][queueNum];

        row.querySelector(".status").textContent = status;
        row.querySelector(".status").className = `status ${status}`;
        row.querySelector(".amount").textContent = formatMoney(amount_paid);
        row.querySelector(".balance").textContent = data.Student_Balance || 0;
        row.querySelector(".timestamp").textContent = timestamp;

        return;
    }

    // CREATE NEW ROW
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>#${queueNum}</td>
        <td>
            ${data.Name} ${data.Last_Name}<br>
            <span class="subtext-id">${data.Id_Number || ""}</span>
        </td>
        <td>${data.Student_Year}<br><span class="subtext-year">${data.Student_Course}</span></td>
        <td><span class="status ${status}">${status}</span></td>
        <td class="amount">${formatMoney(amount_paid)}</td>
        <td class="balance">${data.Student_Balance || 0}</td>
        <td class="timestamp">${timestamp}</td>
    `;

    tableBody.appendChild(row);
    rows[tellerId][queueNum] = row;
}

// ================= STATS =================
function loadDashboardStats(){
    fetch("/api/dashboard_stats")
    .then(res => res.json())
    .then(data => {
        statsQueue.textContent = data.students_in_queue ?? 0;
        statsProcessing.textContent = data.currently_processing ?? 0;
        statsPaidToday.textContent = data.paid_today ?? 0;
        statsTotalCollected.textContent = `₱ ${Number(data.total_collected || 0).toLocaleString()}`;
    })
    .catch(err => console.error(err));
}

// ================= LOAD QUEUE =================
function loadQueue(){
    fetch("/api/queue_logs")
    .then(res => res.json())
    .then(data => {

        // RESET FIXED PROPERLY
        Object.values(rows).forEach(t => {
            Object.values(t).forEach(r => r.remove());
        });

        rows = {1:{}, 2:{}, 3:{}};

        waitingTable.innerHTML = "";
        waitingRows = {};

        data.forEach(item => addRowPerTeller(item));

        loadDashboardStats();
    });
}

// ================= SOCKET =================
socket.on("queue_update", data => {
    if(!data) return;

    addRowPerTeller(data);
    loadDashboardStats();
});

// ================= INIT =================
document.addEventListener("DOMContentLoaded", loadQueue);