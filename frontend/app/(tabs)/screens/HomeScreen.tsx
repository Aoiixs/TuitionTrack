// HomeScreen
import React, { useEffect, useState} from "react";
import {Image} from "react-native";
import { Text, View, ScrollView, StyleSheet, TouchableOpacity, TextInput} from "react-native";
import styles from "../../styles/homeStyles";
import { SendtoAI } from "./serviceAI";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const [showBox, setShowBox] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);



  useEffect(() => {
    const socket: Socket = io("http://192.168.1.8:5000", {
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
      <View style={{ padding: 15}}>
        <Text style={styles.subHeader}>
           <Image
          source={require('../../../..//frontend/assets/images/Tqueue.logo.png')}
            style={styles.logo}
            />
          </Text>


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

          <TouchableOpacity onPress={()=> setShowBox(!showBox)}>
            <View style={styles.containers}>
              <MaterialCommunityIcons
              name="brain"
              size={35}
              color="dark-gray"
              />
            </View>
          </TouchableOpacity>        
          </View>
          
          {showBox &&(
            <View style={styles.showBox}>
            <View style={styles.headerRow}>
            <View style={styles.activeDot}/>
            <Text style={styles.header1}>AI Assistant</Text>
            </View>
           
            <Text style={styles.activeM}>Active Monitoring</Text>
            

            <ScrollView style={styles.chatContainer}>
              {messages.map((msg, index)=> (
                <View key = {index} style={[styles.messageBox, msg.sender === "user"
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

              onPress={async () =>{
                if (message.trim() ==="") return;
                const userMessage = message;
                setMessage("");

                setMessages((prev) => [...prev, { text: userMessage, sender: "user"}]);
                const data = await SendtoAI(userMessage);

                setMessages((prev) => [...prev, {text: data.reply, sender: "ai"}]);
              }}
              >
            <Ionicons
            style={styles.send}
              name="paper-plane"
              size={30}
              color={"#3467f4"}
              />
              </TouchableOpacity>
            </View>
            </View>
  
            </View>

)}
 
</ScrollView>
);
}