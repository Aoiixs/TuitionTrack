from flask import Flask, request, render_template, redirect, url_for, jsonify, session, flash
from flask_socketio import SocketIO
import datetime
import pymysql

app = Flask(__name__)
app.secret_key = "aoixs"
socketio = SocketIO(app, cors_allowed_origins="*")


# ================= DATABASE CONNECTION =================
def get_db_connection():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="lhuzxcu2375",
        database="school_queue_system",
        cursorclass=pymysql.cursors.DictCursor
    )


# ================= HELPER FUNCTIONS =================
def can_process_teller(teller_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT COUNT(*) AS cnt FROM queue_logs WHERE teller=%s AND status='Processing'",
        (teller_id,)
    )

    active = cursor.fetchone()["cnt"]

    cursor.close()
    conn.close()

    return active == 0


def get_dashboard_stats():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS total FROM queue_logs WHERE status='waiting'")
    students_in_queue = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) AS total FROM queue_logs WHERE status='processing'")
    currently_processing = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT COUNT(*) AS total 
        FROM payments 
        WHERE DATE(payment_date) = CURDATE()
    """)
    paid_today = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT IFNULL(SUM(amount_paid),0) AS total 
        FROM payments 
        WHERE DATE(payment_date) = CURDATE()
    """)
    total_collected = cursor.fetchone()["total"]

    cursor.close()
    conn.close()

    return {
        "students_in_queue": students_in_queue,
        "currently_processing": currently_processing,
        "paid_today": paid_today,
        "total_collected": total_collected
    }


# ================= LANDING PAGE =================
@app.route("/")
def landing_page():
    return render_template("landing.html")


# ================= ADMIN LOGIN =================
@app.route("/admin_login", methods=["GET", "POST"])
def admin_login():

    if request.method == "POST":

        username = request.form.get("username")
        password = request.form.get("password")

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM users WHERE username=%s AND password=%s",
            (username, password)
        )

        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if user:
            session["username"] = user["username"]
            return redirect(url_for("admin_home"))

        return render_template("login.html", errors="Invalid username or password")

    return render_template("login.html")


# ================= ADMIN DASHBOARD =================
@app.route("/admin_home")
def admin_home():

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            q.id AS queue_id,
            s.student_no AS Id_Number,
            s.student_first_name AS Name,
            s.student_last_name AS Last_Name,
            s.student_year AS Student_Year,
            s.student_course AS Student_Course,
            s.student_balance AS Student_Balance,
            q.queue_number AS Queue,
            q.teller AS Teller,
            COALESCE(q.status,'waiting') AS Status,
            COALESCE(p.total_paid,0) AS amount_paid,
            q.created_at AS Timestamp
        FROM queue_logs q
        JOIN students s ON q.student_id = s.id
        LEFT JOIN (
            SELECT queue_id, SUM(amount_paid) AS total_paid
            FROM payments
            GROUP BY queue_id
        ) p ON p.queue_id = q.id
        ORDER BY
            FIELD(COALESCE(q.status,'waiting'),'processing','waiting','paid','cancelled'),
            q.queue_number ASC
    """)

    queue_list = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("dashboard.html", queue_list=queue_list)


# ================= API QUEUE LOGS =================
@app.route("/api/queue_logs")
def api_queue_logs():

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                q.id AS Queue_ID,
                q.queue_number AS Queue,
                q.teller AS Teller,
                s.student_no AS Id_Number,
                s.student_first_name AS Name,
                s.student_last_name AS Last_Name,
                s.student_year AS Student_Year,
                s.student_course AS Student_Course,
                s.student_balance AS Student_Balance,
                COALESCE(q.status,'waiting') AS Status,
                COALESCE(p.amount_paid,0) AS amount_paid,
                q.created_at AS Timestamp
            FROM queue_logs q
            JOIN students s ON q.student_id = s.id
            LEFT JOIN payments p ON p.queue_id = q.id
            ORDER BY
                FIELD(COALESCE(q.status,'waiting'),'processing','waiting','paid','cancelled'),
                q.queue_number ASC
        """)

        data = cursor.fetchall()
        return jsonify(data)

    finally:
        cursor.close()
        conn.close()


