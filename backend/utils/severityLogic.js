// Rule-based severity classification logic
// This is separate from routes for clean architecture

const CRITICAL_SYMPTOMS = [
  'chest pain',
  'difficulty breathing',
  'severe headache',
  'fainting',
  'seizure',
  'unconscious',
  'severe bleeding',
  'high fever with rash',
  'severe abdominal pain',
  'numbness',
  'slurred speech',
  'vision loss'
];

const MODERATE_SYMPTOMS = [
  'fever',
  'persistent cough',
  'vomiting',
  'diarrhea',
  'moderate pain',
  'dizziness',
  'weakness',
  'fatigue',
  'nausea',
  'loss of appetite',
  'body aches',
  'sore throat'
];

const MILD_SYMPTOMS = [
  'cold',
  'runny nose',
  'mild headache',
  'minor cuts',
  'mild stomach ache',
  'allergies',
  'skin irritation',
  'minor bruise'
];

/**
 * Classify patient severity based on symptoms
 * @param {string[]} symptoms - Array of symptom strings
 * @returns {string} - 'red' (critical), 'orange' (moderate), or 'green' (normal)
 */
export const classifySeverity = (symptoms) => {
  const normalizedSymptoms = symptoms.map(s => s.toLowerCase().trim());
  
  // Check for critical combinations first
  const hasFever = normalizedSymptoms.some(s => s.includes('fever'));
  const hasChestPain = normalizedSymptoms.some(s => s.includes('chest pain'));
  const hasDifficultyBreathing = normalizedSymptoms.some(s => 
    s.includes('breathing') || s.includes('breathless')
  );
  
  // Critical: Fever + Chest Pain or Difficulty Breathing
  if (hasFever && (hasChestPain || hasDifficultyBreathing)) {
    return 'red';
  }
  
  // Check for any critical symptoms
  const hasCritical = normalizedSymptoms.some(symptom => 
    CRITICAL_SYMPTOMS.some(critical => symptom.includes(critical))
  );
  
  if (hasCritical) {
    return 'red';
  }
  
  // Check for multiple moderate symptoms (3+) -> escalate to red
  const moderateCount = normalizedSymptoms.filter(symptom =>
    MODERATE_SYMPTOMS.some(moderate => symptom.includes(moderate))
  ).length;
  
  if (moderateCount >= 3) {
    return 'red';
  }
  
  // Fever + weakness = orange
  const hasWeakness = normalizedSymptoms.some(s => 
    s.includes('weakness') || s.includes('fatigue') || s.includes('tired')
  );
  
  if (hasFever && hasWeakness) {
    return 'orange';
  }
  
  // Check for moderate symptoms
  const hasModerate = normalizedSymptoms.some(symptom =>
    MODERATE_SYMPTOMS.some(moderate => symptom.includes(moderate))
  );
  
  if (hasModerate) {
    return 'orange';
  }
  
  // Default to green (normal)
  return 'green';
};

/**
 * Get diet recommendation based on symptoms and severity
 * @param {string[]} symptoms - Array of symptom strings
 * @param {string} severity - Severity level
 * @returns {object} - Diet recommendation object
 */
export const suggestDiet = (symptoms, severity) => {
  const normalizedSymptoms = symptoms.map(s => s.toLowerCase().trim());
  
  const hasDigestiveIssues = normalizedSymptoms.some(s => 
    s.includes('vomiting') || 
    s.includes('diarrhea') || 
    s.includes('stomach') || 
    s.includes('nausea')
  );
  
  const hasFever = normalizedSymptoms.some(s => s.includes('fever'));
  
  if (severity === 'red' || hasDigestiveIssues) {
    return {
      dietType: 'special',
      restrictions: ['spicy food', 'oily food', 'heavy meals'],
      specialInstructions: 'Light, easily digestible foods only. Increase fluid intake.'
    };
  }
  
  if (severity === 'orange' || hasFever) {
    return {
      dietType: 'light',
      restrictions: ['heavy meals', 'cold drinks'],
      specialInstructions: 'Soft foods, soups, and plenty of fluids recommended.'
    };
  }
  
  return {
    dietType: 'normal',
    restrictions: [],
    specialInstructions: 'Regular diet. Stay hydrated.'
  };
};

/**
 * Suggest tests based on symptoms
 * @param {string[]} symptoms - Array of symptom strings
 * @returns {string[]} - Array of suggested tests
 */
export const suggestTests = (symptoms) => {
  const normalizedSymptoms = symptoms.map(s => s.toLowerCase().trim());
  const tests = [];
  
  const hasFever = normalizedSymptoms.some(s => s.includes('fever'));
  const hasCough = normalizedSymptoms.some(s => s.includes('cough'));
  const hasChestPain = normalizedSymptoms.some(s => s.includes('chest'));
  const hasAbdominalPain = normalizedSymptoms.some(s => s.includes('stomach') || s.includes('abdominal'));
  const hasWeakness = normalizedSymptoms.some(s => s.includes('weakness') || s.includes('fatigue'));
  
  if (hasFever) {
    tests.push('Complete Blood Count (CBC)', 'Malaria Test');
  }
  
  if (hasCough) {
    tests.push('Chest X-Ray', 'Sputum Test');
  }
  
  if (hasChestPain) {
    tests.push('ECG', 'Chest X-Ray');
  }
  
  if (hasAbdominalPain) {
    tests.push('Ultrasound Abdomen', 'Stool Test');
  }
  
  if (hasWeakness) {
    tests.push('Blood Sugar Test', 'Thyroid Profile');
  }
  
  // Remove duplicates
  return [...new Set(tests)];
};

export default {
  classifySeverity,
  suggestDiet,
  suggestTests
};
