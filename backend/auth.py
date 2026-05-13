<<<<<<< HEAD
from flask import Blueprint, request, jsonify
from database import get_db_connection()

auth=Blueprint("auth", __name__)



@auth.route("/login", methods=["POST"])
def login():
    data=request.json
    
    username=data["username"]
    password=data["password"]
    
    conn=get_db_connection()
    cursor=conn.cursor()
    
    sql = "SELECT * FROM users WHERE username=%s AND password=%s"
    cursor.execute(sql(username, password))
    
    
    user=cursor.fetchone()
    
    if user:
        return jsonify({"status": "success"})
    else:
        return jsonify({"status": "failed"})
=======
from flask import Blueprint, request, jsonify
from database import get_db_connection()

auth=Blueprint("auth", __name__)



@auth.route("/login", methods=["POST"])
def login():
    data=request.json
    
    username=data["username"]
    password=data["password"]
    
    conn=get_db_connection()
    cursor=conn.cursor()
    
    sql = "SELECT * FROM users WHERE username=%s AND password=%s"
    cursor.execute(sql(username, password))
    
    
    user=cursor.fetchone()
    
    if user:
        return jsonify({"status": "success"})
    else:
        return jsonify({"status": "failed"})
>>>>>>> 46a124b8020f44bc2f9c50a08d93cd40dc405097
    