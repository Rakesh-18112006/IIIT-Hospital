import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
import Navbar from "../components/Navbar";
import {
  Users,
  AlertCircle,
  Activity,
  BedDouble,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  BarChart3,
  CalendarClock,
  RefreshCw,
  Stethoscope,
  Brain,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Appointment monitoring state
  const [allAppointments, setAllAppointments] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [allQueues, setAllQueues] = useState([]);
  const [aiAnalytics, setAIAnalytics] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === "appointments" || activeTab === "ai-analytics") {
      fetchAppointmentData();
    }
  }, [activeTab, appointmentDate]);

  const fetchData = async () => {
    try {
      const [statsRes, reportRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/weekly-report"),
      ]);
      setStats(statsRes.data);
      setWeeklyReport(reportRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentData = async () => {
    setAppointmentsLoading(true);
    try {
      const [appointmentsRes, queuesRes, analyticsRes] = await Promise.all([
        api.get("/appointments/admin/all", {
          params: { date: appointmentDate },
        }),
        api.get("/appointments/admin/queues", {
          params: { date: appointmentDate },
        }),
        api.get("/appointments/admin/analytics"),
      ]);
      setAllAppointments(appointmentsRes.data.appointments || []);
      setAppointmentStats(appointmentsRes.data.stats);
      setAllQueues(queuesRes.data || []);
      setAIAnalytics(analyticsRes.data);
    } catch (error) {
      console.error("Error fetching appointment data:", error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    const styles = {
      critical: "bg-red-100 text-red-700",
      high: "bg-orange-100 text-orange-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-green-100 text-green-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[severity] || styles.low
        }`}
      >
        {severity}
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
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        </div>
      </div>
    );
  }

  const severityData = [
    {
      name: "Critical",
      value: stats?.severityStats?.red || 0,
      color: "#ef4444",
    },
    {
      name: "Moderate",
      value: stats?.severityStats?.orange || 0,
      color: "#f97316",
    },
    {
      name: "Normal",
      value: stats?.severityStats?.green || 0,
      color: "#22c55e",
    },
  ];

  const bedData = [
    {
      name: "Occupied",
      value: stats?.bedUsage?.occupied || 0,
      color: "#0ea5e9",
    },
    {
      name: "Available",
      value: stats?.bedUsage?.available || 0,
      color: "#e2e8f0",
    },
  ];

  return (
    <div className="min-h-screen bg-sky-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Hospital Admin Dashboard
            </h1>
            <p className="text-gray-500">Overview of hospital operations</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm border border-sky-100">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              {
                id: "appointments",
                label: "Appointments",
                icon: CalendarClock,
              },
              { id: "ai-analytics", label: "AI Analytics", icon: Brain },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-sky-500 text-white"
                    : "text-gray-600 hover:bg-sky-50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Top Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-sky-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-100 rounded-lg">
                    <Users className="h-6 w-6 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">
                      {stats?.totalPatientsToday || 0}
                    </p>
                    <p className="text-sm text-gray-500">Patients Today</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-600">
                      {stats?.severityStats?.red || 0}
                    </p>
                    <p className="text-sm text-gray-500">Critical Cases</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-600">
                      {weeklyReport?.completionRate || 0}%
                    </p>
                    <p className="text-sm text-gray-500">Completion Rate</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-purple-600">
                      {weeklyReport?.leavesIssued || 0}
                    </p>
                    <p className="text-sm text-gray-500">Leaves This Week</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Severity Distribution */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-sky-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Severity Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bed Usage */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-sky-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Bed Availability
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bedData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {bedData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm text-gray-500">
                    {stats?.bedUsage?.occupied} / {stats?.bedUsage?.totalBeds}{" "}
                    beds occupied
                  </p>
                </div>
              </div>

              {/* Weekly Summary */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-sky-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Weekly Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-sky-50 rounded-lg">
                    <span className="text-gray-600">Total Patients</span>
                    <span className="font-semibold text-sky-600">
                      {weeklyReport?.totalPatients || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-semibold text-green-600">
                      {weeklyReport?.completedCases || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-gray-600">Referrals</span>
                    <span className="font-semibold text-purple-600">
                      {weeklyReport?.referrals || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-gray-600">Leaves Issued</span>
                    <span className="font-semibold text-yellow-600">
                      {weeklyReport?.leavesIssued || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Patients Trend */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-sky-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Daily Patient Trend (7 Days)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.dailyPatients || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="_id"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-US", {
                            weekday: "short",
                          });
                        }}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString()
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={{ fill: "#0ea5e9" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Disease Trends */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-sky-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Top Symptoms (7 Days)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(stats?.diseaseTrends || []).slice(0, 5)}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="_id"
                        type="category"
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#0ea5e9"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Doctor Workload */}
            <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-sky-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Doctor Workload Today
              </h3>
              {stats?.doctorWorkload?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-sky-100">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                          Doctor
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">
                          Patients Handled
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">
                          Completed
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">
                          Completion Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.doctorWorkload.map((doc, i) => (
                        <tr
                          key={i}
                          className="border-b border-sky-50 hover:bg-sky-50"
                        >
                          <td className="py-3 px-4 font-medium text-gray-800">
                            {doc.doctorName}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-600">
                            {doc.patientsHandled}
                          </td>
                          <td className="py-3 px-4 text-center text-green-600">
                            {doc.completed}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-sm">
                              {doc.patientsHandled > 0
                                ? Math.round(
                                    (doc.completed / doc.patientsHandled) * 100
                                  )
                                : 0}
                              %
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No doctor activity today</p>
                </div>
              )}
            </div>

            {/* Privacy Notice */}
            <div className="mt-6 bg-sky-50 border border-sky-200 rounded-xl p-4">
              <p className="text-sm text-sky-700">
                <strong>Privacy Notice:</strong> This dashboard shows aggregate
                statistics only. Individual patient details and diagnoses are
                not displayed to maintain privacy compliance.
              </p>
            </div>
          </>
        )}

        {/* Appointments Tab */}
        {activeTab === "appointments" && (
          <div className="space-y-6">
            {/* Date Selector & Stats */}
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
                  onClick={fetchAppointmentData}
                  disabled={appointmentsLoading}
                  className="px-4 py-2 text-sky-600 hover:bg-sky-50 rounded-lg flex items-center gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      appointmentsLoading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
              </div>
              {appointmentStats && (
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-gray-600">
                    Total: <strong>{appointmentStats.total}</strong>
                  </span>
                  <span className="text-red-600">
                    Critical:{" "}
                    <strong>
                      {appointmentStats.bySeverity?.critical || 0}
                    </strong>
                  </span>
                  <span className="text-orange-600">
                    High:{" "}
                    <strong>{appointmentStats.bySeverity?.high || 0}</strong>
                  </span>
                  <span className="text-yellow-600">
                    Medium:{" "}
                    <strong>{appointmentStats.bySeverity?.medium || 0}</strong>
                  </span>
                  <span className="text-green-600">
                    Low:{" "}
                    <strong>{appointmentStats.bySeverity?.low || 0}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Doctor Queues */}
            <div className="bg-white rounded-xl shadow-sm border border-sky-100">
              <div className="p-4 border-b border-sky-100">
                <h2 className="text-lg font-semibold text-gray-800">
                  All Doctor Queues
                </h2>
              </div>

              {appointmentsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                </div>
              ) : allQueues.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Stethoscope className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No doctor queues found</p>
                </div>
              ) : (
                <div className="divide-y divide-sky-100">
                  {allQueues.map((queueData) => (
                    <div key={queueData.doctor._id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                            <Stethoscope className="h-5 w-5 text-sky-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              Dr. {queueData.doctor.name?.replace("Dr. ", "")}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {queueData.doctor.department || "General"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full">
                            {queueData.appointments.length} appointments
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full ${
                              queueData.queue.isAvailable
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {queueData.queue.isAvailable ? "Available" : "Busy"}
                          </span>
                        </div>
                      </div>

                      {queueData.appointments.length > 0 && (
                        <div className="ml-13 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b border-gray-100">
                                <th className="pb-2 font-medium">#</th>
                                <th className="pb-2 font-medium">Patient</th>
                                <th className="pb-2 font-medium">Time</th>
                                <th className="pb-2 font-medium">Severity</th>
                                <th className="pb-2 font-medium">Risk Score</th>
                                <th className="pb-2 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {queueData.appointments.map((apt, idx) => (
                                <tr
                                  key={apt._id}
                                  className="border-b border-gray-50"
                                >
                                  <td className="py-2 text-gray-500">
                                    {idx + 1}
                                  </td>
                                  <td className="py-2 font-medium">
                                    {apt.student?.name || "N/A"}
                                  </td>
                                  <td className="py-2">{apt.slotTime}</td>
                                  <td className="py-2">
                                    {getSeverityBadge(apt.severity)}
                                  </td>
                                  <td className="py-2">
                                    <span className="font-semibold text-sky-600">
                                      {apt.riskScore}
                                    </span>
                                    /100
                                  </td>
                                  <td className="py-2">
                                    {getStatusBadge(apt.status)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Appointments Table */}
            <div className="bg-white rounded-xl shadow-sm border border-sky-100">
              <div className="p-4 border-b border-sky-100">
                <h2 className="text-lg font-semibold text-gray-800">
                  All Appointments ({allAppointments.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sky-100 bg-sky-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Patient
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Doctor
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Time
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Severity
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Risk Score
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Health Problem
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAppointments.map((apt) => (
                      <tr
                        key={apt._id}
                        className="border-b border-sky-50 hover:bg-sky-50"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-800">
                              {apt.student?.name || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {apt.student?.studentId}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          Dr. {apt.doctor?.name?.replace("Dr. ", "")}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {apt.slotTime}
                        </td>
                        <td className="py-3 px-4">
                          {getSeverityBadge(apt.severity)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  apt.riskScore >= 80
                                    ? "bg-red-500"
                                    : apt.riskScore >= 50
                                    ? "bg-orange-500"
                                    : apt.riskScore >= 25
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{ width: `${apt.riskScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {apt.riskScore}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(apt.status)}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-gray-500 text-sm">
                          {apt.healthProblem}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AI Analytics Tab */}
        {activeTab === "ai-analytics" && (
          <div className="space-y-6">
            {/* AI Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-sky-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-100 rounded-lg">
                    <Brain className="h-6 w-6 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">
                      {aiAnalytics?.totalAnalyzed || 0}
                    </p>
                    <p className="text-sm text-gray-500">Total Analyzed</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-purple-600">
                      {aiAnalytics?.averageRiskScore || 0}
                    </p>
                    <p className="text-sm text-gray-500">Avg Risk Score</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-orange-600">
                      {aiAnalytics?.priorityChanges || 0}
                    </p>
                    <p className="text-sm text-gray-500">Priority Changes</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-600">
                      {aiAnalytics?.severityDistribution?.critical || 0}
                    </p>
                    <p className="text-sm text-gray-500">Critical Cases</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Severity Distribution Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-sky-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  AI Severity Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Critical",
                            value:
                              aiAnalytics?.severityDistribution?.critical || 0,
                            color: "#ef4444",
                          },
                          {
                            name: "High",
                            value: aiAnalytics?.severityDistribution?.high || 0,
                            color: "#f97316",
                          },
                          {
                            name: "Medium",
                            value:
                              aiAnalytics?.severityDistribution?.medium || 0,
                            color: "#eab308",
                          },
                          {
                            name: "Low",
                            value: aiAnalytics?.severityDistribution?.low || 0,
                            color: "#22c55e",
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: "Critical", color: "#ef4444" },
                          { name: "High", color: "#f97316" },
                          { name: "Medium", color: "#eab308" },
                          { name: "Low", color: "#22c55e" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Common Conditions */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-sky-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Top Detected Conditions
                </h3>
                <div className="space-y-3">
                  {(aiAnalytics?.commonConditions || [])
                    .slice(0, 8)
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-700">{item.condition}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-sky-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (item.count /
                                    (aiAnalytics?.commonConditions?.[0]
                                      ?.count || 1)) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600 w-8 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Daily Breakdown Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-sky-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Daily Priority Breakdown (7 Days)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aiAnalytics?.dailyBreakdown || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          weekday: "short",
                        })
                      }
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="critical"
                      stackId="a"
                      fill="#ef4444"
                      name="Critical"
                    />
                    <Bar
                      dataKey="high"
                      stackId="a"
                      fill="#f97316"
                      name="High"
                    />
                    <Bar
                      dataKey="medium"
                      stackId="a"
                      fill="#eab308"
                      name="Medium"
                    />
                    <Bar dataKey="low" stackId="a" fill="#22c55e" name="Low" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Prioritization Info */}
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
              <h4 className="font-semibold text-sky-800 mb-2 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Prioritization System
              </h4>
              <p className="text-sm text-sky-700 mb-3">
                The AI system analyzes patient health problem descriptions to
                automatically prioritize appointments. It detects critical
                keywords, urgency indicators, and conditions to assign risk
                scores (0-100).
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="font-medium">Critical (80-100)</span>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Immediate attention required
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="font-medium">High (50-79)</span>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Urgent consultation needed
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="font-medium">Medium (25-49)</span>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Schedule appointment soon
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-medium">Low (0-24)</span>
                  </div>
                  <p className="text-gray-500 text-xs">Routine consultation</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