# ================= RFID PROCESS =================
@app.route("/process-data", methods=["POST"])
def process_data():

    try:

        data = request.get_json()
        rfid_uid = data.get("Id_Number")
        rfid_count = data.get("rfid_count", 0)

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM students WHERE rfid_uid=%s", (rfid_uid,))
        student = cursor.fetchone()

        if not student:
            cursor.close()
            conn.close()
            return {"status": "error", "message": "Student not found!"}, 404

        cursor.execute("SELECT MAX(queue_number) AS last_queue FROM queue_logs")
        result = cursor.fetchone()

        next_queue = 1 if result["last_queue"] is None else result["last_queue"] + 1

        cursor.execute("SELECT COUNT(*) AS cnt FROM queue_logs")
        count = cursor.fetchone()["cnt"]

        teller = (count % 3) + 1
        created_at = datetime.datetime.now()

        cursor.execute("""
            INSERT INTO queue_logs (queue_number, teller, student_id, created_at)
            VALUES (%s,%s,%s,%s)
        """, (next_queue, teller, student["id"], created_at))

        conn.commit()

        new_queue_id = cursor.lastrowid

        queue_info = {
            "Queue_ID": new_queue_id,
            "Queue": next_queue,
            "Teller": teller,
            "Id_Number": student["student_no"],
            "Name": student["student_first_name"],
            "Last_Name": student["student_last_name"],
            "Student_Year": student["student_year"],
            "Student_Course": student["student_course"],
            "Status": "Waiting",
            "Student_Balance": float(student["student_balance"]),
            "amount_paid": 0,
            "Timestamp": created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "RFID_Count": rfid_count
        }

        socketio.emit("queue_update", queue_info)

        cursor.close()
        conn.close()

        return {"queue_number": next_queue, "teller": teller}, 200

    except Exception as e:
        return {"status": "error", "message": str(e)}, 500


# ================= MARK AS PAID =================
@app.route("/mark_as_paid/<int:queue_id>", methods=["POST"])
def mark_as_paid(queue_id):

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT q.id, q.queue_number
            FROM queue_logs q
            WHERE q.id=%s
        """, (queue_id,))
        current = cursor.fetchone()

        if not current:
            return jsonify({"error": "Not found"}), 404

        cursor.execute("""
            UPDATE queue_logs
            SET status='paid'
            WHERE id=%s
        """, (queue_id,))

        cursor.execute("""
            SELECT * FROM queue_logs
            WHERE status='waiting'
            ORDER BY queue_number ASC
            LIMIT 1
        """)
        next_student = cursor.fetchone()

        if next_student:

            cursor.execute("""
                UPDATE queue_logs
                SET status='processing'
                WHERE id=%s
            """, (next_student["id"],))

            message = f"Queue #{next_student['queue_number']} is now your turn"

            cursor.execute("""
                INSERT INTO notifications (title, message, created_at)
                VALUES (%s, %s, %s)
            """, ("Now Serving", message, datetime.datetime.now()))

            conn.commit()

            socketio.emit("new_notification", {
                "title": "Now Serving",
                "message": message
            })

        else:
            conn.commit()

        return jsonify({"success": True})

    finally:
        cursor.close()
        conn.close()


# ================= QUEUE MONITORING =================
@app.route("/queue_monitoring")
def queue_monitoring():
    return render_template("queue_monitoring.html")


# ================= DELETE QUEUE =================
@app.route("/delete_queue", methods=["POST"])
def delete_queue():

    data = request.get_json()
    queue_id = data.get("id")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM queue_logs WHERE id=%s", (queue_id,))
        conn.commit()

        socketio.emit("queue_update", {
            "Queue_ID": queue_id,
            "Status": "deleted"
        })

        return jsonify({"status": "success"})

    finally:
        cursor.close()
        conn.close()


# ================= ADD PAYMENT =================
@app.route("/add_payment")
def add_payment():

    conn = get_db_connection()
    cursor = conn.cursor()

    # Get NEXT student in the global queue
    cursor.execute("""
        SELECT s.*, q.id AS queue_id, q.queue_number, q.teller, q.created_at
        FROM queue_logs q
        JOIN students s ON q.student_id = s.id
        WHERE q.status = 'Waiting'
        ORDER BY q.queue_number ASC
        LIMIT 1
    """)

    student = cursor.fetchone()

    if not student:
        cursor.close()
        conn.close()
        return "No student in queue yet"


    cursor.execute("""
        UPDATE queue_logs
        SET status = 'Processing'
        WHERE id = %s
    """, (student["queue_id"],))

    conn.commit()

    # Emit real-time update
    socketio.emit("queue_update", {
        "Queue": student["queue_number"],
        "Teller": student.get("teller", "N/A"),
        "Id_Number": student["student_no"],
        "Name": student["student_first_name"],
        "Last_Name": student["student_last_name"],
        "Student_Year": student["student_year"],
        "Student_Course": student["student_course"],
        "Status": "Processing",
        "Student_Balance": float(student["student_balance"]),
        "amount_paid": 0,
        "Timestamp": student["created_at"].strftime("%Y-%m-%d %H:%M:%S")
    })

    cursor.close()
    conn.close()

    return render_template("add_payment.html", student=student)
# ================= PROCESS PAYMENT =================
@app.route("/process_payment", methods=["POST"])
def process_payment():

    student_id = request.form.get("student_id")
    queue_id = request.form.get("queue_id")
    amount = float(request.form.get("amount"))

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Insert payment record
        cursor.execute("""
            INSERT INTO payments (student_id, queue_id, amount_paid, payment_date)
            VALUES (%s, %s, %s, NOW())
        """, (student_id, queue_id, amount))

        # Update student balance
        cursor.execute("""
            UPDATE students
            SET student_amount_pay = student_amount_pay + %s,
                student_balance = student_balance - %s
            WHERE id = %s
        """, (amount, amount, student_id))

        conn.commit()

        flash("Payment successfully processed.")

    except Exception as e:
        conn.rollback()
        flash(f"Error: {e}")

    finally:
        cursor.close()
        conn.close()

    return redirect(url_for("queue_monitoring"))


# ================= LOGOUT =================
@app.route("/logout")
def logout():
    user_id = session.get("student_id")  # must match what you set in login

    if user_id:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE users
                SET last_logout=%s, is_logged_in=0
                WHERE id=%s
            """, (datetime.datetime.now(), user_id))
            conn.commit()
        conn.close()

    session.clear()
    return redirect(url_for("admin_login"))

