import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Loader2,
  RefreshCw,
  Mail,
  Calendar,
  User,
  Heart,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { assessPatientRisk, isGroqConfigured } from '../utils/groqService';

const AppointmentQueue = ({ 
  appointments = [], 
  loading = false, 
  onRefresh,
  userEmail,
}) => {
  const [sortedAppointments, setSortedAppointments] = useState([]);
  const [assessingRisks, setAssessingRisks] = useState(false);
  const [riskAssessments, setRiskAssessments] = useState({});

  // Assess patient risks when appointments change
  useEffect(() => {
    if (appointments.length > 0 && isGroqConfigured()) {
      assessAllRisks();
    }
  }, [appointments]);

  // Sort appointments by risk level
  useEffect(() => {
    const riskScores = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1,
      'unknown': 0,
    };

    const sorted = [...appointments].sort((a, b) => {
      const scoreA = riskScores[riskAssessments[a._id]?.riskLevel || a.severity || 'low'];
      const scoreB = riskScores[riskAssessments[b._id]?.riskLevel || b.severity || 'low'];
      return scoreB - scoreA;
    });

    setSortedAppointments(sorted);
  }, [appointments, riskAssessments]);

  const assessAllRisks = async () => {
    setAssessingRisks(true);
    try {
      const assessments = {};

      for (const appointment of appointments) {
        try {
          const assessment = await assessPatientRisk(
            appointment.symptoms || [],
            appointment.medicalHistory || [],
            appointment.vitals || {}
          );
          assessments[appointment._id] = assessment;
        } catch (error) {
          console.error(`Error assessing risk for appointment ${appointment._id}:`, error);
          assessments[appointment._id] = {
            riskLevel: appointment.severity || 'low',
            riskScore: 0,
            reason: 'Unable to assess risk',
            recommendations: [],
          };
        }
      }

      setRiskAssessments(assessments);
    } catch (error) {
      console.error('Error assessing risks:', error);
    } finally {
      setAssessingRisks(false);
    }
  };

  const getRiskBadge = (riskLevel) => {
    const styles = {
      critical: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-300',
        label: '🔴 Critical',
      },
      high: {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-300',
        label: '🟠 High Risk',
      },
      medium: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-300',
        label: '🟡 Medium',
      },
      low: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-300',
        label: '🟢 Low',
      },
      unknown: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300',
        label: '⚪ Unknown',
      },
    };

    const style = styles[riskLevel] || styles.unknown;
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${style.bg} ${style.text} border ${style.border}`}>
        {style.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.pending}`}>
        {status?.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No appointments booked</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Risk Assessment Info */}
      {isGroqConfigured() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-blue-900">AI-Powered Risk Assessment</p>
            <p className="text-sm text-blue-800 mt-1">
              Appointments are automatically prioritized by medical urgency using AI risk assessment.
              Most urgent appointments appear first.
            </p>
            {assessingRisks && (
              <p className="text-sm text-blue-700 mt-2 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Assessing appointment risks...
              </p>
            )}
          </div>
          <button
            onClick={assessAllRisks}
            disabled={assessingRisks}
            className="flex-shrink-0 p-2 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${assessingRisks ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* Appointments Grid */}
      <div className="grid gap-4">
        {sortedAppointments.map((appointment, index) => {
          const assessment = riskAssessments[appointment._id];
          const riskLevel = assessment?.riskLevel || appointment.severity || 'unknown';

          return (
            <div
              key={appointment._id}
              className={`rounded-lg border p-5 transition-all hover:shadow-md ${
                riskLevel === 'critical'
                  ? 'bg-red-50 border-red-200'
                  : riskLevel === 'high'
                  ? 'bg-orange-50 border-orange-200'
                  : riskLevel === 'medium'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{appointment.doctorName}</h3>
                    <p className="text-sm text-gray-600">{appointment.doctorDepartment}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getRiskBadge(riskLevel)}
                  {getStatusBadge(appointment.status)}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                {/* Date & Time */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-600">Date & Time</p>
                    <p className="font-medium text-gray-900">
                      {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">{appointment.slotTime}</p>
                  </div>
                </div>

                {/* Symptoms */}
                <div className="flex items-start gap-2">
                  <Activity className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-gray-600">Chief Complaint</p>
                    <p className="font-medium text-gray-900">
                      {appointment.symptoms?.[0] || 'General Checkup'}
                    </p>
                    {appointment.symptoms?.length > 1 && (
                      <p className="text-xs text-gray-500">+{appointment.symptoms.length - 1} more</p>
                    )}
                  </div>
                </div>

                {/* Risk Score */}
                {assessment && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="text-gray-600">Risk Score</p>
                      <p className="font-medium text-gray-900">{assessment.riskScore}/100</p>
                    </div>
                  </div>
                )}

                {/* Queue Position */}
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-gray-600">Queue Position</p>
                    <p className="font-medium text-gray-900">#{index + 1}</p>
                  </div>
                </div>
              </div>

              {/* Symptoms List */}
              {appointment.symptoms && appointment.symptoms.length > 0 && (
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {appointment.symptoms.map((symptom, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Assessment Details */}
              {assessment && (
                <div className={`mb-3 p-3 rounded-lg ${
                  riskLevel === 'critical' || riskLevel === 'high'
                    ? 'bg-red-100 border border-red-300'
                    : 'bg-gray-100 border border-gray-300'
                }`}>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Risk Assessment</p>
                  <p className="text-sm text-gray-900">{assessment.reason}</p>
                  {assessment.recommendations?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-gray-700">Recommendations:</p>
                      <ul className="text-xs text-gray-800 list-disc list-inside">
                        {assessment.recommendations.slice(0, 2).map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  View Details
                </button>
                <button className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  Resend Email
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Info = ({ className }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

export default AppointmentQueue;
