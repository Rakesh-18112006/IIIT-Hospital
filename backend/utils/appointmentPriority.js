/**
 * AI-based Health Problem Analyzer and Priority Calculator
 * Analyzes health problem descriptions to determine severity and risk score
 */

// Critical keywords that indicate immediate medical attention
const CRITICAL_KEYWORDS = [
  // Cardiac emergencies
  "chest pain",
  "heart attack",
  "cardiac arrest",
  "severe chest tightness",
  "heart palpitations",
  "irregular heartbeat",
  // Respiratory emergencies
  "difficulty breathing",
  "can't breathe",
  "breathless",
  "severe asthma",
  "choking",
  "respiratory distress",
  "oxygen",
  // Neurological emergencies
  "stroke",
  "seizure",
  "convulsion",
  "unconscious",
  "fainting",
  "blackout",
  "severe headache",
  "worst headache",
  "sudden numbness",
  "paralysis",
  "slurred speech",
  "confusion",
  "disorientation",
  // Trauma
  "severe bleeding",
  "heavy bleeding",
  "head injury",
  "accident",
  "fracture",
  "broken bone",
  "severe burn",
  // Other critical
  "anaphylaxis",
  "allergic shock",
  "poisoning",
  "overdose",
  "suicidal",
  "suicide",
  "self-harm",
  "high fever with rash",
  "meningitis",
  "sepsis",
  "severe abdominal pain",
  "appendicitis",
  "loss of vision",
  "sudden blindness",
];

// High severity keywords
const HIGH_SEVERITY_KEYWORDS = [
  // Fever related
  "high fever",
  "fever above 103",
  "persistent fever",
  "fever with chills",
  // Pain indicators
  "severe pain",
  "intense pain",
  "unbearable pain",
  "excruciating",
  "sharp pain",
  "stabbing pain",
  // Infections
  "infection",
  "infected wound",
  "pus",
  "swollen lymph nodes",
  "urinary infection",
  "kidney infection",
  // Digestive
  "severe vomiting",
  "blood in vomit",
  "blood in stool",
  "severe diarrhea",
  "dehydration",
  "can't keep food down",
  // Respiratory
  "persistent cough",
  "coughing blood",
  "wheezing",
  "bronchitis",
  "pneumonia",
  // Mental health
  "severe anxiety",
  "panic attack",
  "severe depression",
  // Others
  "diabetic emergency",
  "low blood sugar",
  "high blood sugar",
  "pregnancy complications",
  "severe allergic reaction",
  "eye injury",
  "ear pain severe",
];

// Medium severity keywords
const MEDIUM_SEVERITY_KEYWORDS = [
  // Common illnesses
  "fever",
  "cold",
  "flu",
  "cough",
  "sore throat",
  "body aches",
  "muscle pain",
  "joint pain",
  // Digestive issues
  "vomiting",
  "nausea",
  "diarrhea",
  "stomach ache",
  "indigestion",
  "constipation",
  "bloating",
  // General symptoms
  "headache",
  "migraine",
  "dizziness",
  "weakness",
  "fatigue",
  "loss of appetite",
  "weight loss",
  // Skin issues
  "rash",
  "skin irritation",
  "itching",
  "hives",
  "eczema",
  // Minor infections
  "ear infection",
  "sinus infection",
  "throat infection",
  // Others
  "back pain",
  "neck pain",
  "sprain",
  "minor burn",
  "allergies",
  "hay fever",
  "runny nose",
];

// Low severity keywords
const LOW_SEVERITY_KEYWORDS = [
  "minor headache",
  "mild cold",
  "slight cough",
  "mild fever",
  "small cut",
  "minor bruise",
  "mild stomach ache",
  "dry skin",
  "minor allergies",
  "routine checkup",
  "vaccination",
  "health certificate",
  "prescription refill",
  "follow-up",
  "general consultation",
  "advice",
];

// Age-based risk factors
const AGE_RISK_FACTORS = {
  infant: 20, // < 1 year
  child: 15, // 1-12 years
  teenager: 5, // 13-19 years
  adult: 0, // 20-50 years
  middleAge: 10, // 51-65 years
  senior: 20, // > 65 years
};

