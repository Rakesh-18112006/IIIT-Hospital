import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
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
} from "lucide-react";

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

                        {/* Prescription */}
                        <div>
                          <label className="font-semibold text-gray-800 block mb-2">
                            Prescription
                          </label>
                          <textarea
                            value={prescription}
                            onChange={(e) => setPrescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                            placeholder="Add prescription..."
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="p-4 border-t border-sky-100 bg-gray-50">
                        <div className="flex flex-wrap gap-2">
                          {selectedAppointment.status === "pending" && (
                            <button
                              onClick={() =>
                                handleUpdateAppointmentStatus(
                                  selectedAppointment._id,
                                  "confirmed"
                                )
                              }
                              disabled={statusUpdateLoading}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Confirm
                            </button>
                          )}
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
                              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
                            >
                              <Play className="h-4 w-4" />
                              Start Consultation
                            </button>
                          )}
                          {selectedAppointment.status === "in-progress" && (
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
                              Complete
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

                          {/* Priority Adjustment */}
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              Adjust Priority:
                            </span>
                            <select
                              value={selectedAppointment.severity}
                              onChange={(e) => {
                                const newSeverity = e.target.value;
                                const riskScores = {
                                  critical: 90,
                                  high: 60,
                                  medium: 35,
                                  low: 15,
                                };
                                handleUpdateAppointmentPriority(
                                  selectedAppointment._id,
                                  newSeverity,
                                  riskScores[newSeverity],
                                  "Manual adjustment by doctor"
                                );
                              }}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="critical">Critical</option>
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
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
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Prescription
                            </label>
                            <textarea
                              value={prescription}
                              onChange={(e) => setPrescription(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                              placeholder="Enter prescription..."
                            />
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
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;
