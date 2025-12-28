import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Pill,
  Clock,
  Zap,
  Check,
  AlertTriangle,
  Eye,
  Printer,
} from 'lucide-react';
import {
  getMedicineSuggestions,
  getMedicineSuggestion,
  checkMedicineInteractions,
  isGroqConfigured,
} from '../utils/groqService';

const MEDICINE_DATABASE = [
  // Common medicines with availability status
  { name: 'Paracetamol 500mg', availability: 'available', alternatives: ['Ibuprofen 400mg'] },
  { name: 'Ibuprofen 400mg', availability: 'available', alternatives: ['Paracetamol 500mg'] },
  { name: 'Cetirizine 10mg', availability: 'available', alternatives: ['Fexofenadine 120mg'] },
  { name: 'Amoxicillin 500mg', availability: 'available', alternatives: ['Azithromycin 500mg'] },
  { name: 'Omeprazole 20mg', availability: 'available', alternatives: ['Ranitidine 150mg'] },
  { name: 'Atorvastatin 10mg', availability: 'low-stock', alternatives: ['Simvastatin 10mg'] },
  { name: 'Metformin 500mg', availability: 'available', alternatives: ['Glipizide 5mg'] },
  { name: 'Aspirin 75mg', availability: 'available', alternatives: ['Clopidogrel 75mg'] },
  { name: 'Lisinopril 10mg', availability: 'available', alternatives: ['Enalapril 10mg'] },
  { name: 'Amlodipine 5mg', availability: 'available', alternatives: ['Nifedipine 20mg'] },
];

const DOSAGE_SUGGESTIONS = {
  'morning': '7:00 AM',
  'noon': '1:00 PM',
  'evening': '6:00 PM',
  'night': '10:00 PM',
  'bedtime': '10:00 PM',
};

