const socket = io("http://127.0.0.1:5000");

const tableBody = document.getElementById("paymentHistoryBody");

async function loadHistory() {

    try {

        const response = await fetch("/api/history_admin");
        const data = await response.json();

        tableBody.innerHTML = "";

        data.forEach(row => {

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${row.queue_number}</td>
                <td>${row.student_first_name} ${row.student_last_name}<br> <span class="subtext-id">${row.student_no || ""}</span></td>
                <td>${row.student_year} - ${row.student_course}</td>
                <td>${row.teller}</td>
                <td>₱${Number(row.amount_paid).toLocaleString()}</td>
                <td>₱${Number(row.student_balance).toLocaleString()}</td>
                <td>Cash</td>
                <td>${formatDate(row.created_at)}</td>
                <td> <span class="status paid">Paid</span>  </td>
            `;

            tableBody.appendChild(tr);

        });

    } catch(err) {
        console.error(err);
    }
}

function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

socket.on("history_refresh", () => {
    loadHistory();
});

document.addEventListener("DOMContentLoaded", () => {
    loadHistory();
});