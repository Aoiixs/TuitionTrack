// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1f2933",
        tabBarInactiveTintColor: "gray",
      }}
    >
      <Tabs.Screen
        name="screens/HomeScreen"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />



           <Tabs.Screen
        name="screens/QueueScreen"
        options={{
          title: "Queue Status",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}


        
      />
      <Tabs.Screen
        name="screens/PaymentScreen"
        options={{
          title: "Payment History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
      name="screens/NotifScreen"
      options={{
        title: "Notification",
        tabBarIcon: ({ color, size }) => (
        <Ionicons name="notifications-outline" size={size} color={color} />
    ),
  }}
/>
 
    </Tabs>
  );
}

