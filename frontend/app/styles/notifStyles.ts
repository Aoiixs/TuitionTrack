import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  card: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#9bc4c4",
    marginBottom: 10,

  },
  title: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 16,
    color: "#fff"
  },
  message: {
    fontSize: 14,
    color: "#fff"
  },
  time: {
    marginTop: 8,
    fontSize: 12,
    color: "#fff"
    ,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "gray",
  },
});