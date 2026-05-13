<<<<<<< HEAD
// Connect to Socket.IO
const socket = io("http://127.0.0.1:5000");

const todayCollection = {{ today_collection | default(0) | safe }};
const weeklyCollection = {{ weekly_collection | default(0) | safe }};
const monthlyCollection = {{ monthly_collection | default(0) | safe }};
const studentsServed = {{ students_served | default(0) | safe }};

/* ====== BAR CHART ====== */
const barChart = new Chart(
    document.getElementById("barChart"),
    {
        type: "bar",
        data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
                label: "Payments",
                data: [8,12,10,15,13,5,3],
                backgroundColor:"#8fbfc1"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false
        }
    }
);

/* ====== PIE CHART ====== */
const pieChart = new Chart(
    document.getElementById("pieChart"),
    {
        type: "pie",
        data: {
            labels: ["Waiting", "Processing", "Paid"],
            datasets: [{
                data: [40,20,40], 
                backgroundColor:["#f4e7a1","#8fbfc1","#b8d6a3"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false
        }
    }
);

/* ====== SOCKET LIVE UPDATE ====== */
socket.on("update_dashboard", data => {
    if(data.weekly_payments) {
        barChart.data.datasets[0].data = data.weekly_payments;
        barChart.update();
    }
    if(data.status_counts) {
        pieChart.data.datasets[0].data = data.status_counts;
        pieChart.update();
    }
=======
// Connect to Socket.IO
const socket = io("http://127.0.0.1:5000");

const todayCollection = {{ today_collection | default(0) | safe }};
const weeklyCollection = {{ weekly_collection | default(0) | safe }};
const monthlyCollection = {{ monthly_collection | default(0) | safe }};
const studentsServed = {{ students_served | default(0) | safe }};

/* ====== BAR CHART ====== */
const barChart = new Chart(
    document.getElementById("barChart"),
    {
        type: "bar",
        data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
                label: "Payments",
                data: [8,12,10,15,13,5,3],
                backgroundColor:"#8fbfc1"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false
        }
    }
);

/* ====== PIE CHART ====== */
const pieChart = new Chart(
    document.getElementById("pieChart"),
    {
        type: "pie",
        data: {
            labels: ["Waiting", "Processing", "Paid"],
            datasets: [{
                data: [40,20,40], 
                backgroundColor:["#f4e7a1","#8fbfc1","#b8d6a3"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false
        }
    }
);

/* ====== SOCKET LIVE UPDATE ====== */
socket.on("update_dashboard", data => {
    if(data.weekly_payments) {
        barChart.data.datasets[0].data = data.weekly_payments;
        barChart.update();
    }
    if(data.status_counts) {
        pieChart.data.datasets[0].data = data.status_counts;
        pieChart.update();
    }
>>>>>>> 46a124b8020f44bc2f9c50a08d93cd40dc405097
});