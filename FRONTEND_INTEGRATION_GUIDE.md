# Frontend Integration Guide - Announcements & Chat

## Current Status

The backend is fully implemented, but the frontend UI for announcements and chat is not yet integrated into the dashboards. This guide shows exactly where and how to add them.

## Quick Answer

**Currently, the announcements and chat tabs are NOT visible in the dashboards yet.** They need to be added to:
1. Student Dashboard sidebar navigation
2. Doctor Dashboard sidebar navigation  
3. The UI sections for each tab

## Step-by-Step Integration

### For Student Dashboard

#### 1. Add Icons to Imports (Line ~42)

Already done - MessageSquare and AlertTriangle icons are available.

#### 2. Add Socket Context Import (After line 4)

```jsx
import { useSocket } from "../context/SocketContext";
```

#### 3. Add State Variables (After line 181)

```jsx
  // Emergency Communication state
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [emergencyChatRooms, setEmergencyChatRooms] = useState([]);
  const [emergencyChatRoomsLoading, setEmergencyChatRoomsLoading] = useState(false);
  const [selectedEmergencyChatRoom, setSelectedEmergencyChatRoom] = useState(null);
  const [emergencyChatMessages, setEmergencyChatMessages] = useState([]);
  const [emergencyNewMessage, setEmergencyNewMessage] = useState("");
  const socket = useSocket();
```

#### 4. Add Tabs to Sidebar Navigation (Around line 881-894)

```jsx
{[
  { id: "submit", label: "Submit Symptoms", icon: Send },
  {
    id: "queue",
    label: "Book Appointment",
    icon: CalendarClock,
    hasNotification: notifications.length > 0,
  },
  { id: "announcements", label: "Announcements", icon: AlertTriangle },
  { id: "emergency-chat", label: "Emergency Chat", icon: MessageSquare },
  { id: "records", label: "My Records", icon: FileText },
  { id: "leaves", label: "Medical Leaves", icon: Calendar },
  { id: "diet", label: "Diet Plan", icon: Utensils },
  { id: "documents", label: "Medical Documents", icon: FolderOpen },
  { id: "qrcode", label: "My QR Code", icon: Hash },
  { id: "profile", label: "My Profile", icon: User },
].map((tab) => (
```

#### 5. Add Fetch Functions (After fetchMedicalSummary function, around line 234)

```jsx
  // Fetch announcements
  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const response = await api.get("/announcements/active");
      setAnnouncements(response.data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // Fetch emergency chat rooms
  const fetchEmergencyChatRooms = async () => {
    setEmergencyChatRoomsLoading(true);
    try {
      const response = await api.get("/chat/rooms");
      setEmergencyChatRooms(response.data);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    } finally {
      setEmergencyChatRoomsLoading(false);
    }
  };

  // React to announcement
  const handleReactToAnnouncement = async (announcementId) => {
    try {
      const response = await api.post(`/announcements/${announcementId}/react`);
      await fetchEmergencyChatRooms();
      setActiveTab("emergency-chat");
      // Find and select the new chat room
      const newRoom = await api.get(`/chat/rooms`);
      const room = newRoom.data.find(
        (r) => r.announcement?._id === announcementId
      );
      if (room) {
        setSelectedEmergencyChatRoom(room);
        await fetchEmergencyChatMessages(room._id);
      }
      alert(response.data.message || "Chat room created! You are now in queue.");
    } catch (error) {
      console.error("Error reacting to announcement:", error);
      alert(error.response?.data?.message || "Error reacting to announcement");
    }
  };

  // Fetch messages for a chat room
  const fetchEmergencyChatMessages = async (roomId) => {
    try {
      const response = await api.get(`/chat/rooms/${roomId}/messages`);
      setEmergencyChatMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Send message
  const handleSendEmergencyMessage = async (e) => {
    e.preventDefault();
    if (!emergencyNewMessage.trim() || !selectedEmergencyChatRoom) return;

    try {
      const response = await api.post(
        `/chat/rooms/${selectedEmergencyChatRoom._id}/messages`,
        { message: emergencyNewMessage }
      );
      setEmergencyNewMessage("");
      await fetchEmergencyChatMessages(selectedEmergencyChatRoom._id);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
```

#### 6. Update useEffect to Fetch Data (Around line 194)

```jsx
  useEffect(() => {
    if (activeTab === "documents") {
      fetchDocuments();
      fetchMedicalSummary();
    }
    if (activeTab === "queue") {
      fetchDoctors();
      fetchMyAppointments();
    }
    if (activeTab === "announcements") {
      fetchAnnouncements();
    }
    if (activeTab === "emergency-chat") {
      fetchEmergencyChatRooms();
    }
  }, [activeTab]);
```

#### 7. Add Socket Listeners (After useEffect for chatEndRef, around line 213)