# ================= ANALYTICS =================
@app.route("/analytics")
def analytics():

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT IFNULL(SUM(amount_paid),0) AS total
        FROM payments
        WHERE DATE(payment_date)=CURDATE()
    """)
    today_collection = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT IFNULL(SUM(amount_paid),0) AS total
        FROM payments
        WHERE YEARWEEK(payment_date,1)=YEARWEEK(CURDATE(),1)
    """)
    weekly_collection = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT IFNULL(SUM(amount_paid),0) AS total
        FROM payments
        WHERE MONTH(payment_date)=MONTH(CURDATE())
        AND YEAR(payment_date)=YEAR(CURDATE())
    """)
    monthly_collection = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT COUNT(DISTINCT student_id) AS total
        FROM payments
    """)
    students_served = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT DAYNAME(payment_date) AS day, COUNT(*) AS total
        FROM payments
        GROUP BY DAYNAME(payment_date)
    """)
    payments_day = cursor.fetchall()

    cursor.execute("""
        SELECT status, COUNT(*) AS total
        FROM queue_logs
        GROUP BY status
    """)
    status_data = cursor.fetchall()

    conn.close()

    return render_template(
        "analytics.html",
        today_collection=today_collection,
        weekly_collection=weekly_collection,
        monthly_collection=monthly_collection,
        students_served=students_served,
        payments_day=payments_day,
        status_data=status_data
    )


# ================= PAYMENT HISTORY =================
@app.route("/api/payment_history")
def payment_history():

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            q.queue_number, q.teller,
            s.student_no, s.student_first_name, s.student_last_name,
            s.student_course, s.student_year,
            COALESCE(p.total_paid, 0) AS amount_paid,
            q.created_at
        FROM queue_logs q
        JOIN students s ON q.student_id = s.id
        LEFT JOIN (
            SELECT queue_id, SUM(amount_paid) AS total_paid
            FROM payments
            GROUP BY queue_id
        ) p ON p.queue_id = q.id
        WHERE q.status='paid'
        ORDER BY q.created_at DESC
    """)

    history = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(history)


# ================= DASHBOARD STATS =================
@app.route("/api/dashboard_stats")
def dashboard_stats():

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS total FROM queue_logs WHERE status='waiting'")
    students_in_queue = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) AS total FROM queue_logs WHERE status='processing'")
    currently_processing = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT COUNT(*) AS total 
        FROM payments 
        WHERE DATE(payment_date) = CURDATE()
    """)
    paid_today = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT IFNULL(SUM(amount_paid),0) AS total 
        FROM payments 
        WHERE DATE(payment_date) = CURDATE()
    """)
    total_collected = cursor.fetchone()["total"]

    cursor.close()
    conn.close()

    return jsonify({
        "students_in_queue": students_in_queue,
        "currently_processing": currently_processing,
        "paid_today": paid_today,
        "total_collected": total_collected
    })


# ================= NOTIFICATIONS =================
@app.route("/api/notifications")
def get_notifications():

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT id, title, message, created_at
            FROM notifications
            ORDER BY created_at DESC
        """)
        data = cursor.fetchall()
        return jsonify(data)

    finally:
        cursor.close()
        conn.close()


# ================= SOCKET EVENTS =================
@socketio.on("process_queue")
def handle_process_queue(data):

    queue_id = data.get("student_id")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE queue_logs
            SET status='processing'
            WHERE id=%s
        """, (queue_id,))

        conn.commit()

    finally:
        cursor.close()
        conn.close()


@socketio.on("connect")
def handle_connect():
    print("Client connected")


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")


# ================= RUN SERVER =================
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)