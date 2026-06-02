import React, { useEffect, useState } from "react";
import { Image } from "react-native";
import { Text, View, ScrollView, TouchableOpacity, TextInput } from "react-native";
import styles from "../../styles/homeStyles";
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

type AIPrediction = {
  waiting_students: number;
  avg_time_per_student: number;
  estimated_waiting_time_minutes: number;
};

export default function HomeScreen() {

  const [queueList, setQueueList] = useState<StudentInfo[]>([]);
  const [processing, setProcessing] = useState<StudentInfo | null>(null);

  // SAFE DEFAULT
  const [aiPrediction, setAiPrediction] = useState<AIPrediction>({
    waiting_students: 0,
    avg_time_per_student: 0,
    estimated_waiting_time_minutes: 0,
  });

  const [showBox, setShowBox] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  // ================= SAFE POSITION =================
  const getPosition = () => {
    if (!processing) return null;

    const sorted = [...queueList].sort(
      (a, b) => Number(a.Queue) - Number(b.Queue)
    );

    const index = sorted.findIndex((s) => s.Queue === processing.Queue);

    return index >= 0 ? index + 1 : null;
  };

  // ================= SOCKET + AI =================
  useEffect(() => {

    const socket: Socket = io("http://192.168.1.14:5000", {
      transports: ["websocket"],
    });

    let lastUpdate = 0;

    const fetchPrediction = async () => {
      try {
        const res = await fetch("http://192.168.1.14:5000/ai-prediction");
        const data = await res.json();
        setAiPrediction(data);
      } catch (err) {
        console.log("AI prediction error:", err);
      }
    };

    socket.on("ai_refresh", () => {
      fetchPrediction();
    });
    
    socket.on("queue_update", (data: any) => {

      const raw: any = data.payload || data;

      const status = (raw.Status || "waiting").toLowerCase().trim();

      const info: StudentInfo = {
        Teller: raw.Teller || "N/A",
        Queue: raw.Queue || "",
        Status: status,
        Student_Balance: Number(raw.Student_Balance ?? 0),
        Student_amount_pay: raw.Student_amount_pay ?? 0,
      };

      if (!info.Queue) return;

      // ================= FIXED QUEUE LIST =================
      setQueueList((prev) => {
        const index = prev.findIndex((s) => s.Queue === info.Queue);
        let newList;

        if (index >= 0) {
          newList = [...prev];
          newList[index] = info;
        } else {
          newList = [...prev, info];
        }

        return newList.sort((a, b) => Number(a.Queue) - Number(b.Queue));
      });

      // ================= FIXED PROCESSING LOGIC =================
      setProcessing((prev) => {

        if (status === "processing") {
          return info;
        }

        if (prev?.Queue === info.Queue && status !== "processing") {
          return null;
        }

        return prev;
      });

      // ================= SAFE AI REFRESH =================
      const now = Date.now();
      if (now - lastUpdate > 1500) {
        fetchPrediction();
        lastUpdate = now;
      }
    });

    fetchPrediction();
    const interval = setInterval(fetchPrediction, 5000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };

  }, []);

  // ================= UI =================
  return (
    <ScrollView style={styles.container}>
      <View style={{ padding: 15 }}>

        {/* LOGO */}
        <Text style={styles.subHeader}>
          <Image
            source={require("../../../..//frontend/assets/images/Tqueue.logo.png")}
            style={styles.logo}
          />
        </Text>

        {/* ================= PROCESSING CARD ================= */}
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
              {queueList.length > 1 ? "You're next!" : "Waiting..."}
            </Text>

            <Text style={styles.processingText}>
              You are #{getPosition() ?? 0} in line
            </Text>
          </View>
        )}

        {/* ================= INFO ROW ================= */}
        {processing && (
          <View style={styles.infoRow}>

            <View style={styles.smallCard}>
              <Text style={styles.smallTitle}>Estimated Wait</Text>

              <Text style={styles.smallValue}>
                {aiPrediction?.estimated_waiting_time_minutes > 0
                  ? `${Math.round(aiPrediction.estimated_waiting_time_minutes)} min`
                  : "Calculating..."}
              </Text>

              <Text style={{ fontSize: 10, color: "#666", marginTop: 5 }}>
                {aiPrediction.waiting_students} students ahead
              </Text>
            </View>

            <View style={styles.smallCard}>
              <Text style={styles.smallTitle}>Amount to Pay</Text>
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

        {/* ================= LIVE QUEUE ================= */}
        <Text style={styles.liveHeader}>🔴 Live Queue Monitor</Text>

        {processing && (
          <View style={styles.liveCard}>
            <Text style={styles.liveQueueNumber}>
              Queue #{processing.Queue}
            </Text>
            <Text style={styles.liveStatusText}>Now Processing</Text>
          </View>
        )}

        {queueList
          .filter((s) => s.Queue !== processing?.Queue)
          .map((student, index) => (
            <View key={student.Queue} style={styles.liveCard}>
              <Text style={styles.liveQueueNumber}>{student.Queue}</Text>
              <Text style={styles.liveStatusText}>{student.Status}</Text>
              {index === 0 && <Text style={styles.nextText}>Next</Text>}
            </View>
          ))}

        {/* ================= AI BUTTON ================= */}
        <TouchableOpacity onPress={() => setShowBox(!showBox)}>
          <View style={styles.containers}>
            <MaterialCommunityIcons name="brain" size={35} color="dark-gray" />
          </View>
        </TouchableOpacity>

        {/* ================= CHAT BOX ================= */}
        {showBox && (
          <View style={styles.showBox}>

            <View style={styles.headerRow}>
              <View style={styles.activeDot} />
              <Text style={styles.header1}>AI Assistant</Text>
            </View>

            <Text style={styles.activeM}>Active Monitoring</Text>

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
                </View>
              ))}
            </ScrollView>

            <View style={styles.container1}>
              <View style={styles.input}>
                <TextInput
                  placeholder="Send a message"
                  value={message}
                  onChangeText={setMessage}
                  style={styles.chatbox}
                />

                <TouchableOpacity
                  style={styles.send}
                  onPress={async () => {

                    if (message.trim() === "") return;

                    const userMessage = message;
                    setMessage("");

                    setMessages((prev) => [
                      ...prev,
                      { text: userMessage, sender: "user" },
                    ]);

                    const data = await SendtoAI(userMessage);

                    setMessages((prev) => [
                      ...prev,
                      { text: data.reply, sender: "ai" },
                    ]);
                  }}
                >
                  <Ionicons name="paper-plane" size={30} color="#3467f4" />
                </TouchableOpacity>

              </View>
            </View>

          </View>
        )}

      </View>
    </ScrollView>
  );
}