const Prescription = ({ 
  appointment, 
  patientData,
  onSave,
  doctorName,
  doctorDepartment,
  hospitalName = "IIIT Hospital"
}) => {
  const [medicines, setMedicines] = useState([]);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    timings: [], // Array of times: morning, noon, evening, night
  });
  
  const [medicineSuggestions, setMedicineSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedMedicineIndex, setSelectedMedicineIndex] = useState(null);
  const [medicineTimingSuggestions, setMedicineTimingSuggestions] = useState(null);
  const [loadingTimingSuggestions, setLoadingTimingSuggestions] = useState(false);
  const [groqConfigured, setGroqConfigured] = useState(true);
  
  const [notes, setNotes] = useState('');
  const [advice, setAdvice] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  
  const [interactions, setInteractions] = useState(null);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const medicineInputRef = useRef(null);

  // Check Groq configuration on mount
  useEffect(() => {
    isGroqConfigured().then(setGroqConfigured);
  }, []);

  // Fetch medicine suggestions when user types
  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (newMedicine.name.length >= 2) {
        setLoadingSuggestions(true);
        try {
          const suggestions = await getMedicineSuggestions(
            newMedicine.name,
            patientData?.age,
            patientData?.gender,
            patientData?.symptoms
          );
          setMedicineSuggestions(suggestions || []);
          setShowSuggestions(suggestions && suggestions.length > 0);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setMedicineSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      } else {
        setMedicineSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [newMedicine.name, patientData]);

  // Check for medicine interactions when medicines change
  useEffect(() => {
    if (medicines.length > 1 && groqConfigured) {
      const medicinesList = medicines.map(m => ({
        name: m.name,
        dosage: m.dosage
      }));
      
      checkMedicineInteractions(medicinesList)
        .then(result => setInteractions(result))
        .catch(err => console.error('Error checking interactions:', err));
    }
  }, [medicines, groqConfigured]);

  const handleMedicineNameChange = (e) => {
    const value = e.target.value;
    setNewMedicine({ ...newMedicine, name: value });
  };

  const handleMedicineKeyDown = (e) => {
    if (e.key === 'Tab' && newMedicine.name && medicineSuggestions.length > 0) {
      e.preventDefault();
      
      // Auto-complete with first suggestion
      const suggestion = medicineSuggestions[0];
      setNewMedicine({
        ...newMedicine,
        name: suggestion.fullName || suggestion.name,
        dosage: suggestion.dosage || newMedicine.dosage,
        frequency: suggestion.frequency || newMedicine.frequency,
        duration: suggestion.duration || newMedicine.duration,
        instructions: suggestion.instructions || newMedicine.instructions,
      });
      
      setShowSuggestions(false);
      
      // Get timing suggestions
      if (groqConfigured) {
        setLoadingTimingSuggestions(true);
        getMedicineSuggestion(
          suggestion.fullName || suggestion.name,
          patientData?.age,
          patientData?.gender,
          patientData?.symptoms?.join(', ')
        )
        .then(suggestion => {
          if (suggestion?.frequency) {
            setMedicineTimingSuggestions(suggestion);
          }
        })
        .finally(() => setLoadingTimingSuggestions(false));
      }
    } else if (e.key === 'Enter' && newMedicine.name && newMedicine.dosage) {
      e.preventDefault();
      addMedicine();
    }
  };

  const selectMedicineSuggestion = (suggestion) => {
    setNewMedicine({
      ...newMedicine,
      name: suggestion.fullName || suggestion.name,
      dosage: suggestion.dosage || newMedicine.dosage,
      frequency: suggestion.frequency || newMedicine.frequency,
      duration: suggestion.duration || newMedicine.duration,
      instructions: suggestion.instructions || newMedicine.instructions,
    });
    setShowSuggestions(false);
  };

  const addMedicine = () => {
    if (!newMedicine.name || !newMedicine.dosage) {
      alert('Please enter medicine name and dosage');
      return;
    }

    setMedicines([...medicines, { ...newMedicine, id: Date.now() }]);
    setNewMedicine({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      timings: [],
    });
    setShowSuggestions(false);
    medicineInputRef.current?.focus();
  };

  const removeMedicine = (id) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  const toggleMedicineTiming = (medicineId, timing) => {
    setMedicines(medicines.map(m => {
      if (m.id === medicineId) {
        const timings = m.timings.includes(timing)
          ? m.timings.filter(t => t !== timing)
          : [...m.timings, timing];
        return { ...m, timings };
      }
      return m;
    }));
  };

  const getMedicineAvailability = (medicineName) => {
    const medicine = MEDICINE_DATABASE.find(m => 
      m.name.toLowerCase().includes(medicineName.toLowerCase()) ||
      medicineName.toLowerCase().includes(m.name.toLowerCase())
    );
    return medicine || { availability: 'unknown', alternatives: [] };
  };

  const getAvailabilityBadge = (availability) => {
    const styles = {
      available: { bg: 'bg-green-100', text: 'text-green-700', label: 'Available' },
      'low-stock': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Low Stock' },
      unavailable: { bg: 'bg-red-100', text: 'text-red-700', label: 'Unavailable' },
      unknown: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Unknown' },
    };
    
    const style = styles[availability] || styles.unknown;
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const handleSavePrescription = async () => {
    if (medicines.length === 0) {
      alert('Please add at least one medicine');
      return;
    }

    setSavingPrescription(true);
    try {
      const prescriptionData = {
        medicines: medicines.map(m => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions,
          timings: m.timings,
        })),
        diagnosis,
        notes,
        advice,
        doctorName,
        doctorDepartment,
        hospitalName,
        createdAt: new Date().toISOString(),
      };

      await onSave(prescriptionData);
      alert('Prescription saved successfully!');
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Failed to save prescription');
    } finally {
      setSavingPrescription(false);
    }
  };

  const prescriptionContent = (
    <div className="bg-white">
      {/* Hospital Header */}
      <div className="border-b-2 border-blue-600 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">{hospitalName}</h1>
            <p className="text-sm text-gray-600">Medical Prescription</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Date: {new Date().toLocaleDateString()}</p>
            <p>Rx {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Doctor & Patient Info */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div>
          <p className="font-semibold text-gray-700">Doctor</p>
          <p className="text-gray-900">{doctorName}</p>
          <p className="text-gray-600">{doctorDepartment}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">Patient</p>
          <p className="text-gray-900">{patientData?.name || 'N/A'}</p>
          <p className="text-gray-600">ID: {patientData?.studentId || 'N/A'}</p>
          <p className="text-gray-600">Age: {patientData?.age || 'N/A'}, Gender: {patientData?.gender || 'N/A'}</p>
        </div>
      </div>

      {/* Diagnosis */}
      {diagnosis && (
        <div className="mb-6 pb-6 border-b border-gray-300">
          <p className="font-semibold text-gray-700 mb-2">Diagnosis</p>
          <p className="text-gray-900">{diagnosis}</p>
        </div>
      )}

      {/* Medicines Table */}
      <div className="mb-6">
        <p className="font-semibold text-gray-700 mb-3">Prescription</p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-blue-600 bg-blue-50">
              <th className="text-left py-2 px-2">Medicine Name</th>
              <th className="text-left py-2 px-2">Dosage</th>
              <th className="text-left py-2 px-2">Frequency</th>
              <th className="text-left py-2 px-2">Duration</th>
              <th className="text-left py-2 px-2">Instructions</th>
              <th className="text-left py-2 px-2">Timings</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((medicine, idx) => (
              <tr key={idx} className="border-b border-gray-300">
                <td className="py-3 px-2">{medicine.name}</td>
                <td className="py-3 px-2">{medicine.dosage}</td>
                <td className="py-3 px-2">{medicine.frequency}</td>
                <td className="py-3 px-2">{medicine.duration}</td>
                <td className="py-3 px-2 text-xs text-gray-700">{medicine.instructions}</td>
                <td className="py-3 px-2 text-xs">
                  {medicine.timings.length > 0
                    ? medicine.timings.map(t => DOSAGE_SUGGESTIONS[t] || t).join(', ')
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes & Advice */}
      {notes && (
        <div className="mb-6 pb-6 border-b border-gray-300">
          <p className="font-semibold text-gray-700 mb-2">Doctor's Notes</p>
          <p className="text-gray-900 whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {advice && (
        <div className="mb-6">
          <p className="font-semibold text-gray-700 mb-2">Patient Advice</p>
          <p className="text-gray-900 whitespace-pre-wrap">{advice}</p>
        </div>
      )}

      {/* Signature */}
      <div className="mt-12 flex justify-end">
        <div className="text-center">
          <div className="w-32 h-16 border-t border-gray-400 mb-2"></div>
          <p className="text-sm text-gray-600">{doctorName}</p>
          <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Warning Alerts */}
      {!groqConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Groq API Key Not Configured</p>
            <p className="text-sm text-yellow-800 mt-1">
              Some AI features are disabled. Configure your Groq API key in settings for medicine suggestions and risk assessment.
            </p>
          </div>
        </div>
      )}

      {interactions?.hasInteractions && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Medicine Interactions Detected</p>
            {interactions.warnings?.map((warning, idx) => (
              <p key={idx} className="text-sm text-red-800 mt-1">{warning}</p>
            ))}
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 p-8 space-y-6 shadow-sm">
        {/* Diagnosis */}
        <div>
          <label className="block text-sm font-semibold text-blue-900 mb-2">
            📋 Diagnosis
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g., Upper Respiratory Infection"
            className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-800 placeholder-gray-400"
          />
        </div>

        {/* Medicine Input */}
        <div className="bg-white rounded-lg p-6 border-2 border-blue-200">
          <label className="block text-sm font-semibold text-blue-900 mb-4">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600" />
              Add Medicine (AI-Powered)
            </div>
          </label>

          <div className="space-y-4">
            {/* Medicine Input Fields */}
            <div className="relative">
              <input
                ref={medicineInputRef}
                type="text"
                value={newMedicine.name}
                onChange={handleMedicineNameChange}
                onKeyDown={handleMedicineKeyDown}
                placeholder="Medicine name (e.g., 'para' → 'Paracetamol'). Press TAB to auto-complete."
                className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500"
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-blue-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  {loadingSuggestions ? (
                    <div className="p-4 text-center text-blue-600">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      <p className="text-sm mt-2">Getting AI suggestions...</p>
                    </div>
                  ) : medicineSuggestions.length > 0 ? (
                    medicineSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectMedicineSuggestion(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-100 border-b border-blue-100 last:border-b-0 transition-colors"
                      >
                        <p className="font-semibold text-blue-900">{suggestion.fullName || suggestion.name}</p>
                        <p className="text-sm text-blue-700">
                          💊 {suggestion.dosage} • ⏰ {suggestion.frequency} • 📅 {suggestion.duration}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-gray-600 text-center">
                      {newMedicine.name.length >= 2 ? 'No suggestions found' : 'Type medicine name to get AI suggestions'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dosage, Frequency, Duration Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-blue-700 mb-1 block">Dosage</label>
                <input
                  type="text"
                  value={newMedicine.dosage}
                  onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                  placeholder="1 tablet"
                  className="w-full px-3 py-2 bg-blue-50 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-blue-700 mb-1 block">Frequency</label>
                <input
                  type="text"
                  value={newMedicine.frequency}
                  onChange={(e) => setNewMedicine({ ...newMedicine, frequency: e.target.value })}
                  placeholder="3x daily"
                  className="w-full px-3 py-2 bg-blue-50 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-blue-700 mb-1 block">Duration</label>
                <input
                  type="text"
                  value={newMedicine.duration}
                  onChange={(e) => setNewMedicine({ ...newMedicine, duration: e.target.value })}
                  placeholder="5 days"
                  className="w-full px-3 py-2 bg-blue-50 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-blue-700 mb-1 block">Instructions</label>
                <input
                  type="text"
                  value={newMedicine.instructions}
                  onChange={(e) => setNewMedicine({ ...newMedicine, instructions: e.target.value })}
                  placeholder="After meals"
                  className="w-full px-3 py-2 bg-blue-50 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
            </div>

            {/* Timing Selection */}
            <div>
              <label className="text-xs font-semibold text-blue-700 mb-2 block">
                ⏰ Specific Timings
              </label>
              <div className="flex flex-wrap gap-2">
                {['morning', 'noon', 'evening', 'night'].map(timing => (
                  <button
                    key={timing}
                    onClick={() => {
                      setNewMedicine({
                        ...newMedicine,
                        timings: newMedicine.timings.includes(timing)
                          ? newMedicine.timings.filter(t => t !== timing)
                          : [...newMedicine.timings, timing]
                      });
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      newMedicine.timings.includes(timing)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    <Clock className="w-3 h-3 inline mr-1" />
                    {DOSAGE_SUGGESTIONS[timing]}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Medicine Button */}
            <button
              onClick={addMedicine}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Medicine
            </button>
          </div>
        </div>

        {/* Added Medicines List */}
        {medicines.length > 0 && (
          <div className="bg-white rounded-lg p-6 border-2 border-blue-200">
            <label className="block text-sm font-semibold text-blue-900 mb-4">
              ✅ Added Medicines ({medicines.length})
            </label>
            <div className="space-y-3">
              {medicines.map((medicine) => {
                const availability = getMedicineAvailability(medicine.name);
                return (
                  <div
                    key={medicine.id}
                    className="bg-gradient-to-r from-blue-50 to-white rounded-lg p-4 border-2 border-blue-200 space-y-3 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold text-blue-900">{medicine.name}</p>
                        <p className="text-sm text-blue-700">
                          💊 {medicine.dosage} • ⏰ {medicine.frequency} • 📅 {medicine.duration}
                        </p>
                        {medicine.instructions && (
                          <p className="text-xs text-blue-600 mt-1">📝 {medicine.instructions}</p>
                        )}
                        {medicine.timings.length > 0 && (
                          <p className="text-xs text-blue-700 mt-1 font-semibold">
                            ⏱️ {medicine.timings.map(t => DOSAGE_SUGGESTIONS[t]).join(', ')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeMedicine(medicine.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Availability Indicator */}
                    <div className="flex items-center gap-2">
                      {getAvailabilityBadge(availability.availability)}
                      {availability.alternatives.length > 0 && (
                        <span className="text-xs text-blue-600 font-semibold">
                          Alternatives: {availability.alternatives.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes & Advice */}
        <div className="bg-white rounded-lg p-6 border-2 border-blue-200 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              📝 Doctor's Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for medical record..."
              className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-800 placeholder-gray-500"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              💬 Patient Advice
            </label>
            <textarea
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder="Instructions, lifestyle changes, follow-up recommendations..."
              className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-800 placeholder-gray-500"
              rows="3"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t-2 border-blue-200">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex-1 bg-white hover:bg-blue-50 text-blue-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border-2 border-blue-300 hover:border-blue-400"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            onClick={handleSavePrescription}
            disabled={savingPrescription}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:shadow-none"
          >
            {savingPrescription ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Prescription
              </>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="bg-white rounded-lg border-2 border-blue-300 p-8 overflow-auto max-h-96 print:max-h-none shadow-lg">
          {prescriptionContent}
        </div>
      )}
    </div>
  );
};

export default Prescription;
