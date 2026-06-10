import { StyleSheet } from "react-native";


export default StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },

  label: {
    fontWeight: "600",
    color: "#555",
  },

  status: {
    backgroundColor: "#9bc4c4",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
  },

  statusText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },

fab: {
  position: "absolute",
  bottom: 20,
  right: 20,
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: "#9bc4c4",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  elevation: 20,
},

  reply: {alignSelf: "flex-end", width: 100},
  input:{width: 350, marginRight: 25,height: 100,flexDirection: 'row', alignItems: 'center'},
  chatbox:{width: 325, height: 50,  borderWidth: 1, backgroundColor: "white",
  borderColor: "white", paddingHorizontal: 15, marginBottom: 15, paddingVertical: 15, elevation: 5, borderRadius: 15, },
  
  container1:{ alignSelf: "center", marginLeft: 50},

  headerRow:{flexDirection: "row", alignItems: "center"},
  logo:{width: "30%", height: 60, },

  messageBox:{maxWidth: "80%", padding: 10, borderRadius: 12, marginVertical: 5, marginTop: 40},
  userMessage: {alignSelf: "flex-end", backgroundColor: "#e0e0e0", bottom: 20},
  aiMessage: {alignSelf: "flex-start", backgroundColor: "#e0e0e0", bottom: 20},


  chatContainer:{width: 340, alignSelf: "center",  height: 300,backgroundColor: "#f5f5f5", padding: 20,
  marginTop: 10, borderRadius: 10},
  send:{justifyContent: "center", alignItems: "center", marginLeft: -50, marginBottom: 12 },
  showBox:{width: 350, padding: 20, marginBottom: 100,backgroundColor: "#9bc4c4", alignSelf: "center",borderRadius: 20},
  // activeM:{color: "white", fontSize: 10},
  header1:{alignSelf: "center",  fontWeight: "bold", fontSize: 15, marginLeft: 15},
  headers: {color: "white", fontSize: 15, alignSelf: "center", marginBottom: 280, marginRight: 130},
  activeDot:{width: 8, height: 8, display: "flex", backgroundColor: 'green', borderRadius: 20},
  
  activeM:{alignSelf: "center", fontSize: 13, marginLeft: -180},

}); 