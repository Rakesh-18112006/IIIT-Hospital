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

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

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
                {activeTab === "consultation" && "Patient Consultation"}
              </h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                {activeTab === "queue" &&
                  `${queueStats.total} patients waiting`}
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

          {/* Main Grid */}
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
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;
