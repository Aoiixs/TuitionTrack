from flask import Blueprint, jsonify,request 
import pymysql
from google import genai
from dotenv import load_dotenv
import datetime
import os

def get_db_connection():
    return pymysql.connect(
        host = "localhost",
        user= "root",
        password = "Flaskframework",
        database = "school_queue_system",
        cursorclass = pymysql.cursors.DictCursor
    )

load_dotenv()

ai_bp = Blueprint("ai_bp", __name__)
gemini_api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=gemini_api_key)


@ai_bp.route("/ai-chat", methods = ["POST"])
def ai_chat():
    data = request.get_json()
    message = data.get("message", "")
    current_date = datetime.datetime.now().strftime("%B %d, %Y")
    current_time = datetime.datetime.now().strftime("%I:%M %p")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Waiting Students
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM queue_logs
        WHERE LOWER(COALESCE(status,'waiting')) = 'waiting'
    """)
    waiting_count = cursor.fetchone()["total"]

    # Processing students
    cursor.execute("""
        SELECT
            q.queue_number,
            s.student_first_name,
            s.student_last_name
        FROM queue_logs q
        JOIN students s ON q.student_id = s.id
        WHERE LOWER(COALESCE(q.status,''))='processing'
    """)
    processing_students = cursor.fetchall()

    # Paid today
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM payments
        WHERE DATE(payment_date)=CURDATE()
    """)
    paid_today = cursor.fetchone()["total"] 

    cursor.execute("""
    SELECT DISTINCT
        q.queue_number,
        s.student_first_name,
        s.student_last_name
    FROM payments p
    JOIN students s ON p.student_id = s.id
    JOIN queue_logs q ON p.queue_id = q.id
    WHERE DATE(p.payment_date)=CURDATE()
""")
    paid_students = cursor.fetchall()

    cursor.close()
    conn.close()

    if processing_students:
        processing_text = "\n".join([
            f"Queue #{row['queue_number']} - "
            f"{row['student_first_name']} {row['student_last_name']}"
            for row in processing_students
    ])
    else:
        processing_text = "No student currently being processed"

    if paid_students:
        paid_text = "\n".join([
        f"Queue #{row['queue_number']} - "
        f"{row['student_first_name']} {row['student_last_name']}"
        for row in paid_students
    ])
    else:
        paid_text = "No students have paid today."

        

    prompt = f"""
    You are QueueTrack AI Assistant.
    QueueTrack is a School Queue Management System.

    Today's date = {current_date}
    Todays Time = {current_time}

    
    Description:
	This system replaces manual lining-up using RFID and AI. AI automatically assigns queue numbers to students and updates or adjusts their queue status in real-time as the line moves. Arduino supports fast entry processing, while AI also handles waiting time prediction, delay analysis, service flow optimization, system monitoring, and student inquiries and concerns through intelligent assistance and automated responses. Students simply scan their ID, can leave the waiting area, and monitor updates anytime via web or mobile — returning only when their turn is near. This eliminates long idle waits, reduces congestion, and makes tuition payment fast, convenient, and efficient.

    Project Team Members:

    1. Alex Gustilo
    Role: Developer,

    2. Luegi Rivera
    Role: Developer,

    3. Shanelle Operio
    Role: UI/UX Designer,

    4. Mary Joy Cabanas
    Role: Presenter / Pitcher

    Your job:
    - Help the admins
    - Answer professionally
    - Help explain the QueueTrack system
    - Help with presentations
    - Help with system features
    - Help with technical questions
    - Be friendly and professional

    REAL-TIME QUEUE DATA

    Students Waiting:
    {waiting_count}
    Currently Processing:
    {processing_text}
    Students Paid Today:
    {paid_today}
    Students Who's Paid:
    {paid_text}

    IMPORTANT:
    Use the real-time queue data above when answering queue-related questions.
    Do not invent queue information.

    Admin Message:
    {message}
"""
    response = client.models.generate_content(
        model = "gemini-2.5-flash",
        contents=prompt
    )
    reply = response.text

    reply = reply.replace("**", "")
    reply = reply.replace("*", "")
    reply = reply.replace("##", "")

    return jsonify({
    "reply": reply
})

# ================= AI PREDICTION =================
@ai_bp.route("/ai-prediction", methods=["GET"])
def ai_prediction():

    conn = get_db_connection()
    cursor = conn.cursor()

    # waiting students
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM queue_logs
        WHERE LOWER(COALESCE(status,'waiting'))='waiting'
    """)
    waiting = cursor.fetchone()["total"]

    # processing or completed today
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM queue_logs
        WHERE DATE(created_at)=CURDATE()
        AND status IN ('processing','paid')
    """)
    processed = cursor.fetchone()["total"]

    # payments today
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM payments
        WHERE DATE(payment_date)=CURDATE()
    """)
    payments_today = cursor.fetchone()["total"]

    cursor.close()
    conn.close()

    # =================  AI FORMULA =================
    if processed == 0:
        avg_time_per_student = 2  
    else:
        avg_time_per_student = payments_today / processed
        if avg_time_per_student < 1:
            avg_time_per_student = 1

    estimated_wait = waiting * avg_time_per_student

    return jsonify({
        "waiting_students": waiting,
        "avg_time_per_student": round(avg_time_per_student, 2),
        "estimated_waiting_time_minutes": round(estimated_wait, 2)
    })