```jsx
  useEffect(() => {
    if (!socket) return;

    socket.on("new-announcement", (announcement) => {
      setAnnouncements((prev) => [announcement, ...prev]);
    });

    socket.on("announcement-status-changed", (announcement) => {
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === announcement._id ? announcement : a))
      );
    });

    socket.on("new-message", (message) => {
      if (selectedEmergencyChatRoom && message.chatRoom === selectedEmergencyChatRoom._id) {
        setEmergencyChatMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off("new-announcement");
      socket.off("announcement-status-changed");
      socket.off("new-message");
    };
  }, [socket, selectedEmergencyChatRoom]);
```

#### 8. Update Header Title (Around line 978-986)

```jsx
<h1 className="text-lg lg:text-xl font-bold text-gray-800">
  {activeTab === "submit" && "Submit Symptoms"}
  {activeTab === "queue" && "Book Appointment"}
  {activeTab === "announcements" && "Announcements"}
  {activeTab === "emergency-chat" && "Emergency Chat"}
  {activeTab === "records" && "My Medical Records"}
  {activeTab === "leaves" && "Medical Leaves"}
  {activeTab === "diet" && "Diet Recommendations"}
  {activeTab === "documents" && "Medical Documents"}
  {activeTab === "qrcode" && "My QR Code"}
  {activeTab === "profile" && "My Profile"}
</h1>
```

#### 9. Add Announcements UI Section (After documents tab, before profile tab, around line 2800)

```jsx
{/* Announcements Tab */}
{activeTab === "announcements" && (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold text-gray-800 mb-4">
      Emergency Announcements
    </h2>

    {announcementsLoading ? (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500 mx-auto" />
      </div>
    ) : announcements.length === 0 ? (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No active announcements</p>
      </div>
    ) : (
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement._id}
            className={`border-2 rounded-lg p-4 ${
              announcement.priority === "urgent"
                ? "bg-red-50 border-red-200"
                : announcement.priority === "high"
                ? "bg-orange-50 border-orange-200"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-bold text-lg">{announcement.title}</h3>
                  <span className="px-2 py-0.5 bg-white bg-opacity-50 rounded text-xs font-medium uppercase">
                    {announcement.priority}
                  </span>
                  {announcement.status === "active" && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <span>Dr. {announcement.doctor?.name}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(announcement.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <p className="text-sm mb-4 whitespace-pre-wrap">
              {announcement.message}
            </p>

            {announcement.status === "active" && (
              <button
                onClick={() => handleReactToAnnouncement(announcement._id)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                React / Respond
              </button>
            )}

            {announcement.status === "responded" && (
              <div className="px-3 py-2 bg-gray-100 rounded text-sm text-gray-600">
                This announcement has been responded to and closed.
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}

{/* Emergency Chat Tab */}
{activeTab === "emergency-chat" && (
  <div className="h-full flex flex-col">
    <h2 className="text-xl font-semibold text-gray-800 mb-4">
      Emergency Chat Rooms
    </h2>

    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chat Rooms List */}
      <div className="lg:col-span-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Chat Rooms</h3>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
          {emergencyChatRoomsLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500 mx-auto" />
            </div>
          ) : emergencyChatRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No chat rooms yet
            </div>
          ) : (
            emergencyChatRooms.map((room) => (
              <button
                key={room._id}
                onClick={() => {
                  setSelectedEmergencyChatRoom(room);
                  fetchEmergencyChatMessages(room._id);
                  if (socket) {
                    socket.emit("join-room", room._id);
                  }
                }}
                className={`w-full p-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedEmergencyChatRoom?._id === room._id
                    ? "bg-sky-50 border-l-4 border-l-sky-500"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">
                    {room.announcement?.title || "Chat Room"}
                  </span>
                  {room.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span
                    className={`px-2 py-0.5 rounded ${
                      room.status === "active"
                        ? "bg-green-100 text-green-700"
                        : room.status === "waiting"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {room.status}
                  </span>
                </div>
                {room.lastMessage && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {room.lastMessage.message}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="lg:col-span-2 flex flex-col border border-gray-200 rounded-lg bg-white">
        {selectedEmergencyChatRoom ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-800">
                {selectedEmergencyChatRoom.announcement?.title}
              </h3>
              <p className="text-sm text-gray-500">
                Status: {selectedEmergencyChatRoom.status}
              </p>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ maxHeight: "calc(100vh - 400px)" }}
            >
              {emergencyChatMessages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${
                    msg.sender._id === user?._id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.sender._id === user?._id
                        ? "bg-sky-500 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {msg.sender.name}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {selectedEmergencyChatRoom.status !== "closed" && (
              <form
                onSubmit={handleSendEmergencyMessage}
                className="p-4 border-t border-gray-200 flex gap-2"
              >
                <input
                  type="text"
                  value={emergencyNewMessage}
                  onChange={(e) => setEmergencyNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat room to start messaging
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

### For Doctor Dashboard

Similar process but with:
- Create announcement form
- Queue management view
- Medical access request button
- MediAnalyzer query input

The full implementation would be very long. Should I create separate component files for these features to keep the code organized?
