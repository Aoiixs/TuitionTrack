// PaymentScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { io, Socket } from "socket.io-client";
import styles from "../../styles/queueStyles";

type StudentPayment = {
  Queue: string;
  Teller: string;
  Name: string;
  Last_Name: string;
  Student_Year: string;
  Student_Course: string;
  Student_Balance: number;
  Status: string;
};

export default function PaymentScreen() {
  const [currentPayment, setCurrentPayment] = useState<StudentPayment | null>(null);

  useEffect(() => {

    const socket: Socket = io("http://192.168.1.8:5000", {

      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("queue_update", (data: any) => {
      const raw = data.payload || data;

      const amount = Number(raw.Student_Balance ?? 0);

      const info: StudentPayment = {
        Queue: String(raw.Queue ?? ""),
        Teller: String(raw.Teller ?? "N/A"),
        Name: raw.Name ?? "",
        Last_Name: raw.Last_Name ?? "",
        Student_Year: raw.Student_Year ?? "",
        Student_Course: raw.Student_Course ?? "",
   
        Student_Balance: isNaN(amount) ? 0 : amount,
        Status: raw.Status?.toLowerCase() ?? "waiting",
      };

      setCurrentPayment((prev) => {
   
        if (info.Status === "processing") {
          return info;
        }


        if (prev && prev.Queue === info.Queue && info.Status !== "processing") {
          return null;
        }

        return prev;
      });
    });

    return () => socket.disconnect();
  }, []); 


  if (!currentPayment) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, color: "#555" }}>
          No active payment
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: "#f5f7fa", flex: 1 }}>
      <View style={{ padding: 20 }}>
        <Text style={styles.header}>Payment Info</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Queue #</Text>
            <Text>{currentPayment.Queue}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Teller</Text>
            <Text>{currentPayment.Teller}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text>
              {currentPayment.Name} {currentPayment.Last_Name}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Course</Text>
            <Text>{currentPayment.Student_Course}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Year</Text>
            <Text>{currentPayment.Student_Year}</Text>
          </View>

       

          {/* ✅ Balance (separate na if needed mo later) */}
          <View style={styles.row}>
            <Text style={styles.label}>Remaining Balance</Text>
            <Text>₱ {currentPayment.Student_Balance.toFixed(2)}</Text>
          </View>

         
       
          </View>
        </View>
    </ScrollView>

  );
}
