const socket = io("http://127.0.0.1:5000");

const body = document.getElementById("queueBody");
const queueCount = document.getElementById("queueCount");
const processingCount = document.getElementById("currently-processing");
const paidCount = document.getElementById("paid-today");
const totalCollected = document.getElementById("total-collected");

const students = {}; // store rows by Queue_ID

// ================= UPDATE DASHBOARD COUNTS =================
function updateDashboardCounts() {
    let processing = 0, paid = 0, totalAmount = 0;

    Object.values(students).forEach(row => {
        const status = row.querySelector(".status")?.textContent.trim().toLowerCase() || "waiting";
        const amountText = row.querySelector(".amount")?.textContent.replace("₱","").replace(/,/g,"").trim() || "0";
        const amount = parseFloat(amountText) || 0;

        if(status === "processing") processing++;
        if(status === "paid"){
            paid++;
            totalAmount += amount;
        }
    });

    queueCount.textContent = Object.keys(students).length;
    if(processingCount) processingCount.textContent = processing;
    if(paidCount) paidCount.textContent = paid;
    if(totalCollected) totalCollected.textContent = "₱ " + totalAmount.toLocaleString();
}

// ================= ADD OR UPDATE ROW =================
function addOrUpdateRow(data){
    const id = data.Queue_ID; // unique Queue_ID
    const status = (data.Status || "Waiting").toLowerCase();
    const amount = data.amount_paid ?? 0;

    // Remove old row if exists to prevent duplicates
    if(students[id]) students[id].remove();

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>#${data.Teller}</td>
        <td>#${data.Queue}</td>
        <td>${data.Name} ${data.Last_Name}<br><span class="subtext-id">${data.Id_Number}</span></td>
        <td>${data.Student_Year}<br><span class="subtext-year">${data.Student_Course}</span></td>
        <td><span class="status ${status}">${data.Status || "Waiting"}</span></td>
        <td class="amount">₱ ${amount.toLocaleString()}</td>
        <td>${new Date(data.Timestamp).toLocaleString("en-PH", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        })}</td>
        <td class="actions"></td>
    `;
    const actions = row.querySelector(".actions");

    

    // ================= MARK AS PAID =================
    if(status === "processing"){
        const markPaidBtn = document.createElement("button");
        markPaidBtn.textContent = "Mark Paid";
        markPaidBtn.className = "btn-mark-paid";
        markPaidBtn.addEventListener("click", () => {
            fetch(`/mark_as_paid/${id}`, { method: "POST" })
            .then(res => {
                if(res.ok){
                    row.querySelector(".status").textContent = "Paid";
                    row.querySelector(".status").className = "status paid";
                    actions.innerHTML = "";
                    updateDashboardCounts();
                    alert("Marked as Paid successfully!");
                } else alert("Failed to mark as paid.");
            });
        });
        actions.appendChild(markPaidBtn);
    }

    // ================= ADD PAYMENT =================
    if(status === "waiting" || status === "processing"){
        const addPaymentBtn = document.createElement("button");
        addPaymentBtn.textContent = "Add Payment";
        addPaymentBtn.className = "btn-add-payment";
        addPaymentBtn.addEventListener("click", () => {
            window.location.href = `/add_payment?queue_id=${id}`;
        });
        actions.appendChild(addPaymentBtn);
    }

    // ================= PROCESS BUTTON =================
    if(status === "waiting"){
        const processBtn = document.createElement("button");
        processBtn.textContent = "Process";
        processBtn.className = "btn-process";
        processBtn.addEventListener("click", () => {
            socket.emit("process_queue", { student_id: id });
        });
        actions.appendChild(processBtn);
    }

    // ================= DELETE BUTTON =================
    if(status !== "paid"){
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "btn-delete";
        deleteBtn.addEventListener("click", () => {
            if(confirm("Are you sure you want to delete this student from the queue?")){
                fetch(`/delete_queue`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id })
                }).then(res => {
                    if(res.ok){
                        row.remove();
                        delete students[id];
                        updateDashboardCounts();
                        alert("Student deleted successfully!");
                    } else {
                        alert("Failed to delete student.");
                    }
                }).catch(err => alert("Error: " + err));
            }
        });
        actions.appendChild(deleteBtn);
    }

    // ================= ADD ROW TO TABLE =================
    if(status === "processing"){
        body.prepend(row);
    } else {
        body.appendChild(row);
    }

    students[id] = row;
    updateDashboardCounts();
}

// ================= SOCKET.IO LISTENER =================
socket.on("queue_update", (data) => {
    const status = (data.Status || "").toLowerCase();
    if(status === "deleted"){
        if(students[data.Queue_ID]){
            students[data.Queue_ID].remove();
            delete students[data.Queue_ID];
            updateDashboardCounts();
        }
        return;
    }
    addOrUpdateRow(data);
});

// ================= LOAD INITIAL DATA =================
fetch("/api/queue_logs")
.then(res => res.json())
.then(dataList => {
    dataList.sort((a,b) => b.Queue - a.Queue);
    dataList.forEach(data => {
        if((data.Status || "").toLowerCase() !== "cancelled"){
            addOrUpdateRow(data);
        }
    });
});
