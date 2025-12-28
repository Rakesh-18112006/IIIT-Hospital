import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Zap,
  Loader2,
} from 'lucide-react';
import {
  initializeGroqService,
  getGroqApiKey,
  clearGroqApiKey,
  isGroqConfigured,
} from '../utils/groqService';

const GroqApiConfig = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Load stored key
    const storedKey = getGroqApiKey();
    if (storedKey) {
      setApiKey(storedKey);
      setConfigured(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      alert('Please enter a valid API key');
      return;
    }

    const success = initializeGroqService(apiKey);
    if (success) {
      setConfigured(true);
      setSaveMessage('✓ API Key saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      alert('Failed to save API key');
    }
  };

  const handleClearApiKey = () => {
    if (confirm('Are you sure you want to remove the Groq API key?')) {
      clearGroqApiKey();
      setApiKey('');
      setConfigured(false);
      setTestResult(null);
      setSaveMessage('✓ API Key removed');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleCopyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key first');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test with a simple API call
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'Connection successful! Groq API is working.' });
      } else {
        const error = await response.json();
        setTestResult({
          success: false,
          message: error.error?.message || 'Connection failed. Please check your API key.',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Error connecting to Groq API. Please check your internet connection.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-300" />
            <h2 className="text-lg font-bold text-white">Groq API Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What is Groq API?</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              Groq provides ultra-fast LLM inference. In our hospital system, it powers:
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
              <li>Medicine name auto-completion</li>
              <li>Dosage & frequency suggestions</li>
              <li>Patient risk assessment</li>
              <li>Appointment prioritization</li>
              <li>Drug interaction warnings</li>
            </ul>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Groq API Key
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 p-1 text-gray-500 hover:text-gray-700"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleCopyKey}
                disabled={!apiKey}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                title="Copy API key"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Get your free API key from{' '}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                console.groq.com
              </a>
            </p>
          </div>

          {/* Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${configured ? 'bg-green-500' : 'bg-gray-400'}`} />
              <p className="text-sm font-medium text-gray-700">
                Status: {configured ? 'Configured' : 'Not Configured'}
              </p>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`rounded-lg p-3 flex items-start gap-2 ${
              testResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              {testResult.success ? (
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.message}
              </p>
            </div>
          )}

          {/* Save Message */}
          {saveMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-800">{saveMessage}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleTestConnection}
              disabled={!apiKey || testing}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </button>

            <button
              onClick={handleSaveApiKey}
              disabled={!apiKey}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save API Key
            </button>

            {configured && (
              <button
                onClick={handleClearApiKey}
                className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm transition-colors"
              >
                Remove API Key
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors"
            >
              Close
            </button>
          </div>

          {/* Features Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm">Powered Features</h4>
            <ul className="text-xs space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                AI Medicine Auto-Completion (Type "para" → "Paracetamol")
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                Smart Dosage & Frequency Suggestions
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                Patient Risk Assessment (Critical/High/Medium/Low)
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                Automatic Appointment Prioritization
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                Drug Interaction & Safety Warnings
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                Medical Advice Generation
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroqApiConfig;