// Urgency indicators that increase priority
const URGENCY_INDICATORS = [
  { pattern: /sudden|suddenly/i, score: 15, indicator: "Sudden onset" },
  {
    pattern: /worsening|getting worse|deteriorating/i,
    score: 20,
    indicator: "Worsening condition",
  },
  {
    pattern: /(\d+)\s*days?/i,
    handler: (match) => {
      const days = parseInt(match[1]);
      if (days >= 7)
        return { score: 20, indicator: `Prolonged symptoms (${days} days)` };
      if (days >= 3)
        return { score: 10, indicator: `Symptoms for ${days} days` };
      return { score: 5, indicator: `Recent symptoms (${days} days)` };
    },
  },
  {
    pattern: /recurring|recurrent|comes and goes/i,
    score: 15,
    indicator: "Recurring condition",
  },
  { pattern: /chronic|long-term/i, score: 10, indicator: "Chronic condition" },
  {
    pattern: /first time|never happened before/i,
    score: 10,
    indicator: "New symptoms",
  },
  { pattern: /pregnant|pregnancy/i, score: 25, indicator: "Pregnancy-related" },
  { pattern: /child|baby|infant|kid/i, score: 15, indicator: "Pediatric case" },
  {
    pattern: /elderly|old age|senior/i,
    score: 15,
    indicator: "Geriatric case",
  },
  { pattern: /diabetic|diabetes/i, score: 10, indicator: "Diabetic patient" },
  { pattern: /asthma|asthmatic/i, score: 10, indicator: "Asthmatic patient" },
  {
    pattern: /heart condition|cardiac history/i,
    score: 15,
    indicator: "Cardiac history",
  },
  {
    pattern: /immunocompromised|weak immune/i,
    score: 20,
    indicator: "Immunocompromised",
  },
];

/**
 * Analyze health problem text and determine severity
 * @param {string} healthProblem - Description of the health problem
 * @param {string[]} symptoms - Array of selected symptoms
 * @returns {Object} Analysis result with severity, riskScore, and details
 */
export const analyzeHealthProblem = (healthProblem, symptoms = []) => {
  const text = healthProblem.toLowerCase();
  const allText = `${text} ${symptoms.join(" ").toLowerCase()}`;

  let baseScore = 0;
  let severity = "low";
  const detectedConditions = [];
  const urgencyIndicators = [];

  // Check for critical keywords
  const criticalMatches = CRITICAL_KEYWORDS.filter((keyword) =>
    allText.includes(keyword.toLowerCase())
  );
  if (criticalMatches.length > 0) {
    baseScore = 80;
    severity = "critical";
    detectedConditions.push(
      ...criticalMatches.map((k) => k.charAt(0).toUpperCase() + k.slice(1))
    );
  }

  // Check for high severity keywords
  if (severity !== "critical") {
    const highMatches = HIGH_SEVERITY_KEYWORDS.filter((keyword) =>
      allText.includes(keyword.toLowerCase())
    );
    if (highMatches.length > 0) {
      baseScore = Math.max(baseScore, 50);
      severity = "high";
      detectedConditions.push(
        ...highMatches.map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      );
    }
  }

  // Check for medium severity keywords
  if (severity !== "critical" && severity !== "high") {
    const mediumMatches = MEDIUM_SEVERITY_KEYWORDS.filter((keyword) =>
      allText.includes(keyword.toLowerCase())
    );
    if (mediumMatches.length > 0) {
      baseScore = Math.max(baseScore, 25);
      severity = "medium";
      detectedConditions.push(
        ...mediumMatches.map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      );
    }
  }

  // Check for low severity keywords (if nothing else matched)
  if (baseScore === 0) {
    const lowMatches = LOW_SEVERITY_KEYWORDS.filter((keyword) =>
      allText.includes(keyword.toLowerCase())
    );
    if (lowMatches.length > 0) {
      baseScore = 10;
      severity = "low";
      detectedConditions.push(
        ...lowMatches.map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      );
    }
  }

  // Apply urgency indicators
  let urgencyBonus = 0;
  URGENCY_INDICATORS.forEach((indicator) => {
    const match = allText.match(indicator.pattern);
    if (match) {
      if (indicator.handler) {
        const result = indicator.handler(match);
        urgencyBonus += result.score;
        urgencyIndicators.push(result.indicator);
      } else {
        urgencyBonus += indicator.score;
        urgencyIndicators.push(indicator.indicator);
      }
    }
  });

  // Calculate final risk score (0-100)
  let riskScore = Math.min(100, baseScore + urgencyBonus);

  // Adjust severity based on final score
  if (riskScore >= 80) severity = "critical";
  else if (riskScore >= 50) severity = "high";
  else if (riskScore >= 25) severity = "medium";
  else severity = "low";

  // Determine recommended action
  let recommendedAction;
  switch (severity) {
    case "critical":
      recommendedAction =
        "Immediate medical attention required. Consider emergency services.";
      break;
    case "high":
      recommendedAction =
        "Urgent consultation recommended. Priority appointment needed.";
      break;
    case "medium":
      recommendedAction = "Schedule appointment soon. Monitor symptoms.";
      break;
    default:
      recommendedAction = "Routine consultation. Standard appointment slot.";
  }

  // Calculate confidence based on how many indicators matched
  const totalMatches = detectedConditions.length + urgencyIndicators.length;
  const confidence = Math.min(95, 50 + totalMatches * 10);

  return {
    severity,
    riskScore,
    aiAnalysis: {
      detectedConditions: [...new Set(detectedConditions)].slice(0, 5), // Unique, max 5
      urgencyIndicators: [...new Set(urgencyIndicators)],
      recommendedAction,
      confidence,
    },
  };
};

