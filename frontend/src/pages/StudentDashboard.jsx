import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
import {
  FileText,
  Calendar,
  Utensils,
  Phone,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  X,
  Plus,
  User,
  Edit3,
  Trash2,
  Save,
  Hash,
  BookOpen,
  Building,
  MapPin,
  Menu,
  ChevronLeft,
  Activity,
  LogOut,
  Upload,
  FileImage,
  MessageCircle,
  Bot,
  Loader2,
  Eye,
  FolderOpen,
  Stethoscope,
  Users,
  CalendarClock,
  RefreshCw,
  Bell,
  Info,
  Download,
} from "lucide-react";

const HOSTEL_BLOCKS = ["I1", "I2", "I3", "K1", "K2", "K3"];
const BRANCHES = [
  "Computer Science",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Information Technology",
  "Chemical Engineering",
  "Biotechnology",
];
const YEARS = [1, 2, 3, 4, 5];

const SYMPTOMS_LIST = [
  "fever",
  "cold",
  "cough",
  "headache",
  "body aches",
  "weakness",
  "fatigue",
  "nausea",
  "vomiting",
  "diarrhea",
  "stomach ache",
  "chest pain",
  "difficulty breathing",
  "dizziness",
  "sore throat",
  "runny nose",
  "loss of appetite",
  "skin irritation",
  "allergies",
];

