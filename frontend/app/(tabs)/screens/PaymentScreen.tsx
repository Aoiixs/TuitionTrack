// PaymentHistoryScreen
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { io, Socket } from "socket.io-client";
import styles from "../../styles/paymentStyles";

type PaymentRecord = {
  id: string; 
  Amount: number;
  Status: "Completed" | "Cancelled";
  Timestamp: string;
};

export default function PaymentHistoryScreen() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [totalPaid, setTotalPaid] = useState<number>(0);

  useEffect(() => {
    const API_URL = "http://192.168.11.142:5000";


    const fetchPaymentHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/payment_history`);
        const data = await res.json();

        if (!Array.isArray(data)) {
          console.warn("Invalid API response:", data);
          return;
        }

        const mapped: PaymentRecord[] = data
          .map((p, i) => ({
            id: String(p.id ?? i),
            Amount: Number(p.amount_paid ?? 0),
            Status: Number(p.amount_paid ?? 0) > 0 ? "Completed" : "Cancelled",
            Timestamp: p.payment_date || "",
          }))
          .filter((p) => p.Amount > 0);

        setPayments(mapped);
        setTotalPaid(mapped.reduce((acc, p) => acc + p.Amount, 0));
      } catch (err) {
        console.error("Failed to fetch payment history:", err);
      }
    };

    fetchPaymentHistory();


    const socket: Socket = io(API_URL, {
      transports: ["websocket"],
    });

    socket.on("payment_update", (p: any) => {
      if (!p) return;

      const newRecord: PaymentRecord = {
        id: String(p.id ?? Date.now()),
        Amount: Number(p.amount_paid ?? 0),
        Status: Number(p.amount_paid ?? 0) > 0 ? "Completed" : "Cancelled",
        Timestamp: p.payment_date || "",
      };

      if (newRecord.Amount <= 0) return;

      setPayments((prev) => {
        const index = prev.findIndex((item) => item.id === newRecord.id);

        let updated;
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = newRecord;
          updated = copy;
        } else {
          updated = [newRecord, ...prev];
        }

        setTotalPaid(updated.reduce((acc, p) => acc + p.Amount, 0));
        return updated;
      });
    });

    return () => socket.disconnect();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Payment History</Text>

      {/* TOTAL */}
      <View style={styles.totalCard}>
        <Text style={styles.totalText}>Paid</Text>
        <Text style={styles.amountText}>₱ {totalPaid.toFixed(2)}</Text>
      </View>

      {payments.length === 0 ? (
        <View style={styles.noHistory}>
          <Text style={styles.noHistoryText}>No Payment History</Text>
          <Text style={styles.noHistorySubtext}>
            You don't have any completed payments yet.
          </Text>
        </View>
      ) : (
        payments.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.row}>
              <Text
                style={[
                  styles.status,
                  p.Status === "Completed"
                    ? styles.completed
                    : styles.cancelled,
                ]}
              >
                {p.Status}
              </Text>
            </View>

            <Text style={styles.amount}>₱ {p.Amount.toFixed(2)}</Text>
            <Text style={styles.timestamp}>{p.Timestamp}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}