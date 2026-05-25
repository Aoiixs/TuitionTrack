import { StyleSheet } from "react-native";
export default StyleSheet.create({
  container: { backgroundColor: "#f5f7fa", flex: 1, padding: 15 },
  header: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },

  totalCard: {
    backgroundColor: "#9bc4c4",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  totalText: { color: "#fff", fontSize: 16 },
  amountText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 5,
  },

  noHistory: { alignItems: "center", marginTop: 50 },
  noHistoryText: { color: "#888", fontSize: 16, fontWeight: "500" },
  noHistorySubtext: { color: "#888", fontSize: 12, marginTop: 5 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  status: {
    fontWeight: "600",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  completed: { backgroundColor: "#9bc4c4", color: "#fff" },
  cancelled: { backgroundColor: "#eee", color: "#555" },

  amount: { fontSize: 16, fontWeight: "700", marginTop: 5 },
  timestamp: { fontSize: 12, color: "#888", marginTop: 3 },
});