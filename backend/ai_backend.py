from flask import Blueprint, jsonify, request
import pymysql
from google import genai
from dotenv import load_dotenv
import datetime
import os

# ================= DB CONNECTION =================
def get_db_connection():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="lhuzxcu2375",
        database="school_queue_system",
        cursorclass=pymysql.cursors.DictCursor
    )

load_dotenv()

ai_bp = Blueprint("ai_bp", __name__)

gemini_api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=gemini_api_key)

# ================= AI CHAT =================
@ai_bp.route("/ai-chat", methods=["POST"])
def ai_chat():
    data = request.get_json()
    message = data.get("message", "")

    now = datetime.datetime.now()
    current_date = now.strftime("%B %d, %Y")
    current_time = now.strftime("%I:%M %p")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Waiting students
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM queue_logs
        WHERE LOWER(COALESCE(status,'waiting')) = 'waiting'
    """)
    waiting_count = cursor.fetchone()["total"]

    # Processing students
    cursor.execute("""
        SELECT q.queue_number, s.student_first_name, s.student_last_name
        FROM queue_logs q
        JOIN students s ON q.student_id = s.id
        WHERE LOWER(COALESCE(q.status,''))='processing'
    """)
    processing_students = cursor.fetchall()

    # Paid today count
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM payments
        WHERE DATE(payment_date)=CURDATE()
    """)
    paid_today = cursor.fetchone()["total"]

    # Paid students
    cursor.execute("""
        SELECT DISTINCT q.queue_number, s.student_first_name, s.student_last_name
        FROM payments p
        JOIN students s ON p.student_id = s.id
        JOIN queue_logs q ON p.queue_id = q.id
        WHERE DATE(p.payment_date)=CURDATE()
    """)
    paid_students = cursor.fetchall()

    cursor.close()
    conn.close()

    processing_text = "\n".join([
        f"Queue #{r['queue_number']} - {r['student_first_name']} {r['student_last_name']}"
        for r in processing_students
    ]) if processing_students else "No student currently being processed"

    paid_text = "\n".join([
        f"Queue #{r['queue_number']} - {r['student_first_name']} {r['student_last_name']}"
        for r in paid_students
    ]) if paid_students else "No students have paid today."

    prompt = f"""
You are QueueTrack AI Assistant.

Date: {current_date}
Time: {current_time}

SYSTEM CONTEXT:
QueueTrack is a school queue management system using RFID + AI automation.

REAL-TIME DATA:
- Students Waiting: {waiting_count}
- Currently Processing: {processing_text}
- Students Paid Today: {paid_today}
- Paid Students List: {paid_text}

Admin Message:
{message}

INSTRUCTIONS:
- Use ONLY the provided data
- Do not invent queue information
- Be professional and helpful
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    reply = response.text
    reply = reply.replace("**", "").replace("*", "").replace("##", "")

    return jsonify({"reply": reply})


# ================= AI PREDICTION =================
@ai_bp.route("/ai-prediction/<int:queue_number>", methods=["GET"])
def ai_prediction(queue_number):

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. currently processing count
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM queue_logs
        WHERE LOWER(status)='processing'
    """)
    processing_now = cursor.fetchone()["total"]

    # 2. students ahead (FIXED LOGIC)
    cursor.execute("""
        SELECT COUNT(*) AS ahead
        FROM queue_logs
        WHERE queue_number < %s
        AND LOWER(COALESCE(status,'waiting')) IN ('waiting','processing')
    """, (queue_number,))
    students_ahead = cursor.fetchone()["ahead"]

    # 3. average service time
    cursor.execute("""
        SELECT AVG(
            TIMESTAMPDIFF(MINUTE, processing_started_at, completed_at)
        ) AS avg_time
        FROM queue_logs
        WHERE completed_at IS NOT NULL
        AND DATE(completed_at)=CURDATE()
    """)
    row = cursor.fetchone()
    avg_time = row["avg_time"]

    if not avg_time or avg_time < 1:
        avg_time = 2

    # 4. FIX: current processing remaining time
    cursor.execute("""
        SELECT TIMESTAMPDIFF(MINUTE, processing_started_at, NOW()) AS elapsed
        FROM queue_logs
        WHERE status='processing'
        ORDER BY processing_started_at ASC
        LIMIT 1
    """)
    current = cursor.fetchone()

    current_elapsed = current["elapsed"] if current and current["elapsed"] else 0
    remaining_current = max(avg_time - current_elapsed, 0)

    # 5. congestion factor
    congestion_factor = 1 + (processing_now * 0.1)

    # 6. FINAL ETA (FIXED)
    estimated_wait = (
        remaining_current +
        (students_ahead * avg_time)
    ) * congestion_factor

    cursor.close()
    conn.close()

    return jsonify({
        "students_ahead": students_ahead,
        "avg_time_per_student": round(avg_time, 2),
        "current_processing_remaining": round(remaining_current, 2),
        "estimated_waiting_time_minutes": round(estimated_wait, 2),
        "processing_students": processing_now,
        "congestion_factor": round(congestion_factor, 2),
        "model": "QueueTrack AI v3 (Fixed ETA Logic)"
    })