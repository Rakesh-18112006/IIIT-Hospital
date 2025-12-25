import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Navbar from '../components/Navbar';
import {
  Utensils,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const MessDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [diets, setDiets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDiet, setExpandedDiet] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, dietsRes] = await Promise.all([
        api.get('/mess/stats'),
        api.get('/mess/diets')
      ]);
      setStats(statsRes.data);
      setDiets(dietsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDiet = async (dietId, status) => {
    try {
      await api.put(`/mess/diets/${dietId}`, { status });
      fetchData();
    } catch (error) {
      console.error('Error updating diet:', error);
    }
  };

  const filteredDiets = diets.filter(diet => {
    const matchesFilter = filter === 'all' || diet.dietType === filter;
    const matchesSearch = diet.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          diet.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pieData = [
    { name: 'Normal', value: stats?.normal || 0, color: '#22c55e' },
    { name: 'Light', value: stats?.light || 0, color: '#f59e0b' },
    { name: 'Special', value: stats?.special || 0, color: '#8b5cf6' }
  ];

  const getDietTypeStyle = (type) => {
    const styles = {
      normal: 'bg-green-100 text-green-700 border-green-200',
      light: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      special: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return styles[type] || 'bg-gray-100 text-gray-700 border-gray-200';
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

  return (
    <div className="min-h-screen bg-sky-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mess Dashboard</h1>
          <p className="text-gray-500">Manage student diet recommendations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-sky-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-100 rounded-lg">
                <Users className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stats?.total || 0}</p>
                <p className="text-sm text-gray-500">Total Active</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{stats?.normal || 0}</p>
                <p className="text-sm text-gray-500">Normal Diet</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-yellow-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Utensils className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-600">{stats?.light || 0}</p>
                <p className="text-sm text-gray-500">Light Diet</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600">{stats?.special || 0}</p>
                <p className="text-sm text-gray-500">Special Diet</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-sky-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Diet Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Diet List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-sky-100">
            <div className="p-4 border-b border-sky-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Diet Recommendations</h3>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or ID..."
                    className="w-full pl-10 pr-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'normal', 'light', 'special'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === type
                          ? 'bg-sky-500 text-white'
                          : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {filteredDiets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No diet recommendations found</p>
                </div>
              ) : (
                <div className="divide-y divide-sky-50">
                  {filteredDiets.map((diet) => (
                    <div key={diet._id} className="p-4 hover:bg-sky-50 transition-colors">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedDiet(expandedDiet === diet._id ? null : diet._id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            diet.dietType === 'special' ? 'bg-purple-100' :
                            diet.dietType === 'light' ? 'bg-yellow-100' : 'bg-green-100'
                          }`}>
                            <Utensils className={`h-5 w-5 ${
                              diet.dietType === 'special' ? 'text-purple-600' :
                              diet.dietType === 'light' ? 'text-yellow-600' : 'text-green-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{diet.student?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{diet.student?.studentId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDietTypeStyle(diet.dietType)}`}>
                            {diet.dietType.charAt(0).toUpperCase() + diet.dietType.slice(1)}
                          </span>
                          {expandedDiet === diet._id ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expandedDiet === diet._id && (
                        <div className="mt-4 pl-13 space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-500">Start Date</p>
                              <p className="font-medium">{new Date(diet.startDate).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-500">End Date</p>
                              <p className="font-medium">{new Date(diet.endDate).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {diet.specialInstructions && (
                            <div className="bg-sky-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-sky-700 mb-1">Instructions:</p>
                              <p className="text-sm text-gray-700">{diet.specialInstructions}</p>
                            </div>
                          )}

                          {diet.restrictions && diet.restrictions.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Restrictions:</p>
                              <div className="flex flex-wrap gap-2">
                                {diet.restrictions.map((r, i) => (
                                  <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm">
                                    ❌ {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateDiet(diet._id, 'completed');
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Mark Complete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 bg-sky-50 border border-sky-200 rounded-xl p-4">
          <p className="text-sm text-sky-700">
            <strong>Privacy Notice:</strong> This dashboard only shows diet recommendations. 
            Medical symptoms, diagnoses, and treatment details are not accessible from this view.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessDashboard;
