import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Navbar from '../components/Navbar';
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
  Plus
} from 'lucide-react';

const SYMPTOMS_LIST = [
  'fever', 'cold', 'cough', 'headache', 'body aches', 'weakness',
  'fatigue', 'nausea', 'vomiting', 'diarrhea', 'stomach ache',
  'chest pain', 'difficulty breathing', 'dizziness', 'sore throat',
  'runny nose', 'loss of appetite', 'skin irritation', 'allergies'
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('submit');
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [diets, setDiets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Symptom form state
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [description, setDescription] = useState('');
  const [customSymptom, setCustomSymptom] = useState('');
  const [vitals, setVitals] = useState({
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    oxygenLevel: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsRes, leavesRes, dietsRes] = await Promise.all([
        api.get('/patient/my-records'),
        api.get('/patient/my-leaves'),
        api.get('/patient/my-diet')
      ]);
      setRecords(recordsRes.data);
      setLeaves(leavesRes.data);
      setDiets(dietsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAddCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms(prev => [...prev, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleSubmitSymptoms = async (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) return;

    setSubmitLoading(true);
    try {
      const vitalsData = {};
      if (vitals.temperature) vitalsData.temperature = parseFloat(vitals.temperature);
      if (vitals.bloodPressure) vitalsData.bloodPressure = vitals.bloodPressure;
      if (vitals.heartRate) vitalsData.heartRate = parseInt(vitals.heartRate);
      if (vitals.oxygenLevel) vitalsData.oxygenLevel = parseInt(vitals.oxygenLevel);

      await api.post('/patient/symptoms', {
        symptoms: selectedSymptoms,
        symptomDescription: description,
        vitals: Object.keys(vitalsData).length > 0 ? vitalsData : undefined
      });

      setSubmitSuccess(true);
      setSelectedSymptoms([]);
      setDescription('');
      setVitals({ temperature: '', bloodPressure: '', heartRate: '', oxygenLevel: '' });
      fetchData();
      
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting symptoms:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    const styles = {
      red: 'bg-red-100 text-red-700 border-red-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      green: 'bg-green-100 text-green-700 border-green-200'
    };
    const labels = { red: 'Critical', orange: 'Moderate', green: 'Normal' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[severity]}`}>
        {labels[severity]}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      waiting: 'bg-yellow-100 text-yellow-700',
      in_consultation: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      referred: 'bg-purple-100 text-purple-700'
    };
    const labels = {
      waiting: 'Waiting',
      in_consultation: 'In Consultation',
      completed: 'Completed',
      referred: 'Referred'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-sky-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name}</p>
        </div>

        {/* Emergency Button */}
        <div className="mb-6">
          <a
            href="tel:108"
            className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium shadow-lg"
          >
            <Phone className="h-5 w-5" />
            Emergency: Call 108
          </a>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-lg shadow-sm">
          {[
            { id: 'submit', label: 'Submit Symptoms', icon: Send },
            { id: 'records', label: 'My Records', icon: FileText },
            { id: 'leaves', label: 'Medical Leaves', icon: Calendar },
            { id: 'diet', label: 'Diet Plan', icon: Utensils }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-white'
                  : 'text-gray-600 hover:bg-sky-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Submit Symptoms Tab */}
          {activeTab === 'submit' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Submit Your Symptoms</h2>
              
              {submitSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Symptoms submitted successfully! You've been added to the queue.
                </div>
              )}

              <form onSubmit={handleSubmitSymptoms} className="space-y-6">
                {/* Symptoms Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select your symptoms *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SYMPTOMS_LIST.map(symptom => (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => handleSymptomToggle(symptom)}
                        className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                          selectedSymptoms.includes(symptom)
                            ? 'bg-sky-500 text-white'
                            : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
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
                      {selectedSymptoms.map(symptom => (
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
                      onChange={(e) => setVitals({...vitals, temperature: e.target.value})}
                      placeholder="Temp (°F)"
                      className="px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                    />
                    <input
                      type="text"
                      value={vitals.bloodPressure}
                      onChange={(e) => setVitals({...vitals, bloodPressure: e.target.value})}
                      placeholder="BP (120/80)"
                      className="px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                    />
                    <input
                      type="number"
                      value={vitals.heartRate}
                      onChange={(e) => setVitals({...vitals, heartRate: e.target.value})}
                      placeholder="Heart Rate"
                      className="px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                    />
                    <input
                      type="number"
                      value={vitals.oxygenLevel}
                      onChange={(e) => setVitals({...vitals, oxygenLevel: e.target.value})}
                      placeholder="SpO2 (%)"
                      className="px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={selectedSymptoms.length === 0 || submitLoading}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 font-medium"
                >
                  <Send className="h-5 w-5" />
                  {submitLoading ? 'Submitting...' : 'Submit Symptoms'}
                </button>
              </form>
            </div>
          )}

          {/* Records Tab */}
          {activeTab === 'records' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">My Medical Records</h2>
              
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
                  {records.map(record => (
                    <div key={record._id} className="border border-sky-100 rounded-lg p-4 hover:border-sky-300 transition-colors">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                        <div className="flex gap-2">
                          {getSeverityBadge(record.severity)}
                          {getStatusBadge(record.status)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Symptoms:</p>
                        <div className="flex flex-wrap gap-1">
                          {record.symptoms.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-sm">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {record.advice && (
                        <div className="mt-3 p-3 bg-sky-50 rounded-lg">
                          <p className="text-sm font-medium text-sky-700 mb-1">Doctor's Advice:</p>
                          <p className="text-sm text-gray-700">{record.advice}</p>
                        </div>
                      )}

                      {record.prescription && (
                        <div className="mt-2 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-700 mb-1">Prescription:</p>
                          <p className="text-sm text-gray-700">{record.prescription}</p>
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
          {activeTab === 'leaves' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Medical Leaves</h2>
              
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
                  {leaves.map(leave => (
                    <div key={leave._id} className="border border-sky-100 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          leave.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {leave.status === 'active' ? 'Active' : 'Completed'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Start Date</p>
                          <p className="font-medium">{new Date(leave.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">End Date</p>
                          <p className="font-medium">{new Date(leave.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="bg-sky-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-sky-700 mb-1">Reason:</p>
                        <p className="text-sm text-gray-700">{leave.reason}</p>
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
          {activeTab === 'diet' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Diet Recommendations</h2>
              
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
                  {diets.map(diet => (
                    <div key={diet._id} className="border border-sky-100 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          diet.dietType === 'special' 
                            ? 'bg-purple-100 text-purple-700'
                            : diet.dietType === 'light'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {diet.dietType.charAt(0).toUpperCase() + diet.dietType.slice(1)} Diet
                        </span>
                        <span className="text-sm text-gray-500">
                          Until {new Date(diet.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {diet.specialInstructions && (
                        <div className="bg-sky-50 p-3 rounded-lg mb-3">
                          <p className="text-sm font-medium text-sky-700 mb-1">Instructions:</p>
                          <p className="text-sm text-gray-700">{diet.specialInstructions}</p>
                        </div>
                      )}
                      
                      {diet.restrictions && diet.restrictions.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Restrictions:</p>
                          <div className="flex flex-wrap gap-1">
                            {diet.restrictions.map((r, i) => (
                              <span key={i} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-sm">
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
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
