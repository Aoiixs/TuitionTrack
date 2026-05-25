// HomeScreen
import React, { useEffect, useState } from "react";
import { Text, View, ScrollView, StyleSheet } from "react-native";
import styles from "../../styles/homeStyles";
import { Ionicons } from "@expo/vector-icons";
import { io, Socket } from "socket.io-client";

type StudentInfo = {
  Teller: string;
  Queue: string;
  Status: string;
  Student_Balance: number; // student balance
  Student_amount_pay: number;
};

export default function HomeScreen() {
  const [queueList, setQueueList] = useState<StudentInfo[]>([]);
  const [processing, setProcessing] = useState<StudentInfo | null>(null);

  useEffect(() => {
    const socket: Socket = io("http://192.168.232.44:5000", {
      transports: ["websocket"],
    });

    socket.on("queue_update", (data: any) => {
      const raw: any = data.payload || data;

      const info: StudentInfo = {
        Teller: raw.Teller || "N/A",
        Queue: raw.Queue || "",
        Status: (raw.Status || "Waiting").toLowerCase(),
        Student_Balance: Number(raw.Student_Balance ?? 0), 
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
        return newList.sort((a, b) => Number(a.Queue) - Number(b.Queue));
      });


      setProcessing((prev) => {
        if (info.Status === "processing") return info;
        if (prev?.Queue === info.Queue && info.Status !== "processing") return null;
        return prev;
      });
    });

    return () => socket.disconnect();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={{ padding: 15 }}>
        <Text style={styles.subHeader}>Real-time Queue Monitoring</Text>

        {processing && (
          <View style={styles.mainCard}>
            <Ionicons name="time-outline" size={35} color="#fff" />
            <Text style={styles.processingText}>Your Queue Number</Text>
            <Text style={styles.queueNumber}>{processing.Queue}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{processing.Status.toUpperCase()}</Text>
            </View>
            <Text style={styles.processingText}>
              {queueList.length > 1 ? " You're next!" : "Waiting..."}
            </Text>
          </View>
        )}

  
        {processing && (
          <View style={styles.infoRow}>
            <View style={styles.smallCard}>
              <Text style={styles.smallTitle}>Estimated Wait</Text>
              <Text style={styles.smallValue}>{queueList.length * 10} seconds</Text>
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.smallTitle}>Amount to Pay</Text>
              <Text style={styles.smallValue}>₱ {processing.Student_Balance.toFixed(2)}</Text>
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.smallTitle}>Teller</Text>
              <Text style={styles.smallValue}>{processing.Teller}</Text>
            </View>
          </View>
        )}

   
        <Text style={styles.liveHeader}>🔴 Live Queue Monitor</Text>

        {processing && (
          <View style={styles.liveCard}>
            <Text style={styles.liveQueueNumber}>Queue #{processing.Queue}</Text>
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


      </View>
    </ScrollView>
  );
}

