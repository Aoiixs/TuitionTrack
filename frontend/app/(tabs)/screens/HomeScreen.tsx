import React, { useEffect, useState, useCallback } from "react";
import { Image, Text, View, ScrollView, TouchableOpacity, TextInput } from "react-native";
import styles from "../../styles/homeStyles";
import inquiry from "../../styles/inquiry";
import { SendtoAI } from "./serviceAI";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { io, Socket } from "socket.io-client";

// ================= TYPES =================
type StudentInfo = {
  Teller: string;
  Queue: string;
  Status: string;
  Student_Balance: number;
  Student_amount_pay: number;
};

type AiPrediction = {
  students_ahead: number;
  avg_time_per_student: number;
  estimated_waiting_time_minutes: number;
  current_processing_remaining?: number;
};

export default function HomeScreen() {

  const [queueList, setQueueList] = useState<StudentInfo[]>([]);
  const [processing, setProcessing] = useState<StudentInfo | null>(null);

  const [aiPrediction, setAiPrediction] = useState<AiPrediction>({
    students_ahead: 0,
    avg_time_per_student: 0,
    estimated_waiting_time_minutes: 0,
  });

  const [showBox, setShowBox] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  const mainMenu = [
    "RFID Issue",
    "Queue Concern",
    "Notification Issue",
    "Report Problem",
    "Need Help?",
    "System Guide",
  ];

  // ================= AI FETCH =================
  const fetchPrediction = useCallback(async () => {
    try {
      if (!processing?.Queue) return;

      const res = await fetch(
        `http://192.168.1.7:5000/ai-prediction/${processing.Queue}`
      );

      const data = await res.json();
      setAiPrediction(data);

    } catch (err) {
      console.log("AI prediction error:", err);
    }
  }, [processing?.Queue]);

  // ================= INQUIRY =================
  const handleInquiry = (type: string) => {
    let options: string[] = [];

    switch (type) {

      case "RFID Issue":
        options = ["RFID Not Detected", "RFID Lost", "RFID Damaged", "Back"];
        break;

      case "Queue Concern":
        options = ["Queue Not Moving", "Wrong Queue Number", "Missed Queue", "Back"];
        break;

      case "Notification Issue":
        options = ["No Notification Received", "Delayed Notification", "Back"];
        break;

      case "Report Problem":
        options = ["System Error", "Application Crash", "Back"];
        break;

      case "Need Help?":
        options = ["Contact Staff", "General Inquiry", "Back"];
        break;

      case "System Guide":
        options = ["How to use QueueTrack", "Queue Basics", "Back"];
        break;

      case "How to use QueueTrack":
        setMessages(prev => [
          ...prev,
          { text: type, sender: "user" },
          {
            text:
              "1. Scan RFID\n2. Get queue number\n3. Monitor live\n4. Wait for turn\n5. Proceed to teller",
            sender: "ai",
          },
        ]);
        return;

      default:
        break;
    }

    if (options.length === 0) {
      setMessages(prev => [...prev, { text: type, sender: "user" }]);

      SendtoAI(type).then((data) => {
        setMessages(prev => [...prev, { text: data.reply, sender: "ai" }]);
      });

      return;
    }

    setMessages(prev => [
      ...prev,
      { text: "Please select an option:", sender: "ai", type: "options", options },
    ]);
  };

  // ================= POSITION =================
  const getPosition = () => {
    if (!processing) return null;

    const sorted = [...queueList].sort(
      (a, b) => parseInt(a.Queue) - parseInt(b.Queue)
    );

    const index = sorted.findIndex((s) => s.Queue === processing.Queue);

    return index >= 0 ? index + 1 : null;
  };

  // ================= SOCKET =================
  useEffect(() => {

    const socket: Socket = io("http://192.168.1.7:5000", {
      transports: ["websocket"],
    });

    let lastUpdate = 0;

    const fetchPredictionSafe = async () => {
      if (!processing?.Queue) return;
      await fetchPrediction();
    };

    socket.on("queue_update", (data: any) => {

      const raw = data.payload || data;

      const status = (raw.Status || "waiting").toLowerCase().trim();

      const info: StudentInfo = {
        Teller: raw.Teller || "N/A",
        Queue: raw.Queue || "",
        Status: status,
        Student_Balance: Number(raw.Student_Balance ?? 0),
        Student_amount_pay: Number(raw.Student_amount_pay ?? 0),
      };

      if (!info.Queue) return;

      setQueueList((prev) => {
        const index = prev.findIndex((s) => s.Queue === info.Queue);

        let newList;
        if (index >= 0) {
          newList = [...prev];
          newList[index] = info;
        } else {
          newList = [...prev, info];
        }

        return newList.sort((a, b) =>
          parseInt(a.Queue) - parseInt(b.Queue)
        );
      });

      if (status === "processing") {
        setProcessing(info);
      } else {
        setProcessing((prev) =>
          prev?.Queue === info.Queue ? null : prev
        );
      }

      const now = Date.now();
      if (now - lastUpdate > 2000) {
        fetchPredictionSafe();
        lastUpdate = now;
      }
    });

    fetchPredictionSafe();
    const interval = setInterval(fetchPredictionSafe, 5000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };

  }, [fetchPrediction]);

  // ================= UI =================
  const eta = aiPrediction?.estimated_waiting_time_minutes ?? 0;

  return (
    <View style={{ flex: 1 }}>

      <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 120 }}>

        {/* LOGO */}
        <Text style={styles.subHeader}>
          <Image
            source={require("../../../..//frontend/assets/images/Tqueue.logo.png")}
            style={styles.logo}
          />
        </Text>

        {/* PROCESSING */}
        {processing && (
          <View style={styles.mainCard}>
            <Ionicons name="time-outline" size={35} color="#fff" />
            <Text style={styles.processingText}>Your Queue Number</Text>
            <Text style={styles.queueNumber}>{processing.Queue}</Text>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {processing.Status.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.processingText}>
              You are #{getPosition() ?? 0} in line
            </Text>
          </View>
        )}

        {/* INFO */}
        {processing && (
          <View style={styles.infoRow}>

            <View style={styles.smallCard}>
              <Text style={styles.smallTitle}>Estimated Wait</Text>
              <Text style={styles.smallValue}>
                {eta > 0 ? `${Math.round(eta)} min` : "Calculating..."}
              </Text>

              <Text style={{ fontSize: 10, color: "#666" }}>
                {aiPrediction.students_ahead} students ahead
              </Text>
            </View>

            <View style={styles.smallCard}>
              <Text style={styles.smallTitle}>Amount</Text>
              <Text style={styles.smallValue}>
                ₱ {processing.Student_Balance.toFixed(2)}
              </Text>
            </View>

            <View style={styles.smallCard}>
              <Text style={styles.smallTitle}>Teller</Text>
              <Text style={styles.smallValue}>{processing.Teller}</Text>
            </View>

          </View>
        )}

        {/* LIVE QUEUE */}
        <Text style={styles.liveHeader}>🔴 Live Queue</Text>

        {processing && (
          <View style={styles.liveCard}>
            <Text style={styles.liveQueueNumber}>
              Queue #{processing.Queue}
            </Text>
            <Text style={styles.liveStatusText}>Now Processing</Text>
          </View>
        )}

        {queueList
          .filter(s => s.Queue !== processing?.Queue)
          .map((student) => (
            <View key={student.Queue} style={styles.liveCard}>
              <Text style={styles.liveQueueNumber}>{student.Queue}</Text>
              <Text style={styles.liveStatusText}>{student.Status}</Text>
            </View>
          ))}

      </ScrollView>

      {/* AI BUTTON */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowBox(!showBox)}
      >
        <MaterialCommunityIcons name="brain" size={35} color="#fff" />
      </TouchableOpacity>

      {/* CHAT */}
      {showBox && (
        <View style={styles.showBox}>

          <ScrollView style={styles.chatContainer}>

            {messages.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.messageBox,
                  msg.sender === "user"
                    ? styles.userMessage
                    : styles.aiMessage,
                ]}
              >
                <Text>{msg.text}</Text>

                {msg.type === "options" && (
                  <View>
                    {msg.options.map((opt: string, i: number) => (
                      <TouchableOpacity
                        key={i}
                        style={inquiry.inquiryButton}
                        onPress={() => handleInquiry(opt)}
                      >
                        <Text>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}

          </ScrollView>

          <View style={styles.container1}>
            <TextInput
              placeholder="Send a message"
              value={message}
              onChangeText={setMessage}
              style={styles.chatbox}
            />

            <TouchableOpacity
              onPress={async () => {
                if (!message.trim()) return;

                const userMessage = message;
                setMessage("");

                setMessages(prev => [...prev, { text: userMessage, sender: "user" }]);

                const data = await SendtoAI(userMessage);

                setMessages(prev => [...prev, { text: data.reply, sender: "ai" }]);
              }}
            >
              <Ionicons name="paper-plane" size={27} color="#3467f4" />
            </TouchableOpacity>

          </View>

        </View>
      )}

    </View>
  );
}