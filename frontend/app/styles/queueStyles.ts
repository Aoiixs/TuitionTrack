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
});