const StudentDashboard = () => {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("submit");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [diets, setDiets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    studentId: "",
    branch: "",
    year: "",
    hostelBlock: "",
    address: "",
    phone: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Symptom form state
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [description, setDescription] = useState("");
  const [customSymptom, setCustomSymptom] = useState("");
  const [vitals, setVitals] = useState({
    temperature: "",
    bloodPressure: "",
    heartRate: "",
    oxygenLevel: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Symptom Analysis state
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [symptomAnalysis, setSymptomAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Medical Documents state
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [medicalSummary, setMedicalSummary] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const fileInputRef = useRef(null);

  // Medical Analyzer Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        'Hello! I\'m your Medical Records Assistant. Ask me anything about your uploaded medical documents. For example: "What is my blood group?" or "Do I have any allergies?"',
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Appointment Booking state
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [appointmentForm, setAppointmentForm] = useState({
    healthProblem: "",
    symptoms: [],
  });
  const [myAppointments, setMyAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState("");

  // QR Code state
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [showDeleteQRConfirm, setShowDeleteQRConfirm] = useState(false);
  const [qrDeleteLoading, setQrDeleteLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchProfile();
    fetchNotifications();
    fetchQRCode();

    // Poll for notifications every 15 seconds
    const notificationInterval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(notificationInterval);
  }, []);

  useEffect(() => {
    if (activeTab === "documents") {
      fetchDocuments();
      fetchMedicalSummary();
    }
    if (activeTab === "queue") {
      fetchDoctors();
      fetchMyAppointments();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedDoctor && appointmentDate) {
      fetchAvailableSlots(selectedDoctor._id, appointmentDate);
    }
  }, [selectedDoctor, appointmentDate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const response = await api.get("/documents");
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const fetchMedicalSummary = async () => {
    try {
      const response = await api.get("/documents/summary");
      setMedicalSummary(response.data);
    } catch (error) {
      console.error("Error fetching medical summary:", error);
    }
  };

  // Notification Functions
  const fetchNotifications = async () => {
    try {
      const response = await api.get("/patient/notifications");
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/patient/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await api.delete("/patient/notifications/clear");
      fetchNotifications();
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // Appointment Functions
  const fetchDoctors = async () => {
    try {
      const response = await api.get("/appointments/doctors");
      setDoctors(response.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    setSlotsLoading(true);
    try {
      const response = await api.get(`/appointments/slots/${doctorId}`, {
        params: { date },
      });
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const fetchMyAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const response = await api.get("/appointments/my-appointments");
      setMyAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // QR Code Functions
  const fetchQRCode = async () => {
    try {
      const response = await api.get("/patient/my-qr");
      setQrCode(response.data);
      setQrGenerated(true);
    } catch (error) {
      console.error("Error fetching QR code:", error);
      setQrGenerated(false);
    }
  };

  const handleGenerateQRCode = async () => {
    setQrLoading(true);
    try {
      const response = await api.post("/patient/generate-qr");
      setQrCode(response.data);
      setQrGenerated(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
      alert("Failed to generate QR code: " + (error.response?.data?.message || error.message));
    } finally {
      setQrLoading(false);
    }
  };

  const handleDownloadQRCode = () => {
    if (qrCode?.qrCodeImage) {
      const link = document.createElement("a");
      link.href = qrCode.qrCodeImage;
      link.download = `qr-code-${user?.studentId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteQRCode = async () => {
    setQrDeleteLoading(true);
    try {
      await api.delete("/patient/delete-qr");
      setQrCode(null);
      setQrGenerated(false);
      setShowDeleteQRConfirm(false);
      alert("QR code deleted successfully. You can generate a new one anytime.");
    } catch (error) {
      console.error("Error deleting QR code:", error);
      alert("Failed to delete QR code: " + (error.response?.data?.message || error.message));
    } finally {
      setQrDeleteLoading(false);
    }
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
    setAppointmentForm({ healthProblem: "", symptoms: [] });
    setBookingError("");
    setBookingSuccess(null);
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedSlot || !appointmentForm.healthProblem) {
      setBookingError("Please fill in all required fields");
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      const response = await api.post("/appointments/book", {
        doctorId: selectedDoctor._id,
        slotDate: appointmentDate,
        slotTime: selectedSlot.slotTime,
        healthProblem: appointmentForm.healthProblem,
        symptoms: appointmentForm.symptoms,
      });

      setBookingSuccess(response.data);
      setShowBookingModal(false);
      setSelectedSlot(null);
      setAppointmentForm({ healthProblem: "", symptoms: [] });
      fetchMyAppointments();
      fetchAvailableSlots(selectedDoctor._id, appointmentDate);
    } catch (error) {
      setBookingError(
        error.response?.data?.message || "Failed to book appointment"
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      await api.put(`/appointments/${appointmentId}/cancel`);
      fetchMyAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert(error.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const getSeverityBadge = (severity) => {
    const styles = {
      critical: "bg-red-100 text-red-700 border-red-200",
      high: "bg-orange-100 text-orange-700 border-orange-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      low: "bg-green-100 text-green-700 border-green-200",
    };
    const labels = {
      critical: "Critical",
      high: "High",
      medium: "Medium",
      low: "Low",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          styles[severity] || styles.low
        }`}
      >
        {labels[severity] || severity}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      confirmed: "bg-blue-100 text-blue-700",
      "in-progress": "bg-purple-100 text-purple-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-gray-100 text-gray-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status] || styles.pending
        }`}
      >
        {status?.replace("-", " ").charAt(0).toUpperCase() +
          status?.slice(1).replace("-", " ")}
      </span>
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("document", file);

    setUploadLoading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadSuccess("Document uploaded successfully! Processing...");
      fetchDocuments();
      setTimeout(() => {
        setUploadSuccess("");
        fetchDocuments();
        fetchMedicalSummary();
      }, 5000);
    } catch (error) {
      setUploadError(
        error.response?.data?.message || "Failed to upload document"
      );
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await api.delete(`/documents/${docId}`);
      fetchDocuments();
      fetchMedicalSummary();
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleViewDocument = async (docId) => {
    try {
      const response = await api.get(`/documents/${docId}`);
      setViewingDocument(response.data);
    } catch (error) {
      console.error("Error fetching document:", error);
    }
  };

  const findDocumentByName = (name) => {
    return documents.find(
      (doc) =>
        doc.originalName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(doc.originalName.toLowerCase())
    );
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setChatLoading(true);

    try {
      const response = await api.post("/documents/analyze", {
        question: userMessage,
      });
      const assistantMessage = response.data.answer;
      const sourceName =
        response.data.source &&
        response.data.source !== "Not found in documents"
          ? response.data.source
          : null;

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantMessage,
          source: sourceName,
        },
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your question. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get("/auth/profile");
      setProfileData(response.data);
      setProfileForm({
        studentId: response.data.studentId || "",
        branch: response.data.branch || "",
        year: response.data.year || "",
        hostelBlock: response.data.hostelBlock || "",
        address: response.data.address || "",
        phone: response.data.phone || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleProfileFormChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      await updateProfile(profileForm);
      await fetchProfile();
      setEditingProfile(false);
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (error) {
      setProfileError(
        error.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setProfileLoading(true);
    try {
      await deleteAccount();
      logout();
      navigate("/login");
    } catch (error) {
      setProfileError(
        error.response?.data?.message || "Failed to delete account"
      );
      setShowDeleteConfirm(false);
      setProfileLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsRes, leavesRes, dietsRes] = await Promise.all([
        api.get("/patient/my-records"),
        api.get("/patient/my-leaves"),
        api.get("/patient/my-diet"),
      ]);
      setRecords(recordsRes.data);
      setLeaves(leavesRes.data);
      setDiets(dietsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAddCustomSymptom = () => {
    if (
      customSymptom.trim() &&
      !selectedSymptoms.includes(customSymptom.trim())
    ) {
      setSelectedSymptoms((prev) => [...prev, customSymptom.trim()]);
      setCustomSymptom("");
    }
  };

  const handleAnalyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      alert("Please select at least one symptom to analyze");
      return;
    }

    setAnalysisLoading(true);
    try {
      const vitalsData = {};
      if (vitals.temperature)
        vitalsData.temperature = parseFloat(vitals.temperature);
      if (vitals.bloodPressure) vitalsData.bloodPressure = vitals.bloodPressure;
      if (vitals.heartRate) vitalsData.heartRate = parseInt(vitals.heartRate);
      if (vitals.oxygenLevel)
        vitalsData.oxygenLevel = parseInt(vitals.oxygenLevel);

      const response = await api.post("/patient/analyze-symptoms", {
        symptoms: selectedSymptoms,
        symptomDescription: description,
        vitals: Object.keys(vitalsData).length > 0 ? vitalsData : undefined,
      });

      setSymptomAnalysis(response.data.analysis);
      setShowAnalysis(true);
    } catch (error) {
      console.error("Error analyzing symptoms:", error);
      alert(error.response?.data?.message || "Failed to analyze symptoms");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSubmitSymptoms = async (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) return;

    setSubmitLoading(true);
    try {
      const vitalsData = {};
      if (vitals.temperature)
        vitalsData.temperature = parseFloat(vitals.temperature);
      if (vitals.bloodPressure) vitalsData.bloodPressure = vitals.bloodPressure;
      if (vitals.heartRate) vitalsData.heartRate = parseInt(vitals.heartRate);
      if (vitals.oxygenLevel)
        vitalsData.oxygenLevel = parseInt(vitals.oxygenLevel);

      await api.post("/patient/symptoms", {
        symptoms: selectedSymptoms,
        symptomDescription: description,
        vitals: Object.keys(vitalsData).length > 0 ? vitalsData : undefined,
      });

      setSubmitSuccess(true);
      setSelectedSymptoms([]);
      setDescription("");
      setVitals({
        temperature: "",
        bloodPressure: "",
        heartRate: "",
        oxygenLevel: "",
      });
      setSymptomAnalysis(null);
      setShowAnalysis(false);
      fetchData();

      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error("Error submitting symptoms:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const getRecordSeverityBadge = (severity) => {
    const styles = {
      red: "bg-red-100 text-red-700 border-red-200",
      orange: "bg-orange-100 text-orange-700 border-orange-200",
      green: "bg-green-100 text-green-700 border-green-200",
    };
    const labels = { red: "Critical", orange: "Moderate", green: "Normal" };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[severity]}`}
      >
        {labels[severity]}
      </span>
    );
  };

  const getRecordStatusBadge = (status) => {
    const styles = {
      waiting: "bg-yellow-100 text-yellow-700",
      in_consultation: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      referred: "bg-purple-100 text-purple-700",
    };
    const labels = {
      waiting: "Waiting",
      in_consultation: "In Consultation",
      completed: "Completed",
      referred: "Referred",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-sky-50 flex">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${sidebarCollapsed ? "w-20" : "w-64"}
        ${
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
        bg-white border-r border-sky-100 shadow-lg lg:shadow-none
        transition-all duration-300 ease-in-out flex flex-col
      `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sky-100">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-sky-600">IIIT Health</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center mx-auto">
              <Activity className="h-5 w-5 text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-sky-50 text-gray-500"
          >
            <ChevronLeft
              className={`h-5 w-5 transition-transform ${
                sidebarCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-sky-50 text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info */}
        {!sidebarCollapsed && (
          <div className="px-4 py-4 border-b border-sky-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {[
            { id: "submit", label: "Submit Symptoms", icon: Send },
            {
              id: "queue",
              label: "Book Appointment",
              icon: CalendarClock,
              hasNotification: notifications.length > 0,
            },
            { id: "records", label: "My Records", icon: FileText },
            { id: "leaves", label: "Medical Leaves", icon: Calendar },
            { id: "diet", label: "Diet Plan", icon: Utensils },
            { id: "documents", label: "Medical Documents", icon: FolderOpen },
            { id: "qrcode", label: "My QR Code", icon: Hash },
            { id: "profile", label: "My Profile", icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative
                ${
                  activeTab === tab.id
                    ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                    : "text-gray-600 hover:bg-sky-50 hover:text-sky-600"
                }
                ${sidebarCollapsed ? "justify-center" : ""}
              `}
              title={sidebarCollapsed ? tab.label : ""}
            >
              <tab.icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-medium">{tab.label}</span>
              )}
              {/* Notification Badge */}
              {tab.hasNotification && (
                <span
                  className={`absolute ${
                    sidebarCollapsed ? "top-0 right-0" : "right-2"
                  } flex h-3 w-3`}
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Emergency & Logout */}
        <div className="p-3 border-t border-sky-100 space-y-2">
          <a
            href="tel:108"
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg
              bg-red-500 text-white hover:bg-red-600 transition-colors
              ${sidebarCollapsed ? "justify-center" : ""}
            `}
            title={sidebarCollapsed ? "Emergency: 108" : ""}
          >
            <Phone className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="font-medium">Emergency: 108</span>
            )}
          </a>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-gray-600 hover:bg-gray-100 transition-colors
              ${sidebarCollapsed ? "justify-center" : ""}
            `}
            title={sidebarCollapsed ? "Logout" : ""}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-sky-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-sky-50 text-gray-600"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-gray-800">
                {activeTab === "submit" && "Submit Symptoms"}
                {activeTab === "queue" && "Book Appointment"}
                {activeTab === "records" && "My Medical Records"}
                {activeTab === "leaves" && "Medical Leaves"}
                {activeTab === "diet" && "Diet Recommendations"}
                {activeTab === "documents" && "Medical Documents"}
                {activeTab === "qrcode" && "My QR Code"}
                {activeTab === "profile" && "My Profile"}
              </h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                {activeTab === "submit" &&
                  "Report your symptoms for quick medical assistance"}
                {activeTab === "queue" &&
                  "Book appointments with available doctors"}
                {activeTab === "records" && "View your consultation history"}
                {activeTab === "leaves" &&
                  "Track your medical leave applications"}
                {activeTab === "diet" &&
                  "Your personalized diet recommendations"}
                {activeTab === "documents" &&
                  "Upload and analyze your medical records"}
                {activeTab === "qrcode" && "Share your medical QR code with doctors"}
                {activeTab === "profile" && "Manage your account details"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-sky-50 rounded-lg text-gray-600 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white rounded-xl shadow-xl border border-sky-100 z-50 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-sky-100 bg-sky-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="overflow-y-auto flex-1">
                      {notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-4 border-b border-sky-50 cursor-pointer transition-colors ${
                            !notif.read ? "bg-sky-50 hover:bg-sky-100" : "hover:bg-gray-50"
                          }`}
                          onClick={() => handleMarkNotificationAsRead(notif._id)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-800 text-sm">
                                  {notif.title}
                                </h4>
                                {!notif.read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notif.createdAt && !isNaN(new Date(notif.createdAt).getTime()) 
                                  ? new Date(notif.createdAt).toLocaleDateString()
                                  : new Date().toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-sky-50 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-sky-700">Online</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {/* Content Cards */}
            <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-6">
              {/* Submit Symptoms Tab */}
              {activeTab === "submit" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Submit Your Symptoms
                  </h2>

                  {submitSuccess && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Symptoms submitted successfully! You've been added to the
                      queue.
                    </div>
                  )}

                  <form onSubmit={handleSubmitSymptoms} className="space-y-6">
                    {/* Symptoms Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select your symptoms *
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SYMPTOMS_LIST.map((symptom) => (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() => handleSymptomToggle(symptom)}
                            className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                              selectedSymptoms.includes(symptom)
                                ? "bg-sky-500 text-white"
                                : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                            }`}
                          >
                            {symptom}
                          </button>
                        ))}
                      </div>

                      {/* Custom Symptom */}
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={customSymptom}
                          onChange={(e) => setCustomSymptom(e.target.value)}
                          placeholder="Add other symptom..."
                          className="flex-1 px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSymptom}
                          className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Selected Symptoms */}
                      {selectedSymptoms.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedSymptoms.map((symptom) => (
                            <span
                              key={symptom}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm"
                            >
                              {symptom}
                              <button
                                type="button"
                                onClick={() => handleSymptomToggle(symptom)}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Describe your condition
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                        placeholder="Provide more details about your symptoms..."
                      />
                    </div>

                    {/* Vitals (Optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vitals (Optional)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input
                          type="number"
                          step="0.1"
                          value={vitals.temperature}
                          onChange={(e) =>
                            setVitals({
                              ...vitals,
                              temperature: e.target.value,
                            })
                          }
                          placeholder="Temp (°F)"
                          className="px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                        />
                        <input
                          type="text"
                          value={vitals.bloodPressure}
                          onChange={(e) =>
                            setVitals({
                              ...vitals,
                              bloodPressure: e.target.value,
                            })
                          }
                          placeholder="BP (120/80)"
                          className="px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                        />
                        <input
                          type="number"
                          value={vitals.heartRate}
                          onChange={(e) =>
                            setVitals({ ...vitals, heartRate: e.target.value })
                          }
                          placeholder="Heart Rate"
                          className="px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                        />
                        <input
                          type="number"
                          value={vitals.oxygenLevel}
                          onChange={(e) =>
                            setVitals({
                              ...vitals,
                              oxygenLevel: e.target.value,
                            })
                          }
                          placeholder="SpO2 (%)"
                          className="px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={handleAnalyzeSymptoms}
                        disabled={selectedSymptoms.length === 0 || analysisLoading}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 font-medium shadow-md"
                      >
                        {analysisLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Activity className="h-5 w-5" />
                            Analyze Symptoms (AI)
                          </>
                        )}
                      </button>
                      <button
                        type="submit"
                        disabled={selectedSymptoms.length === 0 || submitLoading}
                        className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 font-medium"
                      >
                        <Send className="h-5 w-5" />
                        {submitLoading ? "Submitting..." : "Submit Symptoms"}
                      </button>
                    </div>
                  </form>

                  {/* Symptom Analysis Results */}
                  {showAnalysis && symptomAnalysis && !symptomAnalysis.error && (
                    <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <Activity className="h-6 w-6 text-blue-600" />
                          AI Symptom Analysis & Triage
                        </h3>
                        <button
                          onClick={() => setShowAnalysis(false)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <X className="h-5 w-5 text-gray-600" />
                        </button>
                      </div>

                      {/* Severity Assessment */}
                      {symptomAnalysis.severityAssessment && (
                        <div className="mb-6 p-4 bg-white rounded-lg border-2 border-blue-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                              symptomAnalysis.severityAssessment.level === 'critical' ? 'bg-red-500' :
                              symptomAnalysis.severityAssessment.level === 'high' ? 'bg-orange-500' :
                              symptomAnalysis.severityAssessment.level === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}>
                              {symptomAnalysis.severityAssessment.score || 0}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                Severity: {symptomAnalysis.severityAssessment.level?.toUpperCase() || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {symptomAnalysis.severityAssessment.reason || ''}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm font-semibold text-gray-700">Urgency: {symptomAnalysis.urgency?.toUpperCase() || 'N/A'}</p>
                          </div>
                        </div>
                      )}

                      {/* Possible Outbreaks/Diseases */}
                      {symptomAnalysis.symptomAnalysis?.possibleOutbreaks && symptomAnalysis.symptomAnalysis.possibleOutbreaks.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                            Possible Outbreaks & Diseases
                          </h4>
                          <div className="space-y-4">
                            {symptomAnalysis.symptomAnalysis.possibleOutbreaks.map((outbreak, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-4 border-2 border-orange-200 shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-bold text-lg text-gray-800">{outbreak.outbreak}</h5>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    outbreak.likelihood === 'high' ? 'bg-red-100 text-red-700' :
                                    outbreak.likelihood === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {outbreak.likelihood?.toUpperCase()} Likelihood
                                  </span>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3 mt-3 border-l-4 border-blue-400">
                                  <p className="text-sm font-semibold text-blue-900 mb-1">Why this outbreak could cause these symptoms:</p>
                                  <p className="text-sm text-blue-800">{outbreak.explanation || 'No explanation provided'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Possible Conditions */}
                      {symptomAnalysis.possibleConditions && symptomAnalysis.possibleConditions.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-blue-600" />
                            Possible Medical Conditions
                          </h4>
                          <div className="space-y-3">
                            {symptomAnalysis.possibleConditions.map((condition, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-gray-800">{condition.condition}</h5>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    condition.probability === 'high' ? 'bg-red-100 text-red-700' :
                                    condition.probability === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {condition.probability?.toUpperCase()} Probability
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{condition.explanation || ''}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {symptomAnalysis.recommendations && symptomAnalysis.recommendations.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Recommendations
                          </h4>
                          <ul className="space-y-2">
                            {symptomAnalysis.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2 bg-white rounded-lg p-3 border border-green-200">
                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Next Steps */}
                      {symptomAnalysis.nextSteps && (
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg p-4">
                          <h4 className="font-bold mb-2 flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Next Steps
                          </h4>
                          <p className="text-sm">{symptomAnalysis.nextSteps}</p>
                        </div>
                      )}

                      {/* Symptom Pattern */}
                      {symptomAnalysis.symptomAnalysis?.symptomPattern && (
                        <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-2">Symptom Pattern Analysis</h4>
                          <p className="text-sm text-gray-600">{symptomAnalysis.symptomAnalysis.symptomPattern}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Analysis Error */}
                  {showAnalysis && symptomAnalysis && symptomAnalysis.error && (
                    <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <p className="text-red-700">Error: {symptomAnalysis.error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Queue/Appointment Tab */}
              {activeTab === "queue" && (
                <div className="space-y-6">
                  {/* Flash Notifications Banner */}
                  {notifications.length > 0 && (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-4 rounded-lg border animate-pulse ${
                            notification.notification?.type === "reschedule"
                              ? "bg-orange-50 border-orange-300"
                              : notification.notification?.type === "cancelled"
                              ? "bg-red-50 border-red-300"
                              : "bg-blue-50 border-blue-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                notification.notification?.type === "reschedule"
                                  ? "bg-orange-100"
                                  : notification.notification?.type ===
                                    "cancelled"
                                  ? "bg-red-100"
                                  : "bg-blue-100"
                              }`}
                            >
                              <Bell
                                className={`h-5 w-5 ${
                                  notification.notification?.type ===
                                  "reschedule"
                                    ? "text-orange-600"
                                    : notification.notification?.type ===
                                      "cancelled"
                                    ? "text-red-600"
                                    : "text-blue-600"
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`font-semibold ${
                                    notification.notification?.type ===
                                    "reschedule"
                                      ? "text-orange-800"
                                      : notification.notification?.type ===
                                        "cancelled"
                                      ? "text-red-800"
                                      : "text-blue-800"
                                  }`}
                                >
                                  {notification.notification?.type ===
                                  "reschedule"
                                    ? "🔄 Appointment Rescheduled"
                                    : notification.notification?.type ===
                                      "cancelled"
                                    ? "❌ Appointment Cancelled"
                                    : "ℹ️ Appointment Update"}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {notification.notification?.createdAt && !isNaN(new Date(notification.notification.createdAt).getTime())
                                    ? new Date(notification.notification.createdAt).toLocaleTimeString()
                                    : new Date().toLocaleTimeString()}
                                </span>
                              </div>
                              <p
                                className={`text-sm mt-1 ${
                                  notification.notification?.type ===
                                  "reschedule"
                                    ? "text-orange-700"
                                    : notification.notification?.type ===
                                      "cancelled"
                                    ? "text-red-700"
                                    : "text-blue-700"
                                }`}
                              >
                                {notification.notification?.message}
                              </p>
                              {notification.rescheduledFrom && (
                                <div className="mt-2 text-xs text-gray-600 bg-white/50 rounded p-2">
                                  <p>
                                    <strong>Previous Time:</strong>{" "}
                                    {notification.rescheduledFrom.slotTime}
                                  </p>
                                  <p>
                                    <strong>New Time:</strong>{" "}
                                    {notification.slotTime}
                                  </p>
                                  <p>
                                    <strong>Doctor:</strong> Dr.{" "}
                                    {notification.doctor?.name?.replace(
                                      "Dr. ",
                                      ""
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                handleDismissNotification(notification._id)
                              }
                              className={`p-1 rounded hover:bg-white/50 ${
                                notification.notification?.type === "reschedule"
                                  ? "text-orange-600"
                                  : notification.notification?.type ===
                                    "cancelled"
                                  ? "text-red-600"
                                  : "text-blue-600"
                              }`}
                              title="Dismiss"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Success Message */}
                  {bookingSuccess && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-800">
                            Appointment Booked Successfully!
                          </h4>
                          <p className="text-sm text-green-700 mt-1">
                            Your appointment is confirmed for{" "}
                            {bookingSuccess.appointment?.slotTime} on{" "}
                            {new Date(
                              bookingSuccess.appointment?.slotDate
                            ).toLocaleDateString()}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Priority:</span>
                              {getSeverityBadge(
                                bookingSuccess.priorityInfo?.severity
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Risk Score:</span>
                              <span className="text-green-700">
                                {bookingSuccess.priorityInfo?.riskScore}/100
                              </span>
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setBookingSuccess(null)}
                          className="ml-auto text-green-600 hover:text-green-800"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Available Doctors */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-sky-500" />
                        Available Doctors
                      </h3>

                      {doctors.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No doctors available at the moment</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {doctors.map((doctor) => (
                            <div
                              key={doctor._id}
                              onClick={() => setSelectedDoctor(doctor)}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedDoctor?._id === doctor._id
                                  ? "border-sky-500 bg-sky-50"
                                  : "border-gray-200 hover:border-sky-300 hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                                    <Stethoscope className="h-5 w-5 text-sky-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-800">
                                      Dr. {doctor.name?.replace("Dr. ", "")}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      {doctor.department || "General"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {doctor.hasQueue ? (
                                    <span className="text-sm text-orange-600 font-medium">
                                      {doctor.queueLength} in queue
                                    </span>
                                  ) : (
                                    <span className="text-sm text-green-600 font-medium">
                                      Available Now
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Available Slots */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-sky-500" />
                          Available Slots
                        </h3>
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={appointmentDate}
                            onChange={(e) => setAppointmentDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          />
                          <button
                            onClick={() =>
                              selectedDoctor &&
                              fetchAvailableSlots(
                                selectedDoctor._id,
                                appointmentDate
                              )
                            }
                            className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg"
                            title="Refresh slots"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {!selectedDoctor ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          <CalendarClock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Select a doctor to view available slots</p>
                        </div>
                      ) : slotsLoading ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-sky-500 mx-auto" />
                          <p className="text-sm text-gray-500 mt-2">
                            Loading slots...
                          </p>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No slots available for this date</p>
                          <p className="text-sm">Try selecting another date</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto p-1">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.slotTime}
                              onClick={() => handleSelectSlot(slot)}
                              className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:border-sky-500 hover:bg-sky-50 transition-all text-center"
                            >
                              {slot.slotTime}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* My Appointments */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-sky-500" />
                      My Appointments
                    </h3>

                    {appointmentsLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-sky-500 mx-auto" />
                      </div>
                    ) : myAppointments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No appointments yet</p>
                        <p className="text-sm">
                          Book your first appointment above
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myAppointments.map((appointment) => (
                          <div
                            key={appointment._id}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-gray-800">
                                    Dr.{" "}
                                    {appointment.doctor?.name?.replace(
                                      "Dr. ",
                                      ""
                                    )}
                                  </span>
                                  {getStatusBadge(appointment.status)}
                                  {getSeverityBadge(appointment.severity)}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                  <p className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(
                                      appointment.slotDate
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {appointment.slotTime} -{" "}
                                    {appointment.slotEndTime}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                  {appointment.healthProblem}
                                </p>
                                {appointment.aiAnalysis?.recommendedAction && (
                                  <p className="text-xs text-sky-600 mt-1">
                                    {appointment.aiAnalysis.recommendedAction}
                                  </p>
                                )}
                              </div>
                              {(appointment.status === "pending" ||
                                appointment.status === "confirmed") && (
                                <button
                                  onClick={() =>
                                    handleCancelAppointment(appointment._id)
                                  }
                                  className="ml-4 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Booking Modal */}
                  {showBookingModal && selectedSlot && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Book Appointment
                          </h3>
                          <button
                            onClick={() => {
                              setShowBookingModal(false);
                              setSelectedSlot(null);
                              setBookingError("");
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <form
                          onSubmit={handleBookAppointment}
                          className="p-4 space-y-4"
                        >
                          {/* Appointment Info */}
                          <div className="bg-sky-50 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Doctor</p>
                                <p className="font-medium text-gray-800">
                                  Dr.{" "}
                                  {selectedDoctor?.name?.replace("Dr. ", "")}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Department</p>
                                <p className="font-medium text-gray-800">
                                  {selectedDoctor?.department || "General"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Date</p>
                                <p className="font-medium text-gray-800">
                                  {new Date(
                                    appointmentDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Time Slot</p>
                                <p className="font-medium text-gray-800">
                                  {selectedSlot.slotTime} -{" "}
                                  {selectedSlot.slotEndTime}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Patient Info (Auto-filled) */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Patient Information
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <p>
                                <span className="text-gray-500">Name:</span>{" "}
                                {user?.name}
                              </p>
                              <p>
                                <span className="text-gray-500">ID:</span>{" "}
                                {profileData?.studentId || "N/A"}
                              </p>
                              <p>
                                <span className="text-gray-500">Branch:</span>{" "}
                                {profileData?.branch || "N/A"}
                              </p>
                              <p>
                                <span className="text-gray-500">Year:</span>{" "}
                                {profileData?.year || "N/A"}
                              </p>
                            </div>
                          </div>

                          {/* Health Problem */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Describe Your Health Problem{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={appointmentForm.healthProblem}
                              onChange={(e) =>
                                setAppointmentForm({
                                  ...appointmentForm,
                                  healthProblem: e.target.value,
                                })
                              }
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                              placeholder="Describe your symptoms and health concerns in detail. This helps us prioritize your appointment appropriately."
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Our AI will analyze your symptoms to prioritize
                              your appointment
                            </p>
                          </div>

                          {/* Symptoms Selection */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select Symptoms (Optional)
                            </label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                              {SYMPTOMS_LIST.map((symptom) => (
                                <button
                                  key={symptom}
                                  type="button"
                                  onClick={() => {
                                    const symptoms =
                                      appointmentForm.symptoms.includes(symptom)
                                        ? appointmentForm.symptoms.filter(
                                            (s) => s !== symptom
                                          )
                                        : [
                                            ...appointmentForm.symptoms,
                                            symptom,
                                          ];
                                    setAppointmentForm({
                                      ...appointmentForm,
                                      symptoms,
                                    });
                                  }}
                                  className={`px-3 py-1 text-sm rounded-full transition-all ${
                                    appointmentForm.symptoms.includes(symptom)
                                      ? "bg-sky-500 text-white"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }`}
                                >
                                  {symptom}
                                </button>
                              ))}
                            </div>
                          </div>

                          {bookingError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              {bookingError}
                            </div>
                          )}

                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowBookingModal(false);
                                setSelectedSlot(null);
                                setBookingError("");
                              }}
                              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={
                                bookingLoading || !appointmentForm.healthProblem
                              }
                              className="flex-1 px-4 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                              {bookingLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Booking...
                                </>
                              ) : (
                                <>
                                  <CalendarClock className="h-4 w-4" />
                                  Book Appointment
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Records Tab */}
              {activeTab === "records" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    My Medical Records
                  </h2>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                    </div>
                  ) : records.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No records found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {records.map((record) => (
                        <div
                          key={record._id}
                          className="border border-sky-100 rounded-lg p-4 hover:border-sky-300 transition-colors"
                        >
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                            <div className="flex gap-2">
                              {getRecordSeverityBadge(record.severity)}
                              {getRecordStatusBadge(record.status)}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(record.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-1">
                              Symptoms:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {record.symptoms.map((s, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-sm"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          {record.advice && (
                            <div className="mt-3 p-3 bg-sky-50 rounded-lg">
                              <p className="text-sm font-medium text-sky-700 mb-1">
                                Doctor's Advice:
                              </p>
                              <p className="text-sm text-gray-700">
                                {record.advice}
                              </p>
                            </div>
                          )}

                          {record.prescription && (
                            <div className="mt-2 p-3 bg-green-50 rounded-lg">
                              <p className="text-sm font-medium text-green-700 mb-1">
                                Prescription:
                              </p>
                              <p className="text-sm text-gray-700">
                                {record.prescription}
                              </p>
                            </div>
                          )}

                          {record.assignedDoctor && (
                            <p className="mt-2 text-sm text-gray-500">
                              Doctor: {record.assignedDoctor.name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Leaves Tab */}
              {activeTab === "leaves" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Medical Leaves
                  </h2>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                    </div>
                  ) : leaves.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No medical leaves</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leaves.map((leave) => (
                        <div
                          key={leave._id}
                          className="border border-sky-100 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                leave.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {leave.status === "active"
                                ? "Active"
                                : "Completed"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">
                                Start Date
                              </p>
                              <p className="font-medium">
                                {new Date(leave.startDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">End Date</p>
                              <p className="font-medium">
                                {new Date(leave.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="bg-sky-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-sky-700 mb-1">
                              Reason:
                            </p>
                            <p className="text-sm text-gray-700">
                              {leave.reason}
                            </p>
                          </div>

                          {leave.approvedBy && (
                            <p className="mt-2 text-sm text-gray-500">
                              Approved by: {leave.approvedBy.name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Diet Tab */}
              {activeTab === "diet" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Diet Recommendations
                  </h2>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                    </div>
                  ) : diets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No active diet recommendations</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {diets.map((diet) => (
                        <div
                          key={diet._id}
                          className="border border-sky-100 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                diet.dietType === "special"
                                  ? "bg-purple-100 text-purple-700"
                                  : diet.dietType === "light"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {diet.dietType.charAt(0).toUpperCase() +
                                diet.dietType.slice(1)}{" "}
                              Diet
                            </span>
                            <span className="text-sm text-gray-500">
                              Until{" "}
                              {new Date(diet.endDate).toLocaleDateString()}
                            </span>
                          </div>

                          {diet.specialInstructions && (
                            <div className="bg-sky-50 p-3 rounded-lg mb-3">
                              <p className="text-sm font-medium text-sky-700 mb-1">
                                Instructions:
                              </p>
                              <p className="text-sm text-gray-700">
                                {diet.specialInstructions}
                              </p>
                            </div>
                          )}

                          {diet.restrictions &&
                            diet.restrictions.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">
                                  Restrictions:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {diet.restrictions.map((r, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-sm"
                                    >
                                      ❌ {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Medical Documents Tab */}
              {activeTab === "documents" && (
                <div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Upload & Documents List */}
                    <div className="space-y-6">
                      {/* Upload Section */}
                      <div className="bg-sky-50 rounded-xl p-6 border-2 border-dashed border-sky-200">
                        <div className="text-center">
                          <Upload className="h-12 w-12 text-sky-400 mx-auto mb-3" />
                          <h3 className="font-medium text-gray-800 mb-1">
                            Upload Medical Document
                          </h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Upload prescriptions, lab reports, or any medical
                            records
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="document-upload"
                          />
                          <label
                            htmlFor="document-upload"
                            className={`inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors cursor-pointer ${
                              uploadLoading
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {uploadLoading ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <FileImage className="h-5 w-5" />
                                Select File
                              </>
                            )}
                          </label>
                          <p className="text-xs text-gray-400 mt-2">
                            Supports: JPEG, PNG, PDF (Max 10MB)
                          </p>
                        </div>

                        {uploadError && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                            {uploadError}
                          </div>
                        )}
                        {uploadSuccess && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            {uploadSuccess}
                          </div>
                        )}
                      </div>

                      {/* Medical Summary */}
                      {medicalSummary && medicalSummary.totalDocuments > 0 && (
                        <div className="bg-white rounded-xl border border-sky-100 p-4">
                          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-sky-500" />
                            Medical Summary
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {medicalSummary.bloodGroup && (
                              <div className="bg-red-50 p-3 rounded-lg">
                                <p className="text-xs text-red-600 font-medium">
                                  Blood Group
                                </p>
                                <p className="text-lg font-bold text-red-700">
                                  {medicalSummary.bloodGroup}
                                </p>
                              </div>
                            )}
                            <div className="bg-sky-50 p-3 rounded-lg">
                              <p className="text-xs text-sky-600 font-medium">
                                Documents
                              </p>
                              <p className="text-lg font-bold text-sky-700">
                                {medicalSummary.totalDocuments}
                              </p>
                            </div>
                          </div>

                          {medicalSummary.allergies?.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-1">
                                Allergies
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {medicalSummary.allergies.map((a, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs"
                                  >
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {medicalSummary.conditions?.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-1">
                                Conditions
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {medicalSummary.conditions.map((c, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Documents List */}
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3">
                          Uploaded Documents
                        </h3>
                        {documentsLoading ? (
                          <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-sky-500 mx-auto" />
                          </div>
                        ) : documents.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No documents uploaded yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {documents.map((doc) => (
                              <div
                                key={doc._id}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FileText className="h-5 w-5 text-sky-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-800 truncate text-sm">
                                    {doc.originalName}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>
                                      {new Date(
                                        doc.uploadDate
                                      ).toLocaleDateString()}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded ${
                                        doc.processingStatus === "completed"
                                          ? "bg-green-100 text-green-700"
                                          : doc.processingStatus ===
                                            "processing"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : doc.processingStatus === "failed"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {doc.processingStatus}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleViewDocument(doc._id)}
                                    className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
                                    title="View Document"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteDocument(doc._id)
                                    }
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Document"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Medical Analyzer Chat */}
                    <div className="bg-gray-50 rounded-xl border border-sky-100 flex flex-col h-[600px]">
                      {/* Chat Header */}
                      <div className="p-4 border-b border-sky-100 bg-white rounded-t-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              Medical Analyzer
                            </h3>
                            <p className="text-xs text-gray-500">
                              Ask questions about your medical records
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {chatMessages.map((msg, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              msg.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                                msg.role === "user"
                                  ? "bg-sky-500 text-white rounded-br-md"
                                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">
                                {msg.content}
                              </p>
                              {msg.source && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <FileText className="h-3 w-3" />
                                    <span>Source: {msg.source}</span>
                                    <button
                                      onClick={() => {
                                        const doc = findDocumentByName(
                                          msg.source
                                        );
                                        if (doc) handleViewDocument(doc._id);
                                      }}
                                      className="ml-1 px-2 py-0.5 bg-sky-100 text-sky-600 rounded hover:bg-sky-200 transition-colors flex items-center gap-1"
                                    >
                                      <Eye className="h-3 w-3" />
                                      View
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                                <span className="text-sm text-gray-500">
                                  Analyzing...
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Chat Input */}
                      <div className="p-4 border-t border-sky-100 bg-white rounded-b-xl">
                        <form
                          onSubmit={handleChatSubmit}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask about your medical records..."
                            className="flex-1 px-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none text-sm"
                            disabled={chatLoading}
                          />
                          <button
                            type="submit"
                            disabled={chatLoading || !chatInput.trim()}
                            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="h-5 w-5" />
                          </button>
                        </form>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {[
                            "What is my blood group?",
                            "Any allergies?",
                            "Recent test results?",
                          ].map((q) => (
                            <button
                              key={q}
                              onClick={() => setChatInput(q)}
                              className="text-xs px-3 py-1.5 bg-sky-50 text-sky-600 rounded-full hover:bg-sky-100 transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document View Modal */}
                  {viewingDocument && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-sky-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {viewingDocument.originalName}
                              </h3>
                              <p className="text-xs text-gray-500">
                                Uploaded:{" "}
                                {new Date(
                                  viewingDocument.uploadDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setViewingDocument(null)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="h-5 w-5 text-gray-500" />
                          </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {/* Document Image */}
                          {viewingDocument.mimeType?.startsWith("image/") && (
                            <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                              <img
                                src={`${
                                  import.meta.env.VITE_API_URL?.replace(
                                    "/api",
                                    ""
                                  ) || "http://localhost:5000"
                                }/uploads/medical-documents/${
                                  viewingDocument.filename
                                }`}
                                alt={viewingDocument.originalName}
                                className="max-w-full max-h-[300px] object-contain rounded"
                              />
                            </div>
                          )}

                          {/* Analyzed Data */}
                          {viewingDocument.analyzedData && (
                            <div className="space-y-4">
                              <h4 className="font-semibold text-gray-800">
                                Extracted Information
                              </h4>

                              <div className="grid grid-cols-2 gap-3">
                                {viewingDocument.analyzedData.documentType && (
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">
                                      Document Type
                                    </p>
                                    <p className="font-medium text-gray-800">
                                      {
                                        viewingDocument.analyzedData
                                          .documentType
                                      }
                                    </p>
                                  </div>
                                )}
                                {viewingDocument.analyzedData.bloodGroup && (
                                  <div className="bg-red-50 p-3 rounded-lg">
                                    <p className="text-xs text-red-600">
                                      Blood Group
                                    </p>
                                    <p className="font-bold text-red-700 text-lg">
                                      {viewingDocument.analyzedData.bloodGroup}
                                    </p>
                                  </div>
                                )}
                                {viewingDocument.analyzedData.hospitalName && (
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">
                                      Hospital
                                    </p>
                                    <p className="font-medium text-gray-800">
                                      {
                                        viewingDocument.analyzedData
                                          .hospitalName
                                      }
                                    </p>
                                  </div>
                                )}
                                {viewingDocument.analyzedData.doctorName && (
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">
                                      Doctor
                                    </p>
                                    <p className="font-medium text-gray-800">
                                      {viewingDocument.analyzedData.doctorName}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {viewingDocument.analyzedData.summary && (
                                <div className="bg-sky-50 p-3 rounded-lg">
                                  <p className="text-xs text-sky-600 mb-1">
                                    Summary
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    {viewingDocument.analyzedData.summary}
                                  </p>
                                </div>
                              )}

                              {viewingDocument.analyzedData.conditions?.length >
                                0 && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-2">
                                    Conditions
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {viewingDocument.analyzedData.conditions.map(
                                      (c, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm"
                                        >
                                          {c}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              {viewingDocument.analyzedData.medications
                                ?.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-2">
                                    Medications
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {viewingDocument.analyzedData.medications.map(
                                      (m, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                                        >
                                          {m}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              {viewingDocument.analyzedData.allergies?.length >
                                0 && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-2">
                                    Allergies
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {viewingDocument.analyzedData.allergies.map(
                                      (a, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm"
                                        >
                                          {a}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              {viewingDocument.analyzedData.testResults
                                ?.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-2">
                                    Test Results
                                  </p>
                                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-gray-600">
                                            Test
                                          </th>
                                          <th className="px-3 py-2 text-left text-gray-600">
                                            Value
                                          </th>
                                          <th className="px-3 py-2 text-left text-gray-600">
                                            Unit
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {viewingDocument.analyzedData.testResults.map(
                                          (t, i) => (
                                            <tr
                                              key={i}
                                              className="border-t border-gray-100"
                                            >
                                              <td className="px-3 py-2">
                                                {t.testName}
                                              </td>
                                              <td className="px-3 py-2 font-medium">
                                                {t.value}
                                              </td>
                                              <td className="px-3 py-2 text-gray-500">
                                                {t.unit || "-"}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Extracted Text */}
                          {viewingDocument.extractedText && (
                            <div>
                              <p className="text-xs text-gray-500 mb-2">
                                Extracted Text (OCR)
                              </p>
                              <div className="bg-gray-50 p-3 rounded-lg max-h-[200px] overflow-y-auto">
                                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                                  {viewingDocument.extractedText}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-200 flex justify-end">
                          <button
                            onClick={() => setViewingDocument(null)}
                            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      My Profile
                    </h2>
                    {!editingProfile && (
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {profileError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                      {profileError}
                    </div>
                  )}

                  {profileSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      {profileSuccess}
                    </div>
                  )}

                  {!editingProfile ? (
                    /* View Profile */
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="bg-sky-50 rounded-lg p-4">
                          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <User className="h-5 w-5 text-sky-500" />
                            Basic Information
                          </h3>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="text-gray-500">Name:</span>{" "}
                              <span className="font-medium">{user?.name}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-500">Email:</span>{" "}
                              <span className="font-medium">{user?.email}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-500">Student ID:</span>{" "}
                              <span className="font-medium">
                                {profileData?.studentId || "-"}
                              </span>
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-500">Phone:</span>{" "}
                              <span className="font-medium">
                                {profileData?.phone || "-"}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Academic Info */}
                        <div className="bg-sky-50 rounded-lg p-4">
                          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-sky-500" />
                            Academic Details
                          </h3>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="text-gray-500">Branch:</span>{" "}
                              <span className="font-medium">
                                {profileData?.branch || "-"}
                              </span>
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-500">Year:</span>{" "}
                              <span className="font-medium">
                                {profileData?.year
                                  ? `${profileData.year}${
                                      profileData.year === 1
                                        ? "st"
                                        : profileData.year === 2
                                        ? "nd"
                                        : profileData.year === 3
                                        ? "rd"
                                        : "th"
                                    } Year`
                                  : "-"}
                              </span>
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-500">
                                Hostel Block:
                              </span>{" "}
                              <span className="font-medium">
                                {profileData?.hostelBlock || "-"}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="bg-sky-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-sky-500" />
                          Home Address
                        </h3>
                        <p className="text-sm text-gray-700">
                          {profileData?.address || "Not provided"}
                        </p>
                      </div>

                      {/* Delete Account Section */}
                      <div className="border-t pt-6">
                        <h3 className="font-medium text-red-600 mb-2">
                          Danger Zone
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                          Once you delete your account, there is no going back.
                          Please be certain.
                        </p>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Edit Profile Form */
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      {/* Student ID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Student ID Number
                        </label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            name="studentId"
                            value={profileForm.studentId}
                            onChange={handleProfileFormChange}
                            className="w-full pl-10 pr-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>

                      {/* Branch */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Branch
                        </label>
                        <div className="relative">
                          <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <select
                            name="branch"
                            value={profileForm.branch}
                            onChange={handleProfileFormChange}
                            className="w-full pl-10 pr-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none appearance-none bg-white"
                          >
                            <option value="">Select Branch</option>
                            {BRANCHES.map((branch) => (
                              <option key={branch} value={branch}>
                                {branch}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Year */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Year
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <select
                            name="year"
                            value={profileForm.year}
                            onChange={handleProfileFormChange}
                            className="w-full pl-10 pr-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none appearance-none bg-white"
                          >
                            <option value="">Select Year</option>
                            {YEARS.map((year) => (
                              <option key={year} value={year}>
                                {year}
                                {year === 1
                                  ? "st"
                                  : year === 2
                                  ? "nd"
                                  : year === 3
                                  ? "rd"
                                  : "th"}{" "}
                                Year
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Hostel Block */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hostel Block
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <select
                            name="hostelBlock"
                            value={profileForm.hostelBlock}
                            onChange={handleProfileFormChange}
                            className="w-full pl-10 pr-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none appearance-none bg-white"
                          >
                            <option value="">Select Hostel Block</option>
                            {HOSTEL_BLOCKS.map((block) => (
                              <option key={block} value={block}>
                                {block}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Home Address
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <textarea
                            name="address"
                            value={profileForm.address}
                            onChange={handleProfileFormChange}
                            rows={2}
                            className="w-full pl-10 pr-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleProfileFormChange}
                            className="w-full pl-10 pr-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={profileLoading}
                          className="flex items-center gap-2 px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />
                          {profileLoading ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfile(false);
                            setProfileForm({
                              studentId: profileData?.studentId || "",
                              branch: profileData?.branch || "",
                              year: profileData?.year || "",
                              hostelBlock: profileData?.hostelBlock || "",
                              address: profileData?.address || "",
                              phone: profileData?.phone || "",
                            });
                          }}
                          className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Delete Confirmation Modal */}
                  {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-xl p-6 max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Delete Account?
                        </h3>
                        <p className="text-gray-600 mb-4">
                          This action cannot be undone. All your data including
                          medical records, leave applications, and diet
                          recommendations will be permanently deleted.
                        </p>
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={profileLoading}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            {profileLoading ? "Deleting..." : "Yes, Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* QR Code Tab */}
              {activeTab === "qrcode" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Your Medical QR Code
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Share this QR code with doctors to grant them instant access to your complete medical history and records.
                  </p>

                  {!qrGenerated ? (
                    <div className="bg-sky-50 rounded-xl p-8 border-2 border-dashed border-sky-200 text-center">
                      <Hash className="h-12 w-12 text-sky-400 mx-auto mb-3" />
                      <h3 className="font-medium text-gray-800 mb-2">
                        Generate Your QR Code
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Generate a unique QR code that doctors can scan to access your medical records instantly.
                      </p>
                      <button
                        onClick={handleGenerateQRCode}
                        disabled={qrLoading}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
                      >
                        {qrLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Generate QR Code
                          </>
                        )}
                      </button>
                    </div>
                  ) : qrCode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* QR Code Display */}
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                          {qrCode.qrCodeImage ? (
                            <img
                              src={qrCode.qrCodeImage}
                              alt="Student QR Code"
                              className="w-64 h-64"
                            />
                          ) : (
                            <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                              <span className="text-gray-500">Loading QR Code...</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={handleDownloadQRCode}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </button>
                          <button
                            onClick={() => setShowDeleteQRConfirm(true)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                          >
                            <X className="h-4 w-4" />
                            Delete & Regenerate
                          </button>
                        </div>
                      </div>

                      {/* QR Code Info */}
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            How It Works
                          </h3>
                          <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                            <li>Doctors can scan this QR code before writing prescriptions</li>
                            <li>Scanning grants instant access to your medical history</li>
                            <li>Your complete medical records will be visible to the doctor</li>
                            <li>Download and keep this code for easy access</li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-200">
                          <h3 className="font-semibold text-gray-800 mb-3">Your Information</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Name:</span>
                              <span className="font-medium text-gray-800">{qrCode.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Student ID:</span>
                              <span className="font-medium text-gray-800">{qrCode.studentId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Email:</span>
                              <span className="font-medium text-gray-800">{qrCode.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                <CheckCircle className="h-3 w-3" />
                                Active
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                          <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Important
                          </h3>
                          <p className="text-sm text-yellow-800">
                            Keep this QR code secure. Anyone who scans it can access your medical records.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Unable to load QR code</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Delete QR Code Confirmation Modal */}
        {showDeleteQRConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Delete QR Code?</h2>
              </div>

              <p className="text-gray-600 mb-2">
                Are you sure you want to delete your QR code?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                You can generate a new one anytime, but the old QR code will no longer work.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteQRConfirm(false)}
                  disabled={qrDeleteLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteQRCode}
                  disabled={qrDeleteLoading}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 font-medium inline-flex items-center justify-center gap-2"
                >
                  {qrDeleteLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
