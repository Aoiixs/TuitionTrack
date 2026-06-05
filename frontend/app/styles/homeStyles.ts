import { StyleSheet } from "react-native";
export default StyleSheet.create({
    
  container: { backgroundColor: "#f5f7fa" },

  subHeader: {  color: "#000",
  fontWeight: "bold",
  fontSize: 18,
  marginTop: 10,
  padding: 5,
  backgroundColor: "#9bc4c4",
  borderRadius: 10,
  width: "106%",
  elevation: 3,
  marginLeft: -10
},
  
  mainCard: { backgroundColor: "#9bc4c4", borderRadius: 20, padding: 25, alignItems: "center", marginBottom: 15 },
  queueNumber: { fontSize: 70, fontWeight: "bold", color: "#fff" },
  processingText: { color: "#fff", marginTop: 10 },
  statusBadge: { backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, marginTop: 5 },
  statusText: { color: "#333" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  smallCard: { backgroundColor: "#fff", borderRadius: 10, padding: 15, flex: 1, marginHorizontal: 3, alignItems: "center" },
  smallTitle: { color: "#888", fontSize: 12, marginBottom: 5 },
  smallValue: { fontWeight: "bold", fontSize: 14 },
  liveHeader: { marginTop: 20, fontWeight: "600" },
  liveCard: { backgroundColor: "#fff", borderRadius: 10, padding: 15, marginTop: 8 },
  liveQueueNumber: { fontWeight: "bold" },
  liveStatusText: { color: "#666" },
  nextText: { color: "green", fontSize: 12 },
  paymentCard: { backgroundColor: "#fff", borderRadius: 10, padding: 15, marginTop: 15 },
  paymentHeader: { fontWeight: "bold", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
  label: { fontWeight: "600" },
  currentStatus: { backgroundColor: "#9bc4c4", padding: 12, borderRadius: 10, marginTop: 10 },
  currentStatusText: { color: "#fff", textAlign: "center" },
  
  activeM:{alignSelf: "center", fontSize: 13, marginLeft: -180},
  containers:{position: "absolute", right: 20,  justifyContent: "center",padding: 0,marginTop: 500,
  marginBottom: 2, marginLeft: 235,display: "flex", borderWidth: 1, borderRadius: 50,
  width: 67, height: 65, alignItems: 'center',
  backgroundColor: "#9bc4c4", borderColor: "white"},

  reply: {alignSelf: "flex-end", width: 100},
  input:{width: 350, marginRight: 25,height: 100,flexDirection: 'row', alignItems: 'center'},
  chatbox:{width: 325, height: 50,  borderWidth: 1, backgroundColor: "white",
  borderColor: "white", paddingHorizontal: 15, marginBottom: 15, paddingVertical: 15, elevation: 5, borderRadius: 15, },
  
  container1:{ alignSelf: "center", marginLeft: 50},

  headerRow:{flexDirection: "row", alignItems: "center"},
  logo:{width: "30%", height: 60, },

  messageBox:{maxWidth: "75%", padding: 10, borderRadius: 12, marginVertical: 5},
  userMessage: {alignSelf: "center", backgroundColor: "#e0e0e0", marginLeft: 250},
  aiMessage: {alignSelf: "flex-start", backgroundColor: "#e0e0e0"},


  chatContainer:{width: 320, alignSelf: "center",  height: 270,backgroundColor: "#f5f5f5", padding: 20,
  marginTop: 20, borderRadius: 10},
  send:{justifyContent: "center", alignItems: "center", marginLeft: -25, marginBottom: 8 },
  showBox:{width: 350, padding: 20, marginTop: 0,backgroundColor: "#9bc4c4", alignSelf: "center",borderRadius: 20},
  // activeM:{color: "white", fontSize: 10},
  header1:{alignSelf: "center",  fontWeight: "bold", fontSize: 15, marginLeft: 15},
  headers: {color: "white", fontSize: 15, alignSelf: "center", marginBottom: 280, marginRight: 130},
  activeDot:{width: 8, height: 8, display: "flex", backgroundColor: 'green', borderRadius: 20
  },
  
  brainButton: {
  position: "absolute",
  bottom: 25,
  right: 20,
  backgroundColor: "#fff",
  padding: 12,
  borderRadius: 50,
  elevation: 5,
  zIndex: 999,
},
});