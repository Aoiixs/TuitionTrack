import requests
import time
import serial


arduino = serial.Serial('COM7', 9600, timeout=1)

url = "http://127.0.0.1:5000/process-data"

while True:
    if arduino.in_waiting > 0:
        data = arduino.readline().decode('utf-8', errors='ignore').strip()
        if data == "":
            continue

        # RFIDCount: COUNTSS....
        if data.startswith("ID:") and "RFIDCount:" in data:
            try:
                parts = data.split(",")
                id_number = parts[0].split(":")[1].strip()

                payload = {
                    "Id_Number": id_number,
                }

                print("Payload to backend:", payload)

                # Send to backend
                response = requests.post(url, json=payload, timeout=5)
                response.raise_for_status()
                result = response.json()

                queue_number = result.get("queue_number")
                teller = result.get("teller")

                if queue_number is not None and teller is not None:
                    send_data = f"{queue_number},{teller}\n"
                    arduino.write(send_data.encode())
                    print(f"Sent to Arduino: Queue: {queue_number}, Teller: {teller}")

            except Exception as e:
                print("Error processing Arduino data:", e)
