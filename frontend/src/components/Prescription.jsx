import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Pill,
  Clock,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  getMedicineSuggestions,
  isGroqConfigured,
} from '../utils/groqService';

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
    timings: [], // Array of: 'morning', 'evening', 'night'
  });
  
  const [medicineSuggestions, setMedicineSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [groqConfigured, setGroqConfigured] = useState(true);
  
  const [advice, setAdvice] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [savingPrescription, setSavingPrescription] = useState(false);
  
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
            appointment?.symptoms || []
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
  }, [newMedicine.name, patientData, appointment]);

  const handleMedicineNameChange = (e) => {
    const value = e.target.value;
    setNewMedicine({ ...newMedicine, name: value });
  };

  const handleMedicineKeyDown = (e) => {
    if (e.key === 'Tab' && newMedicine.name && medicineSuggestions.length > 0) {
      e.preventDefault();
      const suggestion = medicineSuggestions[0];
      setNewMedicine({
        ...newMedicine,
        name: suggestion.fullName || suggestion.name,
      });
      setShowSuggestions(false);
    } else if (e.key === 'Enter' && newMedicine.name) {
      e.preventDefault();
      addMedicine();
    }
  };

  const selectMedicineSuggestion = (suggestion) => {
    setNewMedicine({
      ...newMedicine,
      name: suggestion.fullName || suggestion.name,
    });
    setShowSuggestions(false);
  };

  const addMedicine = () => {
    if (!newMedicine.name.trim()) {
      alert('Please enter medicine name');
      return;
    }

    setMedicines([...medicines, { ...newMedicine, id: Date.now() }]);
    setNewMedicine({
      name: '',
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

  const handleSavePrescription = async () => {
    if (medicines.length === 0) {
      alert('Please add at least one medicine');
      return;
    }

    if (!diagnosis.trim()) {
      alert('Please enter a diagnosis');
      return;
    }

    setSavingPrescription(true);
    try {
      const prescriptionData = {
        medicines: medicines.map(m => ({
          name: m.name,
          timings: m.timings, // Only morning, evening, night
          dosage: '', // Not required per user request
          frequency: '', // Not required per user request
          duration: '', // Not required per user request
          instructions: '', // Not required per user request
        })),
        diagnosis,
        symptoms: appointment?.symptoms || [],
        notes: '', // Not required per user request
        advice,
        interactions: [],
      };

      await onSave(prescriptionData);
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Failed to save prescription');
    } finally {
      setSavingPrescription(false);
    }
  };

  const timingLabels = {
    morning: 'Morning',
    evening: 'Evening',
    night: 'Night',
  };

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      {!groqConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Groq API Key Not Configured</p>
            <p className="text-sm text-yellow-800 mt-1">
              AI-assisted medicine suggestions are disabled. Configure your Groq API key in settings.
            </p>
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
              Add Medicine {groqConfigured && '(AI-Assisted)'}
            </div>
          </label>

          <div className="space-y-4">
            {/* Medicine Name Input */}
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
            <div className="space-y-4">
              {medicines.map((medicine) => (
                <div
                  key={medicine.id}
                  className="bg-gradient-to-r from-blue-50 to-white rounded-lg p-4 border-2 border-blue-200 space-y-3 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-blue-900">{medicine.name}</p>
                      
                      {/* Timing Selection */}
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-blue-700 mb-2">
                          ⏰ Dosage Timing (Select one or more):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {['morning', 'evening', 'night'].map(timing => (
                            <button
                              key={timing}
                              onClick={() => toggleMedicineTiming(medicine.id, timing)}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                medicine.timings.includes(timing)
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              <Clock className="w-3 h-3 inline mr-1" />
                              {timingLabels[timing]}
                            </button>
                          ))}
                        </div>
                        {medicine.timings.length === 0 && (
                          <p className="text-xs text-gray-500 mt-1">No timing selected</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeMedicine(medicine.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advice Section */}
        <div className="bg-white rounded-lg p-6 border-2 border-blue-200">
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              💬 Patient Advice (Optional)
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

        {/* Submit Button */}
        <div className="flex gap-3 pt-6 border-t-2 border-blue-200">
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
                Submit Prescription
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Prescription;