/**
 * Reorder queue based on risk scores
 * @param {Array} appointments - Array of appointments to reorder
 * @returns {Array} Reordered appointments with updated queue positions
 */
export const reorderQueueByPriority = (appointments) => {
  // Sort by risk score (descending), then by booking time (ascending)
  const sorted = [...appointments].sort((a, b) => {
    // First, sort by risk score (higher score = higher priority)
    if (b.riskScore !== a.riskScore) {
      return b.riskScore - a.riskScore;
    }
    // Then by severity level
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    if (severityOrder[b.severity] !== severityOrder[a.severity]) {
      return severityOrder[b.severity] - severityOrder[a.severity];
    }
    // Finally by booking time (earlier = higher priority)
    return new Date(a.bookedAt) - new Date(b.bookedAt);
  });

  // Update queue positions
  return sorted.map((apt, index) => ({
    ...apt,
    queuePosition: index + 1,
  }));
};

/**
 * Assign optimal slot based on severity
 * @param {Array} availableSlots - Available time slots
 * @param {string} severity - Severity level
 * @param {number} riskScore - Risk score
 * @returns {Object} Selected slot
 */
export const assignOptimalSlot = (availableSlots, severity, riskScore) => {
  if (availableSlots.length === 0) return null;

  // For critical cases, assign the earliest available slot
  if (severity === "critical" || riskScore >= 80) {
    return availableSlots[0];
  }

  // For high severity, assign within first 25% of available slots
  if (severity === "high" || riskScore >= 50) {
    const index = Math.min(
      Math.floor(availableSlots.length * 0.25),
      availableSlots.length - 1
    );
    return availableSlots[index];
  }

  // For medium severity, assign within first 50% of available slots
  if (severity === "medium" || riskScore >= 25) {
    const index = Math.min(
      Math.floor(availableSlots.length * 0.5),
      availableSlots.length - 1
    );
    return availableSlots[index];
  }

  // For low severity, any available slot (prefer later slots to leave room for urgent cases)
  return availableSlots[availableSlots.length - 1];
};

/**
 * Get severity color class for UI
 * @param {string} severity - Severity level
 * @returns {Object} Color classes for UI
 */
export const getSeverityColors = (severity) => {
  const colors = {
    critical: {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-200",
      badge: "bg-red-500",
      light: "bg-red-50",
    },
    high: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-200",
      badge: "bg-orange-500",
      light: "bg-orange-50",
    },
    medium: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      border: "border-yellow-200",
      badge: "bg-yellow-500",
      light: "bg-yellow-50",
    },
    low: {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-200",
      badge: "bg-green-500",
      light: "bg-green-50",
    },
  };
  return colors[severity] || colors.low;
};

export default {
  analyzeHealthProblem,
  reorderQueueByPriority,
  assignOptimalSlot,
  getSeverityColors,
};
