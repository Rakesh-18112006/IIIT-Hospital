# Doctor–Student Emergency Communication System

## Implementation Status

### ✅ Completed Backend Components

1. **Database Models**
   - `Announcement.js` - Stores doctor announcements
   - `ChatRoom.js` - Manages chat rooms between doctors and students
   - `ChatMessage.js` - Stores individual chat messages
   - `MedicalAccessRequest.js` - Tracks medical data access requests and consent

2. **Backend API Endpoints**
   - `/api/announcements` - Create, get, and manage announcements
   - `/api/announcements/:id/react` - Student reacts to announcement
   - `/api/announcements/:id/close` - Doctor closes announcement
   - `/api/chat/rooms` - Get chat rooms for user
   - `/api/chat/rooms/:roomId/messages` - Get and send messages
   - `/api/chat/rooms/:roomId/request-medical-access` - Request medical access
   - `/api/chat/rooms/:roomId/respond-medical-access` - Grant/deny access
   - `/api/chat/rooms/:roomId/query-medical-bot` - Query MediAnalyzer bot
   - `/api/chat/announcements/:announcementId/queue` - Get waiting queue

3. **WebSocket Server**
   - Real-time message delivery
   - Room management
   - Announcement updates
   - Typing indicators

4. **Features Implemented**
   - Waiting room logic (only one active student at a time)
   - Medical access request/consent flow
   - MediAnalyzer bot integration in chat
   - Announcement closure and room cleanup
   - Real-time updates via Socket.IO

### 🚧 Frontend Components (Partially Complete)

1. **Created**
   - `SocketContext.jsx` - Socket.IO connection management
   - `AnnouncementCard.jsx` - Display announcement cards

2. **Remaining Frontend Work**
   - Integrate SocketProvider into App.jsx
   - Create Announcements section in Student Dashboard
   - Create Announcements section in Doctor Dashboard
   - Create Chat UI component (WhatsApp-style)
   - Add announcement creation UI for doctors
   - Add queue management UI for doctors
   - Integrate medical access request buttons
   - Add MediAnalyzer query UI in chat

## Quick Setup Instructions

### Backend Setup

1. Install socket.io (already added to package.json):
```bash
cd IIIT-Hospital/backend
npm install
```

2. The server.js has been updated to include:
   - HTTP server with Socket.IO
   - Announcement routes
   - Chat routes

### Frontend Setup

1. Install socket.io-client (already installed):
```bash
cd IIIT-Hospital/frontend
npm install  # socket.io-client already added
```

2. Update App.jsx to include SocketProvider:
```jsx
import { SocketProvider } from "./context/SocketContext";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          {/* routes */}
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
```

## Key Features

### 1. Doctor Announcements
- Doctors can create urgent announcements
- Real-time updates to all students
- Priority levels (low, medium, high, urgent)
- Status tracking (active, responded, closed)

### 2. Student Reactions
- Students click "React / Respond" button
- Creates private chat room automatically
- Real-time room creation on both dashboards

### 3. Waiting Room Logic
- Only one active student per announcement
- Other students placed in queue
- Queue position displayed
- Automatic activation when doctor engages

### 4. Medical Data Access
- Doctor requests access via button
- Student receives consent message
- Explicit approval required
- Temporary 24-hour access
- Audit log maintained

### 5. MediAnalyzer Bot
- Available once access granted
- Doctor can query student documents
- Includes source references
- View source links to documents

### 6. Announcement Closure
- Doctor selects confirmed student
- All rooms automatically closed
- Status updates globally
- System messages sent to all participants

## Database Schema

### Announcement
- doctor (ObjectId)
- title (String)
- message (String)
- priority (enum: low, medium, high, urgent)
- status (enum: active, responded, closed)
- selectedStudent (ObjectId)
- timestamps

### ChatRoom
- announcement (ObjectId)
- doctor (ObjectId)
- student (ObjectId)
- status (enum: waiting, active, closed)
- medicalAccessGranted (Boolean)
- timestamps

### ChatMessage
- chatRoom (ObjectId)
- sender (ObjectId)
- senderRole (enum: doctor, student)
- message (String)
- messageType (enum: text, system, medical_access_request, etc.)
- read (Boolean)
- timestamps

### MedicalAccessRequest
- chatRoom (ObjectId)
- doctor (ObjectId)
- student (ObjectId)
- status (enum: pending, approved, denied, expired)
- expiresAt (Date)
- auditLog (Array)

## API Usage Examples

### Create Announcement (Doctor)
```javascript
POST /api/announcements
{
  "title": "Emergency: O-negative blood required",
  "message": "Urgent need for O-negative blood...",
  "priority": "urgent"
}
```

### React to Announcement (Student)
```javascript
POST /api/announcements/:id/react
// Creates chat room and returns room details
```

### Send Message
```javascript
POST /api/chat/rooms/:roomId/messages
{
  "message": "Hello doctor, I can help"
}
```

### Request Medical Access (Doctor)
```javascript
POST /api/chat/rooms/:roomId/request-medical-access
```

### Query Medical Bot (Doctor)
```javascript
POST /api/chat/rooms/:roomId/query-medical-bot
{
  "question": "What is the student's blood group?"
}
```

### Close Announcement (Doctor)
```javascript
PUT /api/announcements/:id/close
{
  "selectedStudentId": "student_id"
}
```

## Socket.IO Events

### Client → Server
- `join-room` - Join a chat room
- `leave-room` - Leave a chat room
- `send-message` - Send a message
- `typing` - User is typing
- `stop-typing` - User stopped typing

### Server → Client
- `new-announcement` - New announcement created
- `announcement-status-changed` - Announcement status updated
- `new-message` - New message in room
- `message-received` - Notification of new message
- `user-typing` - Other user is typing
- `medical-access-requested` - Medical access requested
- `medical-access-response` - Access granted/denied
- `announcement-closed` - Announcement closed

## Next Steps for Frontend Implementation

1. **Integrate SocketProvider** in App.jsx
2. **Create Announcements Tab** in Student Dashboard
3. **Create Announcements Tab** in Doctor Dashboard
4. **Build Chat UI Component** with WhatsApp-style design
5. **Add Announcement Creation Form** for doctors
6. **Add Queue Management View** for doctors
7. **Integrate Medical Access Buttons** in chat
8. **Add MediAnalyzer Query Input** in chat UI

## Testing Checklist

- [ ] Doctor can create announcements
- [ ] Students see announcements in real-time
- [ ] Student can react to announcement
- [ ] Chat room created on both dashboards
- [ ] Messages deliver in real-time
- [ ] Queue management works correctly
- [ ] Medical access request/response flow
- [ ] MediAnalyzer bot queries work
- [ ] Announcement closure closes all rooms
- [ ] Real-time status updates work
- [ ] Socket reconnection handles gracefully

## Notes

- All chat rooms are private (one-to-one)
- Medical access expires after 24 hours
- Only one active chat room per announcement at a time
- All messages are persisted in database
- Socket authentication uses JWT token
- Real-time updates work across all connected clients
