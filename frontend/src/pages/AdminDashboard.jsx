import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Navbar from '../components/Navbar';
import {
  Users,
  AlertCircle,
  Activity,
  BedDouble,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  BarChart3
} from 'lucide-react';
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
  Legend
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, reportRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/weekly-report')
      ]);
      setStats(statsRes.data);
      setWeeklyReport(reportRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
    { name: 'Critical', value: stats?.severityStats?.red || 0, color: '#ef4444' },
    { name: 'Moderate', value: stats?.severityStats?.orange || 0, color: '#f97316' },
    { name: 'Normal', value: stats?.severityStats?.green || 0, color: '#22c55e' }
  ];

  const bedData = [
    { name: 'Occupied', value: stats?.bedUsage?.occupied || 0, color: '#0ea5e9' },
    { name: 'Available', value: stats?.bedUsage?.available || 0, color: '#e2e8f0' }
  ];

  return (
    <div className="min-h-screen bg-sky-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Hospital Admin Dashboard</h1>
          <p className="text-gray-500">Overview of hospital operations</p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-sky-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-100 rounded-lg">
                <Users className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stats?.totalPatientsToday || 0}</p>
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
                <p className="text-3xl font-bold text-red-600">{stats?.severityStats?.red || 0}</p>
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
                <p className="text-3xl font-bold text-green-600">{weeklyReport?.completionRate || 0}%</p>
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
                <p className="text-3xl font-bold text-purple-600">{weeklyReport?.leavesIssued || 0}</p>
                <p className="text-sm text-gray-500">Leaves This Week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Severity Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-sky-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Severity Distribution</h3>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Bed Availability</h3>
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
                {stats?.bedUsage?.occupied} / {stats?.bedUsage?.totalBeds} beds occupied
              </p>
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-sky-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-sky-50 rounded-lg">
                <span className="text-gray-600">Total Patients</span>
                <span className="font-semibold text-sky-600">{weeklyReport?.totalPatients || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{weeklyReport?.completedCases || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-600">Referrals</span>
                <span className="font-semibold text-purple-600">{weeklyReport?.referrals || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-gray-600">Leaves Issued</span>
                <span className="font-semibold text-yellow-600">{weeklyReport?.leavesIssued || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Patients Trend */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-sky-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Patient Trend (7 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.dailyPatients || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="_id" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { weekday: 'short' });
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#0ea5e9" 
                    strokeWidth={2}
                    dot={{ fill: '#0ea5e9' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Disease Trends */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-sky-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Symptoms (7 Days)</h3>
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
                  <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Doctor Workload */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-sky-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Doctor Workload Today</h3>
          {stats?.doctorWorkload?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sky-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Doctor</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Patients Handled</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Completed</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.doctorWorkload.map((doc, i) => (
                    <tr key={i} className="border-b border-sky-50 hover:bg-sky-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{doc.doctorName}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{doc.patientsHandled}</td>
                      <td className="py-3 px-4 text-center text-green-600">{doc.completed}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-sm">
                          {doc.patientsHandled > 0 
                            ? Math.round((doc.completed / doc.patientsHandled) * 100) 
                            : 0}%
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
            <strong>Privacy Notice:</strong> This dashboard shows aggregate statistics only. 
            Individual patient details and diagnoses are not displayed to maintain privacy compliance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
