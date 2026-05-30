from flask import Blueprint, jsonify,request 
import requests
from google import genai
from dotenv import load_dotenv
import datetime
import os

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

