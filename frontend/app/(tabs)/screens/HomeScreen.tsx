import React, { useEffect, useState } from "react";
import { Image } from "react-native";
import { Text, View, ScrollView, TouchableOpacity, TextInput } from "react-native";
import styles from "../../styles/homeStyles";
import { SendtoAI } from "./serviceAI";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import inquiry from "../../styles/inquiry";
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

  const [aiPrediction, setAiPrediction] = useState({
    waiting_students: 0,
    avg_time_per_student: 0,
    estimated_waiting_time_minutes: 0,
  });

  const [showBox, setShowBox] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);


  const mainMenu=[
    "RFID Issue",
    "Queue Concern",
    "Notification Issue",
    "Report Problem",
    "Need Help?",
    "System Guide",
  ]


 const handleInquiry = (type: string ) =>{
  let options: string[] = [];

  switch (type){


    case "Back":
      setMessages((prev) =>[
        ...prev,

        {text: "Back", sender: "user"},
        {
          text: "Please select an option: ",
          sender: "ai",
          type: "options",
          options: mainMenu,
        },
      ]);
      return;
      


    case "RFID Issue":
      options=[
          "RFID Not Detected",
          "RFID Lost",
          "RFID Damaged",
          "RFID Wrong Information",
          
          "Back",

      ];
      break;

    case "Queue Concern":
      options=[
          "Queue Not Moving",
          "Wrong Queue Number",
          "Missed Queue",
          "Long Waiting Time",
          "Back",
      ];
      break;

    case "Notification Issue":
      options=[
        "No Notification Received",
        "Delayed Notification",
        "Wrong Notification",
        "Back",
      ];
      break;

    case "Report Problem":
      options=[
        "System Error",
        "Application Crash",
        "Incorrect Data",
        "Back",
      ];
      break;

    case "Need Help?":
      options=[
        "Contact Staff",
        "Talk to Support",
        "General Inquiry",
        "Back",
      ];
      break;



    case "System Guide":
      options=[
        "How to use TuitionQueueTrack",
        "Queue System Basics",
        "RFID Guide",
        "Notifications Guide",
        "Back",
      ];
      break;



  case "How to use TuitionQueueTrack":
  setMessages((prev) => [
    ...prev,
    { text: type, sender: "user" },
    {
      text:
        "How to Use QueueTrack:\n\n" +
        "1. Scan your RFID card\n" +
        "2. Get your queue number automatically\n" +
        "3. Monitor your position in real-time\n" +
        "4. Wait until your number is called\n" +
        "5. Proceed to the assigned teller\n\n" +
        "You can leave the waiting area while waiting.",
      sender: "ai",
    },
  ]);
  return;



  case "Queue System Basics":
  setMessages((prev) => [
    ...prev,
    { text: type, sender: "user" },
    {
      text:
        "QueueTrack assigns numbers automatically based on RFID scan.\n" +
        "The system updates in real-time and shows your position in line.\n\n" +
        "Priority is based on arrival time and system rules.",
      sender: "ai",
    },
  ]);
  return;


  case "RFID Guide":
  setMessages((prev) => [
    ...prev,
    { text: type, sender: "user" },
    {
      text:
        "RFID Guide:\n\n" +
        "• Tap your RFID card at the scanner\n" +
        "• Make sure it is not damaged\n" +
        "• Keep your card registered properly\n\n" +
        "If RFID is not detected, contact ITSD.",
      sender: "ai",
    },
  ]);
  return;


  case "Notifications Guide":
  setMessages((prev) => [
    ...prev,
    { text: type, sender: "user" },
    {
      text:
        "Notifications are sent when:\n" +
        "• Your turn is near\n" +
        "• Your queue is updated\n" +
        "• System alerts are triggered\n\n",
      sender: "ai",
    },
  ]);
  return;


  

  }


  if (options.length === 0){
    setMessages((prev) =>[
      ...prev,
      {text: type, sender: "user"},
      
    ]);

    SendtoAI(type).then((data)=> {
      setMessages((prev) =>[
        ...prev,
        {
          text: data.reply, sender: "ai"},
      ]);
    });
    return;
  }

  setMessages((prev) =>[
    ...prev,
    {
      text: "Please select an option: ",
      sender: "ai",
      type: "options",
      options,

    },
  ]);
  
 };

 



  // ================= POSITION =================
  const getPosition = () => {
    if (!processing) return null;

    const sorted = [...queueList].sort(
      (a, b) => Number(a.Queue) - Number(b.Queue)
    );

    const index = sorted.findIndex((s) => s.Queue === processing.Queue);

    return index >= 0 ? index + 1 : null;
  };

  // ================= SOCKET =================
  useEffect(() => {

    const socket: Socket = io("http://192.168.1.52:5000", {
      transports: ["websocket"],
    });

    let lastUpdate = 0;

    const fetchPrediction = async () => {
      try {
        const res = await fetch("http://192.168.1.52:5000/ai-prediction");
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

        if (status === "processing") {
          return info;
        }

        if (prev?.Queue === info.Queue && status !== "processing") {
          return null;
        }

        return prev;
      });

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
    <View style={{ flex: 1 }}>

      {/* ================= SCROLL CONTENT ================= */}
      <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 120 }}>

        {/* LOGO */}
        <Text style={styles.subHeader}>
          <Image
            source={require("../../../..//frontend/assets/images/Tqueue.logo.png")}
            style={styles.logo}
          />
        </Text>

        {/* PROCESSING CARD */}
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

        {/* INFO ROW */}
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

        {/* LIVE QUEUE */}
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
          .map((student) => (
            <View key={student.Queue} style={styles.liveCard}>
              <Text style={styles.liveQueueNumber}>{student.Queue}</Text>
              <Text style={styles.liveStatusText}>{student.Status}</Text>
            </View>
          ))}

      </ScrollView>

      {/* ================= AI FLOATING BUTTON ================= */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowBox(!showBox)}
      >
        <MaterialCommunityIcons name="brain" size={35} color="#ffffff" />
      </TouchableOpacity>





      {/* ================= CHAT BOX ================= */}
      {showBox && (
        <View style={styles.showBox}>


          <View style={styles.headerRow}>
            <View style={styles.activeDot} />
            <Text style={styles.header1}>AI Assistant</Text>
          </View>

          <Text style={styles.activeM}>Active Monitoring</Text>

          <ScrollView style={styles.chatContainer}
          nestedScrollEnabled={true}
          
          >
            <View style={inquiry.inquiryContainer}>
              

              <Text style={inquiry.swipeHint}>
                {"Swipe for more options"}
                </Text>
              
              <ScrollView horizontal
              showsHorizontalScrollIndicator={true}
              nestedScrollEnabled={true}
          

              contentContainerStyle={{
                gap: 20,
                paddingHorizontal: 10,
                marginRight: 15
              
              }
              }
              >
              <TouchableOpacity
              style = {inquiry.inquiryButton}
              onPress={()=> {handleInquiry("RFID Issue")}}>
                <Text style={inquiry.inquiryText}>RFID Issue</Text>
              </TouchableOpacity>



              <TouchableOpacity
              style = {inquiry.inquiryButton}
              onPress={()=> {handleInquiry("Queue Concern")}}>
                <Text style={inquiry.inquiryText}>Queue Concern</Text>
              </TouchableOpacity>


              <TouchableOpacity
              style = {inquiry.inquiryButton}
              onPress={()=> {handleInquiry("Notification Issue")}}>
                <Text style={inquiry.inquiryText}>Notification Issue</Text>
              </TouchableOpacity>



              <TouchableOpacity
              style = {inquiry.inquiryButton}
              onPress={()=> {handleInquiry("Report Problem")}}>
                <Text style={inquiry.inquiryText}>Report Problem</Text>
              </TouchableOpacity>



                <TouchableOpacity
              style = {inquiry.inquiryButton}
              onPress={()=> {handleInquiry("Need Help?")}}>
                <Text style={inquiry.inquiryText}>Need Help?</Text>
              </TouchableOpacity>


              <TouchableOpacity
              style = {inquiry.inquiryButton}
              onPress={()=> {handleInquiry("System Guide")}}>
                <Text style={inquiry.inquiryText}>System Guide</Text>
              </TouchableOpacity>

              </ScrollView>
              
              
           
          
          </View>
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

                 {msg.type === "options" &&(
                  <View>
                    {msg.options.map((option: string, i: number) => (
                      <TouchableOpacity
                      key={i}
                      style={inquiry.inquiryButton}
                      onPress={() => handleInquiry(option)}>
                        <Text>{option}</Text>
                      </TouchableOpacity>
                    ))}
                    </View>

                )} 
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
                <Ionicons name="paper-plane" size={27} color="#3467f4" />
              </TouchableOpacity>

            </View>
          </View>

        </View>
      )}

    </View>
  );
}
