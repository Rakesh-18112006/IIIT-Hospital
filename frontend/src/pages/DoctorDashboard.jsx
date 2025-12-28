import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
import Prescription from "../components/Prescription";
import {
  Users,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  Utensils,
  ChevronRight,
  X,
  Activity,
  Stethoscope,
  Menu,
  ChevronLeft,
  LogOut,
  User,
  ClipboardList,
  CalendarClock,
  RefreshCw,
  Play,
  Loader2,
  Phone,
  Mail,
  Building,
  Hash,
  Info,
  Camera,
  Upload,
  FileCheck,
  Download,
  Pill,
  Zap,
} from "lucide-react";
import QrScanner from "qr-scanner";

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("queue");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form states
  const [notes, setNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [advice, setAdvice] = useState("");
  const [tests, setTests] = useState([]);
  const [suggestedTests, setSuggestedTests] = useState([]);

  // Leave form
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveData, setLeaveData] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    reason: "",
  });

  // Diet form
  const [showDietForm, setShowDietForm] = useState(false);
  const [dietData, setDietData] = useState({
    dietType: "light",
    specialInstructions: "",
    endDate: "",
  });

  // Appointment Queue state
  const [appointmentQueue, setAppointmentQueue] = useState([]);
  const [queueMetadata, setQueueMetadata] = useState(null);
  const [appointmentQueueLoading, setAppointmentQueueLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  // QR Scanner state
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrScannerLoading, setQrScannerLoading] = useState(false);
  const [qrScanResult, setQrScanResult] = useState(null);
  const [qrScanError, setQrScanError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [videoRef, setVideoRef] = useState(null);
  const [qrScannerInstance, setQrScannerInstance] = useState(null);
  const [scanMode, setScanMode] = useState("camera"); // 'camera' or 'upload'

  // Consultation/Prescription states
  const [showQRScannerForConsultation, setShowQRScannerForConsultation] = useState(false);
  const [patientQRScanned, setPatientQRScanned] = useState(false);
  const [scannedPatientData, setScannedPatientData] = useState(null);
  const [prescriptionSaving, setPrescriptionSaving] = useState(false);
  
  // AI Prescription Modal states
  const [showAIPrescriptionModal, setShowAIPrescriptionModal] = useState(false);
  const [showPatientQRScanner, setShowPatientQRScanner] = useState(false);
  const [patientMedicalRecords, setPatientMedicalRecords] = useState(null);
  const [qrScanningForPrescription, setQrScanningForPrescription] = useState(false);

  useEffect(() => {
    fetchQueue();
    fetchAppointmentQueue();
    const interval = setInterval(() => {
      fetchQueue();
      fetchAppointmentQueue();
    }, 15000); // Refresh every 15 seconds for real-time updates
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAppointmentQueue();
  }, [appointmentDate]);

  const fetchQueue = async () => {
    try {
      const response = await api.get("/patient/queue");
      setQueue(response.data);
    } catch (error) {
      console.error("Error fetching queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentQueue = async () => {
    setAppointmentQueueLoading(true);
    try {
      const response = await api.get("/appointments/doctor/queue", {
        params: { date: appointmentDate },
      });
      setAppointmentQueue(response.data.queue || []);
      setQueueMetadata(response.data.metadata);
    } catch (error) {
      console.error("Error fetching appointment queue:", error);
    } finally {
      setAppointmentQueueLoading(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    setStatusUpdateLoading(true);
    try {
      await api.put(`/appointments/doctor/${appointmentId}/status`, {
        status,
        doctorNotes: notes,
        prescription: prescription,
      });
      fetchAppointmentQueue();
      if (status === "completed") {
        setSelectedAppointment(null);
        setNotes("");
        setPrescription("");
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      alert(error.response?.data?.message || "Failed to update status");
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleUpdateAppointmentPriority = async (
    appointmentId,
    severity,
    riskScore,
    reason
  ) => {
    try {
      await api.put(`/appointments/doctor/${appointmentId}/priority`, {
        severity,
        riskScore,
        reason,
      });
      fetchAppointmentQueue();
    } catch (error) {
      console.error("Error updating priority:", error);
      alert(error.response?.data?.message || "Failed to update priority");
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!selectedAppointment) return;

    if (!rescheduleTime) {
      alert("Please select a new time for the appointment");
      return;
    }

    setRescheduleLoading(true);
    try {
      const response = await api.put(
        `/appointments/doctor/${selectedAppointment._id}/reschedule`,
        {
          reason: rescheduleReason || "Rescheduled by doctor",
          newSlotTime: rescheduleTime,
        }
      );

      alert(
        `Appointment rescheduled successfully!\nNew time: ${response.data.newSlot.slotTime}\n${response.data.affectedCount} other appointments were shifted forward by 15 minutes.`
      );

      setShowRescheduleModal(false);
      setRescheduleReason("");
      setRescheduleTime("");
      setSelectedAppointment(null);
      fetchAppointmentQueue();
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      alert(
        error.response?.data?.message || "Failed to reschedule appointment"
      );
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleSavePrescription = async () => {
    if (!selectedAppointment || !prescription.trim()) {
      alert("Please enter a prescription");
      return;
    }

    setPrescriptionSaving(true);
    try {
      const response = await api.post(
        `/appointments/doctor/${selectedAppointment._id}/save-prescription`,
        {
          notes: notes,
          prescription: prescription,
          advice: advice,
        }
      );

      alert("Prescription saved successfully! Email sent to student.");
      fetchAppointmentQueue();
      setSelectedAppointment(null);
      setNotes("");
      setPrescription("");
      setAdvice("");
      setPatientQRScanned(false);
      setScannedPatientData(null);
    } catch (error) {
      console.error("Error saving prescription:", error);
      alert(error.response?.data?.message || "Failed to save prescription");
    } finally {
      setPrescriptionSaving(false);
    }
  };

  const getAppointmentSeverityBadge = (severity) => {
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

  const getAppointmentStatusBadge = (status) => {
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

  const fetchPatientDetails = async (patientId) => {
    setDetailsLoading(true);
    try {
      const response = await api.get(`/patient/${patientId}`);
      setPatientDetails(response.data);

      // Get suggested tests
      const testsResponse = await api.post("/patient/suggest-tests", {
        symptoms: response.data.currentRecord.symptoms,
      });
      setSuggestedTests(testsResponse.data.suggestedTests);
    } catch (error) {
      console.error("Error fetching patient details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // QR Code Scanner Functions
  const handleQRCodeInput = async (qrData) => {
    if (!qrData) {
      setQrScanError("No QR code data detected. Please try again.");
      return;
    }

    setQrScannerLoading(true);
    setQrScanError("");

    try {
      // Handle both direct string and object responses from qr-scanner
      let dataToSend = qrData;
      
      // If qrData is an object with a 'data' property (from qr-scanner upload), extract it
      if (typeof qrData === 'object' && qrData !== null && qrData.data) {
        console.log("📱 [Upload Mode] Detected object with data property");
        dataToSend = qrData.data;
      }
      
      // Ensure dataToSend is a string and trim whitespace
      dataToSend = typeof dataToSend === 'string' ? dataToSend.trim() : JSON.stringify(dataToSend);
      
      // Log for debugging
      console.log("📱 QR Data Type:", typeof dataToSend);
      console.log("📱 QR Data Length:", dataToSend.length);
      console.log("📱 QR Data Preview:", dataToSend.substring(0, 100));

      // Validate QR data format
      try {
        const parsedData = JSON.parse(dataToSend);
        console.log("✅ QR Data Valid JSON:", parsedData);
        
        // Check required fields
        if (!parsedData.userId || !parsedData.studentId || !parsedData.token) {
          console.error("❌ Missing fields - userId:", !!parsedData.userId, "studentId:", !!parsedData.studentId, "token:", !!parsedData.token);
          throw new Error('Missing required fields: userId, studentId, or token');
        }
        
        console.log("✅ All required fields present");
      } catch (parseErr) {
        console.error("❌ QR Data Parse Error:", parseErr.message);
        setQrScanError(`Invalid QR code format: ${parseErr.message}`);
        setQrScannerLoading(false);
        return;
      }

      console.log("📤 Sending QR data to backend...");
      const response = await api.post("/patient/scan-qr", {
        qrData: dataToSend,
      });

      console.log("✅ QR Scan Success:", response.data);
      setQrScanResult(response.data);
      setShowQRScanner(false);
      setScanMode("camera");
    } catch (error) {
      console.error("❌ Error scanning QR code:", error);
      
      // Better error messages
      let errorMessage = "Failed to scan QR code. Please try again.";
      
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || "Invalid QR code format. Make sure you're scanning a valid QR code.";
      } else if (error.response?.status === 404) {
        errorMessage = error.response?.data?.message || "Student not found. The QR code may be invalid or expired.";
      } else if (error.response?.status === 403) {
        errorMessage = "Only doctors can scan QR codes.";
      } else if (error.message === 'Network Error') {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      console.error("🔴 Error Message:", errorMessage);
      setQrScanError(errorMessage);
      setQrScanResult(null);
    } finally {
      setQrScannerLoading(false);
    }
  };

  // Handle QR Code scanning for consultation
  const handleQRCodeInputForConsultation = async (qrData) => {
    if (!qrData) {
      setQrScanError("No QR code data detected. Please try again.");
      return;
    }

    setQrScannerLoading(true);
    setQrScanError("");

    try {
      let dataToSend = qrData;

      if (typeof qrData === "object" && qrData !== null && qrData.data) {
        dataToSend = qrData.data;
      }

      dataToSend =
        typeof dataToSend === "string"
          ? dataToSend.trim()
          : JSON.stringify(dataToSend);

      console.log("📱 Consultation QR Data:", dataToSend.substring(0, 100));

      try {
        const parsedData = JSON.parse(dataToSend);

        if (!parsedData.userId || !parsedData.studentId || !parsedData.token) {
          throw new Error(
            "Missing required fields: userId, studentId, or token"
          );
        }
      } catch (parseErr) {
        console.error("❌ QR Data Parse Error:", parseErr.message);
        setQrScanError(`Invalid QR code format: ${parseErr.message}`);
        setQrScannerLoading(false);
        return;
      }

      const response = await api.post("/patient/scan-qr", {
        qrData: dataToSend,
      });

      console.log("✅ Consultation QR Scan Success:", response.data);
      setScannedPatientData(response.data);
      setPatientQRScanned(true);
      setShowQRScannerForConsultation(false);
      setScanMode("camera");
    } catch (error) {
      console.error("❌ Error scanning QR code for consultation:", error);

      let errorMessage = "Failed to scan QR code. Please try again.";

      if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.message ||
          "Invalid QR code format. Make sure you're scanning a valid QR code.";
      } else if (error.response?.status === 404) {
        errorMessage =
          error.response?.data?.message ||
          "Student not found. The QR code may be invalid or expired.";
      } else if (error.response?.status === 403) {
        errorMessage = "Only doctors can scan QR codes.";
      } else if (error.message === "Network Error") {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      setQrScanError(errorMessage);
      setScannedPatientData(null);
      setPatientQRScanned(false);
    } finally {
      setQrScannerLoading(false);
    }
  };

  // Start camera scanner
  const startCameraScanner = async () => {
    try {
      if (!videoRef) return;
      
      setCameraActive(true);
      const scanner = new QrScanner(
        videoRef,
        async (result) => {
          try {
            const qrData = result.data;
            setCameraActive(false);
            if (qrScannerInstance) {
              qrScannerInstance.stop();
              setQrScannerInstance(null);
            }
            // Check if this is for consultation or general QR scanning
            if (showQRScannerForConsultation) {
              await handleQRCodeInputForConsultation(qrData);
            } else {
              await handleQRCodeInput(qrData);
            }
          } catch (err) {
            console.error("Error processing QR:", err);
          }
        },
        {
          onDecodeError: () => {
            // Ignore decode errors, keep scanning
          },
          highlightCodeOutline: true,
          preferredCamera: "environment",
        }
      );

      setQrScannerInstance(scanner);
      await scanner.start();
    } catch (error) {
      console.error("Error starting camera:", error);
      setQrScanError("Failed to access camera. Please check permissions.");
      setCameraActive(false);
    }
  };

  // Stop camera scanner
  const stopCameraScanner = async () => {
    if (qrScannerInstance) {
      await qrScannerInstance.stop();
      setQrScannerInstance(null);
    }
    setCameraActive(false);
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setQrScannerLoading(true);
    setQrScanError("");

    try {
      const image = await QrScanner.scanImage(file, {
        returnDetailedScanResult: false,
      });
      await handleQRCodeInput(image);
    } catch (error) {
      console.error("Error scanning uploaded QR:", error);
      setQrScanError("Invalid QR code image. Please try another image.");
    } finally {
      setQrScannerLoading(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setNotes(patient.doctorNotes || "");
    setPrescription(patient.prescription || "");
    setAdvice(patient.advice || "");
    setTests(patient.suggestedTests || []);
    fetchPatientDetails(patient._id);
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedPatient) return;

    try {
      await api.put(`/patient/${selectedPatient._id}`, {
        status,
        doctorNotes: notes,
        prescription,
        advice,
        suggestedTests: tests,
      });

      fetchQueue();
      if (status === "completed") {
        setSelectedPatient(null);
        setPatientDetails(null);
      }
    } catch (error) {
      console.error("Error updating patient:", error);
    }
  };

  const handleUpdateSeverity = async (severity) => {
    if (!selectedPatient) return;

    try {
      await api.put(`/patient/${selectedPatient._id}`, { severity });
      fetchQueue();
      setSelectedPatient((prev) => ({ ...prev, severity }));
    } catch (error) {
      console.error("Error updating severity:", error);
    }
  };

  const handleCreateLeave = async () => {
    if (!selectedPatient || !leaveData.endDate || !leaveData.reason) return;

    try {
      await api.post(`/patient/${selectedPatient._id}/leave`, leaveData);
      setShowLeaveForm(false);
      setLeaveData({
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        reason: "",
      });
    } catch (error) {
      console.error("Error creating leave:", error);
    }
  };

  const handleCreateDiet = async () => {
    if (!selectedPatient) return;

    try {
      await api.post(`/patient/${selectedPatient._id}/diet`, dietData);
      setShowDietForm(false);
      setDietData({ dietType: "light", specialInstructions: "", endDate: "" });
    } catch (error) {
      console.error("Error creating diet:", error);
    }
  };

  // AI Prescription Handlers
  const handleOpenAIPrescription = () => {
    if (!selectedAppointment) {
      alert("Please select an appointment first");
      return;
    }
    // Set the selected appointment properly before opening modal
    setShowAIPrescriptionModal(true);
  };

  const handleScanPatientQR = async (scannedData) => {
    try {
      setQrScanningForPrescription(true);
      // scannedData should contain patient ID or email
      const patientId = scannedData;
      const response = await api.get(`/patient/${patientId}/medical-records`);
      setPatientMedicalRecords(response.data);
      setShowPatientQRScanner(false);
      alert("Patient medical records loaded successfully!");
    } catch (error) {
      console.error("Error loading patient records:", error);
      alert(error.response?.data?.message || "Failed to load patient records");
    } finally {
      setQrScanningForPrescription(false);
    }
  };

  const handleSaveAIPrescription = async (prescriptionData) => {
    try {
      setPrescriptionSaving(true);
      
      // Save prescription via API
      const response = await api.post("/prescriptions/save", {
        appointmentId: selectedAppointment._id,
        patientId: selectedAppointment.patientId?._id || selectedAppointment.patientId,
        diagnosis: prescriptionData.diagnosis,
        symptoms: prescriptionData.symptoms,
        medicines: prescriptionData.medicines,
        notes: prescriptionData.notes,
        advice: prescriptionData.advice,
        interactions: prescriptionData.interactions,
      });

      alert("Prescription saved successfully! Email sent to student.");
      setShowAIPrescriptionModal(false);
      setPrescription("");
      setAdvice("");
      
      // Refresh appointments
      fetchAppointmentQueue();
    } catch (error) {
      console.error("Error saving prescription:", error);
      alert(error.response?.data?.message || "Failed to save prescription");
    } finally {
      setPrescriptionSaving(false);
    }
  };


  const getSeverityColor = (severity) => {
    const colors = {
      red: "bg-red-500",
      orange: "bg-orange-500",
      green: "bg-green-500",
    };
    return colors[severity] || "bg-gray-500";
  };

  const getSeverityBadge = (severity) => {
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

  const queueStats = {
    total: queue.length,
    red: queue.filter((p) => p.severity === "red").length,
    orange: queue.filter((p) => p.severity === "orange").length,
    green: queue.filter((p) => p.severity === "green").length,
  };

  const appointmentStats = {
    total: appointmentQueue.length,
    critical: appointmentQueue.filter((a) => a.severity === "critical").length,
    high: appointmentQueue.filter((a) => a.severity === "high").length,
    medium: appointmentQueue.filter((a) => a.severity === "medium").length,
    low: appointmentQueue.filter((a) => a.severity === "low").length,
    inProgress: appointmentQueue.filter((a) => a.status === "in-progress")
      .length,
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
                <Stethoscope className="h-5 w-5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">
                  Dr. {user?.name?.replace("Dr. ", "")}
                </p>
                <p className="text-xs text-gray-500">Doctor</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {[
            { id: "queue", label: "Patient Queue", icon: Users },
            { id: "appointments", label: "Appointments", icon: CalendarClock },
            { id: "consultation", label: "Consultation", icon: Stethoscope },
            { id: "qr-scanner", label: "QR Scanner", icon: Hash },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                ${
                  activeTab === tab.id
                    ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                    : "text-gray-600 hover:bg-sky-50 hover:text-sky-600"
                }
                ${sidebarCollapsed ? "justify-center" : ""}
              `}
              title={sidebarCollapsed ? tab.label : ""}
            >
              <tab.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-medium">{tab.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Queue Stats in Sidebar */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-t border-sky-100">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Queue Status
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Critical
                </span>
                <span className="font-semibold text-red-600">
                  {queueStats.red}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Moderate
                </span>
                <span className="font-semibold text-orange-600">
                  {queueStats.orange}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Normal
                </span>
                <span className="font-semibold text-green-600">
                  {queueStats.green}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t border-sky-100">
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
                {activeTab === "queue" && "Patient Queue"}
                {activeTab === "appointments" && "Appointment Queue"}
                {activeTab === "consultation" && "Patient Consultation"}
              </h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                {activeTab === "queue" &&
                  `${queueStats.total} patients waiting`}
                {activeTab === "appointments" &&
                  `${appointmentStats.total} appointments today`}
                {activeTab === "consultation" &&
                  (selectedPatient
                    ? `Consulting: ${selectedPatient.student?.name}`
                    : "Select a patient to begin")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-sky-50 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-sky-700">Online</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Stats Cards - Always visible */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-sky-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <Users className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {queueStats.total}
                  </p>
                  <p className="text-sm text-gray-500">Total Queue</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {queueStats.red}
                  </p>
                  <p className="text-sm text-gray-500">Critical</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {queueStats.orange}
                  </p>
                  <p className="text-sm text-gray-500">Moderate</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {queueStats.green}
                  </p>
                  <p className="text-sm text-gray-500">Normal</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments Tab */}
          {activeTab === "appointments" && (
            <div className="space-y-6">
              {/* Appointment Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-sky-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 rounded-lg">
                      <CalendarClock className="h-5 w-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-sky-600">
                        {appointmentStats.total}
                      </p>
                      <p className="text-sm text-gray-500">Total</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        {appointmentStats.critical}
                      </p>
                      <p className="text-sm text-gray-500">Critical</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {appointmentStats.high}
                      </p>
                      <p className="text-sm text-gray-500">High</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-yellow-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {appointmentStats.medium}
                      </p>
                      <p className="text-sm text-gray-500">Medium</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {appointmentStats.low}
                      </p>
                      <p className="text-sm text-gray-500">Low</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Selector & Refresh */}
              <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-sky-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-sky-500" />
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <button
                    onClick={fetchAppointmentQueue}
                    disabled={appointmentQueueLoading}
                    className="px-4 py-2 text-sky-600 hover:bg-sky-50 rounded-lg flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        appointmentQueueLoading ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </button>
                </div>
                {queueMetadata && (
                  <div className="text-sm text-gray-500">
                    Last updated:{" "}
                    {new Date(queueMetadata.lastUpdated).toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* Appointment Queue Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Appointment List */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-sky-100">
                  <div className="p-4 border-b border-sky-100">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Today's Queue (Priority Order)
                    </h2>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto">
                    {appointmentQueueLoading ? (
                      <div className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-sky-500 mx-auto" />
                      </div>
                    ) : appointmentQueue.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <CalendarClock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No appointments for this date</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-sky-50">
                        {appointmentQueue.map((appointment, index) => (
                          <button
                            key={appointment._id}
                            onClick={() => setSelectedAppointment(appointment)}
                            className={`w-full p-4 text-left hover:bg-sky-50 transition-colors ${
                              selectedAppointment?._id === appointment._id
                                ? "bg-sky-50"
                                : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sm font-bold text-sky-600">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-800 truncate">
                                    {appointment.student?.name || "Unknown"}
                                  </p>
                                  {getAppointmentSeverityBadge(
                                    appointment.severity
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>{appointment.slotTime}</span>
                                  <span>•</span>
                                  <span>Score: {appointment.riskScore}</span>
                                </div>
                                <p className="text-xs text-gray-400 truncate mt-1">
                                  {appointment.healthProblem?.substring(0, 50)}
                                  ...
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Appointment Details */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-sky-100">
                  {!selectedAppointment ? (
                    <div className="h-full flex items-center justify-center p-8 text-gray-500">
                      <div className="text-center">
                        <CalendarClock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">
                          Select an appointment from the queue
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      {/* Appointment Header */}
                      <div className="p-4 border-b border-sky-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                              {selectedAppointment.student?.name}
                            </h2>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Hash className="h-4 w-4" />
                                {selectedAppointment.studentDetails
                                  ?.studentId || "N/A"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {selectedAppointment.studentDetails?.branch ||
                                  "N/A"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {selectedAppointment.slotTime} -{" "}
                                {selectedAppointment.slotEndTime}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getAppointmentStatusBadge(
                              selectedAppointment.status
                            )}
                            {getAppointmentSeverityBadge(
                              selectedAppointment.severity
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Appointment Content */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* AI Analysis */}
                        <div className="bg-sky-50 rounded-lg p-4">
                          <h3 className="font-semibold text-sky-800 mb-2 flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            AI Priority Analysis
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Risk Score</p>
                              <p className="text-2xl font-bold text-sky-600">
                                {selectedAppointment.riskScore}/100
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Confidence</p>
                              <p className="text-lg font-semibold text-gray-700">
                                {selectedAppointment.aiAnalysis?.confidence ||
                                  0}
                                %
                              </p>
                            </div>
                          </div>
                          {selectedAppointment.aiAnalysis?.detectedConditions
                            ?.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-1">
                                Detected Conditions
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {selectedAppointment.aiAnalysis.detectedConditions.map(
                                  (c, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-xs"
                                    >
                                      {c}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                          {selectedAppointment.aiAnalysis
                            ?.recommendedAction && (
                            <p className="mt-2 text-sm text-sky-700">
                              <strong>Recommendation:</strong>{" "}
                              {selectedAppointment.aiAnalysis.recommendedAction}
                            </p>
                          )}
                        </div>

                        {/* Health Problem */}
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-2">
                            Health Problem
                          </h3>
                          <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                            {selectedAppointment.healthProblem}
                          </p>
                        </div>

                        {/* Symptoms */}
                        {selectedAppointment.symptoms?.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-2">
                              Symptoms
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedAppointment.symptoms.map(
                                (symptom, i) => (
                                  <span
                                    key={i}
                                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                                  >
                                    {symptom}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Contact Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">
                              Contact
                            </p>
                            <p className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-400" />
                              {selectedAppointment.studentDetails?.phone ||
                                "Not provided"}
                            </p>
                            <p className="flex items-center gap-2 text-sm mt-1">
                              <Mail className="h-4 w-4 text-gray-400" />
                              {selectedAppointment.studentDetails?.email ||
                                "Not provided"}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">
                              Academic Info
                            </p>
                            <p className="text-sm">
                              Year:{" "}
                              {selectedAppointment.studentDetails?.year ||
                                "N/A"}
                            </p>
                            <p className="text-sm">
                              Hostel:{" "}
                              {selectedAppointment.studentDetails
                                ?.hostelBlock || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* QR Code Scan Section - Only for Consultation */}
                        {selectedAppointment.status === "in-progress" && !patientQRScanned && (
                          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                            <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                              <Hash className="h-5 w-5" />
                              Scan Patient QR Code to Access Consultation
                            </h3>
                            <p className="text-sm text-orange-800 mb-4">
                              Please scan the patient's QR code to unlock the prescription and consultation notes section.
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowQRScannerForConsultation(true)}
                                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
                              >
                                <Camera className="h-4 w-4" />
                                Scan QR Code
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Doctor Notes and Prescription - Only visible after QR scan */}
                        {(selectedAppointment.status !== "in-progress" || patientQRScanned) && (
                          <>
                            {patientQRScanned && scannedPatientData && (
                              <div className="space-y-4">
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                  <p className="text-sm text-green-900 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <strong>QR Code Verified:</strong> {scannedPatientData.student?.name}
                                  </p>
                                </div>

                                {/* Medical Records from QR Scan */}
                                {scannedPatientData.medicalRecords && scannedPatientData.medicalRecords.length > 0 && (
                                  <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
                                    <div className="bg-blue-100 px-4 py-2 border-b border-blue-200">
                                      <h4 className="font-semibold text-blue-900 flex items-center gap-2 text-sm">
                                        <FileText className="h-4 w-4" />
                                        Previous Medical Records ({scannedPatientData.medicalRecords.length})
                                      </h4>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                      {scannedPatientData.medicalRecords.map((record, idx) => (
                                        <div key={idx} className="px-4 py-3 border-b border-blue-100 hover:bg-blue-100 text-sm">
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <p className="font-medium text-gray-800">
                                                {record.symptoms?.join(", ") || "General Checkup"}
                                              </p>
                                              {record.prescription && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                  <strong>Rx:</strong> {record.prescription.substring(0, 60)}...
                                                </p>
                                              )}
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                                              record.severity === "red" ? "bg-red-200 text-red-800" :
                                              record.severity === "orange" ? "bg-orange-200 text-orange-800" :
                                              "bg-green-200 text-green-800"
                                            }`}>
                                              {record.severity?.toUpperCase()}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {new Date(record.createdAt).toLocaleDateString()}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Doctor Notes */}
                            <div>
                              <label className="font-semibold text-gray-800 block mb-2">
                                Doctor's Notes
                              </label>
                              <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                                placeholder="Add consultation notes..."
                              />
                            </div>

                            {/* Hospital Theme Medical Receipt with AI Prescription */}
                            <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg border-2 border-sky-200 p-6">
                              <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white rounded-t-lg p-4 -m-6 mb-4">
                                <h3 className="text-2xl font-bold mb-1">🏥 MEDICAL PRESCRIPTION RECEIPT</h3>
                                <p className="text-sky-100 text-sm">IIIT Hospital - Professional Prescription Form</p>
                              </div>

                              {/* Patient & Doctor Info Header */}
                              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-white rounded border border-sky-200">
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">PATIENT</p>
                                  <p className="text-sm font-bold text-gray-800">{selectedAppointment.student?.name}</p>
                                  <p className="text-xs text-gray-600">ID: {selectedAppointment.studentDetails?.studentId}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">DOCTOR</p>
                                  <p className="text-sm font-bold text-gray-800">Dr. {user?.name}</p>
                                  <p className="text-xs text-gray-600">{user?.department}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">DATE</p>
                                  <p className="text-sm font-bold text-gray-800">{new Date().toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">TIME</p>
                                  <p className="text-sm font-bold text-gray-800">{new Date().toLocaleTimeString()}</p>
                                </div>
                              </div>

                              {/* AI Prescription Writer Button */}
                              <button
                                onClick={() => {
                                  setSelectedAppointment(selectedAppointment);
                                  setShowAIPrescriptionModal(true);
                                }}
                                className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                              >
                                <Zap className="h-5 w-5" />
                                ✨ Open AI Prescription Writer
                              </button>

                              {/* Diagnosis Input */}
                              <div className="mb-4">
                                <label className="text-xs font-bold text-gray-700 block mb-1">DIAGNOSIS</label>
                                <input
                                  type="text"
                                  placeholder="Enter primary diagnosis..."
                                  className="w-full px-3 py-2 border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                                />
                              </div>

                              {/* Prescription Content */}
                              <div className="mb-4">
                                <label className="text-xs font-bold text-gray-700 block mb-2">💊 MEDICINES PRESCRIBED</label>
                                <div className="bg-white rounded border border-sky-300 p-3 min-h-24">
                                  <textarea
                                    value={prescription}
                                    onChange={(e) => setPrescription(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border-0 focus:ring-0 bg-transparent focus:outline-none text-sm"
                                    placeholder="Type medicine name + TAB for AI suggestions&#10;e.g., Paracetamol 500mg - Once daily for 5 days&#10;       Cetirizine 10mg - Morning and night for 7 days"
                                  />
                                </div>
                                <p className="text-xs text-sky-600 mt-2">💡 Tip: Type medicine name and press TAB for AI autocomplete with dosage suggestions</p>
                              </div>

                              {/* Patient Advice */}
                              <div className="mb-4">
                                <label className="text-xs font-bold text-gray-700 block mb-1">📋 PATIENT ADVICE</label>
                                <textarea
                                  value={advice}
                                  onChange={(e) => setAdvice(e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                                  placeholder="Follow-up instructions, dietary recommendations, lifestyle changes..."
                                />
                              </div>

                              {/* Receipt Footer */}
                              <div className="bg-white rounded border border-sky-200 p-3 text-center">
                                <p className="text-xs text-gray-600">
                                  📧 Prescription will be emailed to patient | 💾 Saved to medical records
                                </p>
                              </div>
                            </div>

                            {/* Additional Advice Section */}
                            <div>
                              <label className="font-semibold text-gray-800 block mb-2">
                                Follow-up Instructions
                              </label>
                              <textarea
                                value={advice}
                                onChange={(e) => setAdvice(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                                placeholder="Add follow-up instructions..."
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Action Buttons - Appointment Management */}
                      <div className="p-4 border-t border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          {/* Reschedule Button */}
                          {(selectedAppointment.status === "pending" ||
                            selectedAppointment.status === "confirmed") && (
                            <button
                              onClick={() => setShowRescheduleModal(true)}
                              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                              <CalendarClock className="h-4 w-4" />
                              Reschedule
                            </button>
                          )}

                          {/* Confirm Button */}
                          {selectedAppointment.status === "pending" && (
                            <button
                              onClick={() =>
                                handleUpdateAppointmentStatus(
                                  selectedAppointment._id,
                                  "confirmed"
                                )
                              }
                              disabled={statusUpdateLoading}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Confirm
                            </button>
                          )}

                          {/* Start Consultation Button */}
                          {(selectedAppointment.status === "pending" ||
                            selectedAppointment.status === "confirmed") && (
                            <button
                              onClick={() =>
                                handleUpdateAppointmentStatus(
                                  selectedAppointment._id,
                                  "in-progress"
                                )
                              }
                              disabled={statusUpdateLoading}
                              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition-colors"
                            >
                              <Play className="h-4 w-4" />
                              Start Consultation
                            </button>
                          )}

                          {/* Quick QR Scan & Prescription Button (Always Available) */}
                          <button
                            onClick={() => {
                              setShowPatientQRScanner(true);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                          >
                            <Camera className="h-4 w-4" />
                            Quick QR Scan
                          </button>
                        </div>

                        {/* AI Prescription - Always Prominent */}
                        {selectedAppointment.status === "in-progress" || true && (
                          <button
                            onClick={handleOpenAIPrescription}
                            className="w-full px-4 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors mb-3"
                          >
                            <Zap className="h-5 w-5" />
                            Open AI Prescription Writer (Hospital Template)
                          </button>
                        )}

                        {/* Other action buttons */}
                        <div className="flex flex-wrap gap-2">
                          {selectedAppointment.status === "in-progress" && patientQRScanned && (
                            <button
                              onClick={handleSavePrescription}
                              disabled={prescriptionSaving || !prescription.trim()}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                            >
                              {prescriptionSaving ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  Save & Complete
                                </>
                              )}
                            </button>
                          )}
                          {selectedAppointment.status === "in-progress" && !patientQRScanned && (
                            <button
                              onClick={() =>
                                handleUpdateAppointmentStatus(
                                  selectedAppointment._id,
                                  "completed"
                                )
                              }
                              disabled={statusUpdateLoading}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Complete Without Prescription
                            </button>
                          )}
                          {(selectedAppointment.status === "pending" ||
                            selectedAppointment.status === "confirmed") && (
                            <button
                              onClick={() =>
                                handleUpdateAppointmentStatus(
                                  selectedAppointment._id,
                                  "no-show"
                                )
                              }
                              disabled={statusUpdateLoading}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                            >
                              No Show
                            </button>
                          )}

                          {/* Reschedule Button */}
                          {(selectedAppointment.status === "pending" ||
                            selectedAppointment.status === "confirmed") && (
                            <button
                              onClick={() => setShowRescheduleModal(true)}
                              disabled={rescheduleLoading}
                              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                            >
                              <Clock className="h-4 w-4" />
                              Reschedule
                            </button>
                          )}
                        </div>

                        {statusUpdateLoading && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Updating...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Grid - Original Queue Tab */}
          {(activeTab === "queue" || activeTab === "consultation") && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient Queue */}
              <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-sky-100">
                <div className="p-4 border-b border-sky-100">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Patient Queue
                  </h2>
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                    </div>
                  ) : queue.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No patients in queue</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-sky-50">
                      {queue.map((patient) => (
                        <button
                          key={patient._id}
                          onClick={() => handleSelectPatient(patient)}
                          className={`w-full p-4 text-left hover:bg-sky-50 transition-colors ${
                            selectedPatient?._id === patient._id
                              ? "bg-sky-50"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${getSeverityColor(
                                patient.severity
                              )}`}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">
                                {patient.student?.name || "Unknown"}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {patient.symptoms.slice(0, 2).join(", ")}
                                {patient.symptoms.length > 2 && "..."}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Details */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-sky-100">
                {!selectedPatient ? (
                  <div className="h-full flex items-center justify-center p-8 text-gray-500">
                    <div className="text-center">
                      <Stethoscope className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Select a patient from the queue</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    {/* Patient Header */}
                    <div className="p-4 border-b border-sky-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-800">
                            {selectedPatient.student?.name}
                          </h2>
                          <p className="text-sm text-gray-500">
                            ID: {selectedPatient.student?.studentId}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPatient(null);
                            setPatientDetails(null);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <X className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {detailsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                        </div>
                      ) : (
                        <>
                          {/* Severity Control */}
                          <div className="bg-sky-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Severity Classification
                            </p>
                            <div className="flex gap-2">
                              {["red", "orange", "green"].map((sev) => (
                                <button
                                  key={sev}
                                  onClick={() => handleUpdateSeverity(sev)}
                                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                    selectedPatient.severity === sev
                                      ? sev === "red"
                                        ? "bg-red-500 text-white"
                                        : sev === "orange"
                                        ? "bg-orange-500 text-white"
                                        : "bg-green-500 text-white"
                                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  {sev === "red"
                                    ? "Critical"
                                    : sev === "orange"
                                    ? "Moderate"
                                    : "Normal"}
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              ⚠️ Severity is decision-support only, not final
                              diagnosis
                            </p>
                          </div>

                          {/* Symptoms */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Symptoms
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedPatient.symptoms.map((s, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                            {selectedPatient.symptomDescription && (
                              <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                {selectedPatient.symptomDescription}
                              </p>
                            )}
                          </div>

                          {/* Vitals */}
                          {selectedPatient.vitals &&
                            Object.keys(selectedPatient.vitals).length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  Vitals
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {selectedPatient.vitals.temperature && (
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <p className="text-xs text-gray-500">
                                        Temperature
                                      </p>
                                      <p className="font-semibold">
                                        {selectedPatient.vitals.temperature}°F
                                      </p>
                                    </div>
                                  )}
                                  {selectedPatient.vitals.bloodPressure && (
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <p className="text-xs text-gray-500">
                                        Blood Pressure
                                      </p>
                                      <p className="font-semibold">
                                        {selectedPatient.vitals.bloodPressure}
                                      </p>
                                    </div>
                                  )}
                                  {selectedPatient.vitals.heartRate && (
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <p className="text-xs text-gray-500">
                                        Heart Rate
                                      </p>
                                      <p className="font-semibold">
                                        {selectedPatient.vitals.heartRate} bpm
                                      </p>
                                    </div>
                                  )}
                                  {selectedPatient.vitals.oxygenLevel && (
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <p className="text-xs text-gray-500">
                                        SpO2
                                      </p>
                                      <p className="font-semibold">
                                        {selectedPatient.vitals.oxygenLevel}%
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Patient History */}
                          {patientDetails?.history?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Previous Visits
                              </p>
                              <div className="space-y-2">
                                {patientDetails.history
                                  .slice(0, 3)
                                  .map((h, i) => (
                                    <div
                                      key={i}
                                      className="bg-gray-50 p-3 rounded-lg text-sm"
                                    >
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          {h.symptoms.join(", ")}
                                        </span>
                                        <span className="text-gray-400">
                                          {new Date(
                                            h.createdAt
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Suggested Tests */}
                          {suggestedTests.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Suggested Tests
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {suggestedTests.map((test, i) => (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      if (!tests.includes(test)) {
                                        setTests([...tests, test]);
                                      }
                                    }}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                      tests.includes(test)
                                        ? "bg-sky-500 text-white"
                                        : "bg-sky-100 text-sky-700 hover:bg-sky-200"
                                    }`}
                                  >
                                    {test}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Doctor Notes */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Notes
                            </label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                              placeholder="Enter clinical notes..."
                            />
                          </div>

                          {/* Prescription */}
                          {/* AI Prescription Section */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <Pill className="h-5 w-5 text-sky-600" />
                              <label className="text-sm font-semibold text-gray-700">
                                AI-Powered Prescription
                              </label>
                            </div>

                            {/* QR Scanner & Medical Records Button */}
                            <button
                              onClick={() => setShowPatientQRScanner(true)}
                              disabled={!selectedAppointment}
                              className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                            >
                              <Camera className="h-4 w-4" />
                              Scan/Upload Patient QR Code
                            </button>

                            {/* Show loaded medical records */}
                            {patientMedicalRecords && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-blue-900 mb-2">
                                  ✓ Medical Records Loaded
                                </p>
                                <div className="text-xs text-blue-700 space-y-1">
                                  <p>Previous diagnoses: {patientMedicalRecords.diagnoses?.length || 0}</p>
                                  <p>Allergies: {patientMedicalRecords.allergies?.join(", ") || "None"}</p>
                                </div>
                              </div>
                            )}

                            {/* Open AI Prescription Button */}
                            <button
                              onClick={handleOpenAIPrescription}
                              disabled={!selectedAppointment}
                              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:from-gray-300 disabled:to-gray-300 text-white px-4 py-3 rounded-lg transition-colors font-semibold"
                            >
                              <Zap className="h-4 w-4" />
                              Open AI Prescription Writer
                            </button>
                          </div>


                          {/* Advice */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Advice for Patient
                            </label>
                            <textarea
                              value={advice}
                              onChange={(e) => setAdvice(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                              placeholder="Enter advice..."
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="p-4 border-t border-sky-100 bg-sky-50">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleUpdateStatus("in_consultation")}
                          className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
                        >
                          <Activity className="h-4 w-4" />
                          Start Consultation
                        </button>
                        <button
                          onClick={() => handleUpdateStatus("completed")}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Complete
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          onClick={() => setShowLeaveForm(true)}
                          className="flex-1 flex items-center justify-center gap-2 bg-white border border-sky-200 text-sky-700 px-4 py-2 rounded-lg hover:bg-sky-50 transition-colors"
                        >
                          <Calendar className="h-4 w-4" />
                          Medical Leave
                        </button>
                        <button
                          onClick={() => setShowDietForm(true)}
                          className="flex-1 flex items-center justify-center gap-2 bg-white border border-sky-200 text-sky-700 px-4 py-2 rounded-lg hover:bg-sky-50 transition-colors"
                        >
                          <Utensils className="h-4 w-4" />
                          Diet Plan
                        </button>
                        <button
                          onClick={() => handleUpdateStatus("referred")}
                          className="flex-1 flex items-center justify-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          Refer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medical Leave Modal */}
          {showLeaveForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Create Medical Leave
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={leaveData.startDate}
                      onChange={(e) =>
                        setLeaveData({
                          ...leaveData,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-sky-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={leaveData.endDate}
                      onChange={(e) =>
                        setLeaveData({ ...leaveData, endDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-sky-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Reason
                    </label>
                    <textarea
                      value={leaveData.reason}
                      onChange={(e) =>
                        setLeaveData({ ...leaveData, reason: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-sky-200 rounded-lg"
                      placeholder="Reason for medical leave..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowLeaveForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateLeave}
                    className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
                  >
                    Create Leave
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Diet Plan Modal */}
          {showDietForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Create Diet Plan
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Diet Type
                    </label>
                    <select
                      value={dietData.dietType}
                      onChange={(e) =>
                        setDietData({ ...dietData, dietType: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-sky-200 rounded-lg"
                    >
                      <option value="normal">Normal</option>
                      <option value="light">Light</option>
                      <option value="special">Special</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={dietData.endDate}
                      onChange={(e) =>
                        setDietData({ ...dietData, endDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-sky-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Special Instructions
                    </label>
                    <textarea
                      value={dietData.specialInstructions}
                      onChange={(e) =>
                        setDietData({
                          ...dietData,
                          specialInstructions: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-sky-200 rounded-lg"
                      placeholder="Special dietary instructions..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowDietForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateDiet}
                    className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
                  >
                    Create Diet Plan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reschedule Modal */}
          {showRescheduleModal && selectedAppointment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Reschedule Appointment
                  </h3>
                  <button
                    onClick={() => {
                      setShowRescheduleModal(false);
                      setRescheduleReason("");
                      setRescheduleTime("");
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm text-orange-700">
                      <strong>Current Time:</strong>{" "}
                      {selectedAppointment.slotTime} -{" "}
                      {selectedAppointment.slotEndTime}
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      <strong>Patient:</strong>{" "}
                      {selectedAppointment.student?.name}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      <strong>⚠️ Important:</strong> When you reschedule this
                      appointment, all other appointments from the current time
                      slot onwards will be shifted forward by 15 minutes.
                      Students will receive notifications about their updated
                      times.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select New Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      min="09:00"
                      max="21:00"
                      step="900"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Working hours: 9:00 AM - 9:00 PM (15-minute intervals)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Rescheduling
                    </label>
                    <textarea
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter reason (will be sent to the student)..."
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => {
                      setShowRescheduleModal(false);
                      setRescheduleReason("");
                      setRescheduleTime("");
                    }}
                    disabled={rescheduleLoading}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRescheduleAppointment}
                    disabled={rescheduleLoading || !rescheduleTime}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {rescheduleLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Rescheduling...
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        Confirm Reschedule
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QR Scanner Tab */}
          {activeTab === "qr-scanner" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Patient QR Code Scanner
                </h2>
                <p className="text-gray-600 mb-6">
                  Scan a student's QR code using your camera or upload an image to instantly access their complete medical history, records, documents, and prescriptions.
                </p>

                {/* Scan Mode Toggle */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => {
                      setScanMode("camera");
                      setQrScanError("");
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                      scanMode === "camera"
                        ? "bg-sky-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Camera className="h-4 w-4" />
                    Camera Scan
                  </button>
                  <button
                    onClick={() => {
                      setScanMode("upload");
                      setQrScanError("");
                      if (cameraActive) stopCameraScanner();
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                      scanMode === "upload"
                        ? "bg-sky-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </button>
                </div>

                {/* Camera Scanner */}
                {scanMode === "camera" && (
                  <div className="space-y-4 mb-6">
                    <div className="bg-sky-50 rounded-xl p-6 border-2 border-dashed border-sky-200">
                      {!cameraActive ? (
                        <div className="text-center">
                          <Camera className="h-12 w-12 text-sky-400 mx-auto mb-4" />
                          <p className="text-gray-700 mb-4">
                            Point your camera at the student's QR code
                          </p>
                          <button
                            onClick={startCameraScanner}
                            disabled={qrScannerLoading}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 font-medium"
                          >
                            {qrScannerLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              <>
                                <Camera className="h-4 w-4" />
                                Start Camera
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <video
                            ref={(el) => setVideoRef(el)}
                            style={{
                              width: "100%",
                              maxWidth: "400px",
                              margin: "0 auto",
                              borderRadius: "8px",
                            }}
                          />
                          <p className="text-center text-sm text-gray-600 mt-4">
                            Position QR code within the frame
                          </p>
                          <button
                            onClick={stopCameraScanner}
                            className="mt-4 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                          >
                            Stop Camera
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* File Upload Scanner */}
                {scanMode === "upload" && (
                  <div className="space-y-4 mb-6">
                    <div className="bg-sky-50 rounded-xl p-6 border-2 border-dashed border-sky-200">
                      <label className="flex flex-col items-center justify-center cursor-pointer">
                        <Upload className="h-12 w-12 text-sky-400 mb-4" />
                        <p className="text-gray-700 font-medium mb-2">
                          Upload QR Code Image
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          PNG, JPG, or other image formats
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={qrScannerLoading}
                          className="hidden"
                        />
                        <button
                          onClick={(e) => e.currentTarget.parentElement.querySelector('input').click()}
                          disabled={qrScannerLoading}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 font-medium"
                        >
                          {qrScannerLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Scanning...
                            </>
                          ) : (
                            <>
                              <FileCheck className="h-4 w-4" />
                              Select Image
                            </>
                          )}
                        </button>
                      </label>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {qrScanError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-center gap-2 mb-6">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{qrScanError}</span>
                  </div>
                )}

                {/* Scan Results */}
                {qrScanResult && (
                  <div className="space-y-4">
                    {/* Student Info */}
                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-6 border border-sky-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-sky-600" />
                        Patient Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-semibold text-gray-800">{qrScanResult.student.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Student ID</p>
                          <p className="font-semibold text-gray-800">{qrScanResult.student.studentId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-semibold text-gray-800">{qrScanResult.student.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-semibold text-gray-800">{qrScanResult.student.phone || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Branch</p>
                          <p className="font-semibold text-gray-800">{qrScanResult.student.branch || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Year</p>
                          <p className="font-semibold text-gray-800">{qrScanResult.student.year || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Hostel</p>
                          <p className="font-semibold text-gray-800">{qrScanResult.student.hostelBlock || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-semibold text-gray-800 text-xs">{qrScanResult.student.address || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Medical Records */}
                    {qrScanResult.medicalRecords && qrScanResult.medicalRecords.length > 0 && (
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Medical Records ({qrScanResult.medicalRecords.length})
                          </h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {qrScanResult.medicalRecords.map((record, idx) => (
                            <div key={idx} className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">
                                    {record.symptoms?.join(", ") || "Unknown Symptoms"}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">{record.doctorNotes}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                                  record.severity === "red" ? "bg-red-100 text-red-700" :
                                  record.severity === "orange" ? "bg-orange-100 text-orange-700" :
                                  "bg-green-100 text-green-700"
                                }`}>
                                  {record.severity?.toUpperCase()}
                                </span>
                              </div>
                              {record.prescription && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-900">
                                  <strong>Prescription:</strong> {record.prescription}
                                </div>
                              )}
                              {record.advice && (
                                <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-900">
                                  <strong>Advice:</strong> {record.advice}
                                </div>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(record.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medical Leaves */}
                    {qrScanResult.medicalLeaves && qrScanResult.medicalLeaves.length > 0 && (
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Medical Leaves ({qrScanResult.medicalLeaves.length})
                          </h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {qrScanResult.medicalLeaves.map((leave, idx) => (
                            <div key={idx} className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50">
                              <p className="text-sm text-gray-800">
                                <strong>Period:</strong> {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()} <br />
                                <strong>Reason:</strong> {leave.reason}
                              </p>
                              {leave.notes && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <strong>Notes:</strong> {leave.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Diet Recommendations */}
                    {qrScanResult.dietRecommendations && qrScanResult.dietRecommendations.length > 0 && (
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Utensils className="h-5 w-5" />
                            Diet Recommendations ({qrScanResult.dietRecommendations.length})
                          </h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {qrScanResult.dietRecommendations.map((diet, idx) => (
                            <div key={idx} className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50">
                              <p className="text-sm text-gray-800">
                                <strong>Type:</strong> {diet.dietType} <br />
                                <strong>Instructions:</strong> {diet.specialInstructions} <br />
                                <strong>Restrictions:</strong> {diet.restrictions}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                Active from {new Date(diet.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medical Documents */}
                    {qrScanResult.medicalDocuments && qrScanResult.medicalDocuments.length > 0 && (
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <FileCheck className="h-5 w-5" />
                            Medical Documents ({qrScanResult.medicalDocuments.length})
                          </h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {qrScanResult.medicalDocuments.map((doc, idx) => (
                            <div key={idx} className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    {doc.originalName}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {(doc.fileSize / 1024).toFixed(2)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <a
                                  href={`http://localhost:5000/uploads/medical-documents/${doc.filename}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 inline-flex items-center gap-1"
                                >
                                  <Download className="h-3 w-3" />
                                  View
                                </a>
                              </div>
                              {doc.analyzedData && (
                                <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-purple-900">
                                  {doc.analyzedData.bloodGroup && (
                                    <p><strong>Blood Group:</strong> {doc.analyzedData.bloodGroup}</p>
                                  )}
                                  {doc.analyzedData.allergies && doc.analyzedData.allergies.length > 0 && (
                                    <p><strong>Allergies:</strong> {doc.analyzedData.allergies.join(", ")}</p>
                                  )}
                                  {doc.analyzedData.conditions && doc.analyzedData.conditions.length > 0 && (
                                    <p><strong>Conditions:</strong> {doc.analyzedData.conditions.join(", ")}</p>
                                  )}
                                  {doc.analyzedData.medications && doc.analyzedData.medications.length > 0 && (
                                    <p><strong>Medications:</strong> {doc.analyzedData.medications.join(", ")}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Consultation QR Scanner Modal */}
          {showQRScannerForConsultation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Scan Patient QR Code
                  </h3>
                  <button
                    onClick={() => {
                      setShowQRScannerForConsultation(false);
                      if (qrScannerInstance) {
                        qrScannerInstance.stop();
                        setQrScannerInstance(null);
                      }
                      setCameraActive(false);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Tab Selection */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setScanMode("camera")}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                        scanMode === "camera"
                          ? "bg-sky-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Camera className="h-4 w-4" />
                      Camera
                    </button>
                    <button
                      onClick={() => setScanMode("upload")}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                        scanMode === "upload"
                          ? "bg-sky-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </button>
                  </div>

                  {/* Camera Mode */}
                  {scanMode === "camera" && (
                    <div className="space-y-4">
                      {!cameraActive ? (
                        <button
                          onClick={startCameraScanner}
                          className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2 font-medium"
                        >
                          <Camera className="h-5 w-5" />
                          Start Camera
                        </button>
                      ) : (
                        <>
                          <div className="bg-black rounded-lg overflow-hidden">
                            <video ref={setVideoRef} className="w-full h-64 object-cover" />
                          </div>
                          <button
                            onClick={stopCameraScanner}
                            className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            Stop Camera
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Upload Mode */}
                  {scanMode === "upload" && (
                    <div className="bg-sky-50 rounded-xl p-6 border-2 border-dashed border-sky-200">
                      <label className="flex flex-col items-center justify-center cursor-pointer">
                        <Upload className="h-12 w-12 text-sky-400 mb-4" />
                        <p className="text-gray-700 font-medium mb-2">
                          Upload QR Code Image
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          PNG, JPG, or other image formats
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                const img = new Image();
                                img.onload = async () => {
                                  const canvas = document.createElement("canvas");
                                  canvas.width = img.width;
                                  canvas.height = img.height;
                                  const ctx = canvas.getContext("2d");
                                  ctx.drawImage(img, 0, 0);

                                  try {
                                    const result = await QrScanner.scanImage(canvas);
                                    await handleQRCodeInputForConsultation(result);
                                  } catch (err) {
                                    setQrScanError(
                                      "Could not read QR code from image. Please try another image."
                                    );
                                  }
                                };
                                img.src = event.target.result;
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          disabled={qrScannerLoading}
                          className="hidden"
                        />
                        <button
                          onClick={(e) =>
                            e.currentTarget.parentElement.querySelector(
                              'input'
                            ).click()
                          }
                          disabled={qrScannerLoading}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 font-medium"
                        >
                          {qrScannerLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Scanning...
                            </>
                          ) : (
                            <>
                              <FileCheck className="h-4 w-4" />
                              Select Image
                            </>
                          )}
                        </button>
                      </label>
                    </div>
                  )}

                  {/* Error Message */}
                  {qrScanError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{qrScanError}</span>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => {
                      setShowQRScannerForConsultation(false);
                      if (qrScannerInstance) {
                        qrScannerInstance.stop();
                        setQrScannerInstance(null);
                      }
                      setCameraActive(false);
                      setQrScanError("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QR Scanner for Patient Medical Records */}
          {showPatientQRScanner && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Scan Patient QR Code
                  </h3>
                  <button
                    onClick={() => {
                      setShowPatientQRScanner(false);
                      setScanMode("camera");
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mode Selection */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setScanMode("camera")}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                      scanMode === "camera"
                        ? "bg-sky-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <Camera className="h-4 w-4 inline mr-2" />
                    Camera
                  </button>
                  <button
                    onClick={() => setScanMode("upload")}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                      scanMode === "upload"
                        ? "bg-sky-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <Upload className="h-4 w-4 inline mr-2" />
                    Upload
                  </button>
                </div>

                {/* Camera Mode */}
                {scanMode === "camera" && (
                  <div className="space-y-3">
                    <div ref={setVideoRef} className="bg-black rounded-lg overflow-hidden mb-3" />
                    {qrScanError && (
                      <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm">
                        {qrScanError}
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        if (!videoRef) return;
                        try {
                          setQrScanningForPrescription(true);
                          const scanner = new QrScanner(
                            videoRef,
                            (result) => {
                              handleScanPatientQR(result.data);
                              scanner.stop();
                            },
                            { onDecodeError: (error) => setQrScanError(error.message) }
                          );
                          await scanner.start();
                          setQrScannerInstance(scanner);
                        } catch (error) {
                          setQrScanError(error.message);
                        } finally {
                          setQrScanningForPrescription(false);
                        }
                      }}
                      disabled={qrScanningForPrescription}
                      className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {qrScanningForPrescription ? "Starting..." : "Start Camera"}
                    </button>
                  </div>
                )}

                {/* Upload Mode */}
                {scanMode === "upload" && (
                  <div className="space-y-3">
                    <label className="block">
                      <div className="border-2 border-dashed border-sky-300 rounded-lg p-6 text-center cursor-pointer hover:border-sky-500 transition-colors">
                        <Upload className="h-8 w-8 text-sky-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-700">Click to upload QR image</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setQrScanningForPrescription(true);
                            const result = await QrScanner.scanImage(file);
                            handleScanPatientQR(result);
                          } catch (error) {
                            alert("Could not scan QR code from image");
                          } finally {
                            setQrScanningForPrescription(false);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowPatientQRScanner(false);
                    setScanMode("camera");
                  }}
                  className="w-full mt-4 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* AI Prescription Modal - Hospital Template */}
          {showAIPrescriptionModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-xl w-full max-w-5xl my-8 shadow-2xl">
                {/* Hospital Header */}
                <div className="sticky top-0 bg-gradient-to-r from-sky-600 to-blue-700 text-white p-6 rounded-t-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h1 className="text-3xl font-bold">🏥 IIIT Hospital</h1>
                      <p className="text-sky-100">Medical Prescription System</p>
                      <p className="text-sm text-sky-200 mt-1">RGUKT Campus, Telangana</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAIPrescriptionModal(false);
                        setPatientMedicalRecords(null);
                      }}
                      className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-sky-200">Patient</p>
                      <p className="font-semibold">{selectedAppointment?.student?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sky-200">Student ID</p>
                      <p className="font-semibold">{selectedAppointment?.studentDetails?.studentId || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sky-200">Doctor</p>
                      <p className="font-semibold">Dr. {user?.name || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-sky-200">Date</p>
                      <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Prescription Content */}
                {selectedAppointment && (
                  <div className="p-8 max-h-[70vh] overflow-y-auto">
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 AI-Assisted Prescription Writer</h3>
                      <p className="text-xs text-blue-800">
                        Start typing a medicine name and press TAB for AI-powered autocomplete. The system will fill in dosage, frequency, and duration automatically using Groq LLM.
                      </p>
                    </div>

                    {/* Patient Medical Records Summary */}
                    {patientMedicalRecords && (
                      <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Patient Medical Context Loaded
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-yellow-800">Allergies: <span className="font-semibold">{patientMedicalRecords.allergies?.join(", ") || "None known"}</span></p>
                          </div>
                          <div>
                            <p className="text-yellow-800">Previous Conditions: <span className="font-semibold">{patientMedicalRecords.diagnoses?.length || 0} records</span></p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Main Prescription Component */}
                    <Prescription
                      appointment={selectedAppointment}
                      patientData={patientMedicalRecords}
                      doctorName={user?.name || "Dr. Unknown"}
                      doctorDepartment={user?.department || "Internal Medicine"}
                      hospitalName="IIIT Hospital"
                      onSave={handleSaveAIPrescription}
                    />
                  </div>
                )}

                {/* Footer */}
                <div className="bg-gray-50 p-4 border-t border-gray-200 rounded-b-xl text-center text-xs text-gray-600">
                  <p>✓ AI-Assisted Prescription • Auto-save to Medical Records • Email Notification Sent</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;
