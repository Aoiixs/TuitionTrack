
import styles from "../../styles/notifStyles";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native";

import io from "socket.io-client";


const socket = io("http://192.168.1.8:5000", {
  transports: ["websocket"],
  forceNew: true,
});

export default function NotifScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const fetchNotifications = () => {
    fetch("http://192.168.1.8:5000/api/notifications")
      .then(res => res.json())
      .then(data => {
        setNotifications(data);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
        setRefreshing(false);
      });
  };


  useEffect(() => {
    fetchNotifications();


    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log(" Disconnected");
    });


    socket.on("new_notification", (data) => {
      console.log("New notification:", data);

      if (data) {
        Alert.alert(
          data.title || "Notification",
          data.message || ""
        );
      }


      fetchNotifications();
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("new_notification");
    };
  }, []);


  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };


  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No notifications</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
