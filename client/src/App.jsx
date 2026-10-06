import AIResultCard from './components/AIResultCard';
import { useEffect, useState } from 'react';
import './App.css';

const API_BASE = '/api';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [symptoms, setSymptoms] = useState('');
  const [currentCondition, setCurrentCondition] = useState('');

  const [insight, setInsight] = useState(null);
  const [insights, setInsights] = useState([]);

  const [loading, setLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      setDoctor(data.doctor);
    } catch (err) {
      setError('Cannot connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    const savedToken = localStorage.getItem('token');

    if (!savedToken) {
      return;
    }

    try {
      setPatientsLoading(true);
      setError('');

      const response = await fetch(`${API_BASE}/patients`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load patients');
      }

      setPatients(data.patients || []);
    } catch (err) {
      setError(err.message || 'Failed to load patients');
    } finally {
      setPatientsLoading(false);
    }
  };

  const loadInsights = async (patientId) => {
    const savedToken = localStorage.getItem('token');

    if (!savedToken || !patientId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/ai/insights/${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to load insights'
        );
      }

      setInsights(data.insights || []);
    } catch (err) {
      setInsights([]);
      setError(
        err.message || 'Failed to load previous insights'
      );
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setInsight(null);
    setSymptoms('');
    setCurrentCondition('');
    setError('');

    await loadInsights(patient._id);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    setError('');
    setInsight(null);

    if (!selectedPatient) {
      setError('Please select a patient first');
      return;
    }

    if (!symptoms.trim()) {
      setError('Please enter symptoms');
      return;
    }

    try {
      setAiLoading(true);

      const response = await fetch(`${API_BASE}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          symptoms: symptoms.trim(),
          currentCondition: currentCondition.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'AI analysis failed'
        );
      }

      setInsight(data.insight);

      await loadInsights(selectedPatient._id);
    } catch (err) {
      setError(err.message || 'AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');

    setDoctor(null);
    setPatients([]);
    setSelectedPatient(null);
    setInsight(null);
    setInsights([]);
    setSymptoms('');
    setCurrentCondition('');
    setError('');
    setEmail('');
    setPassword('');
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');

    if (!savedToken) {
      return;
    }

    const loadDoctor = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          localStorage.removeItem('token');
          return;
        }

        setDoctor(data.doctor);
      } catch (err) {
        localStorage.removeItem('token');
      }
    };

    loadDoctor();
  }, []);

  useEffect(() => {
    if (doctor) {
      loadPatients();
    }
  }, [doctor]);

  if (!doctor) {
    return (
      <div className="app login-app">
        <div className="login-card">
          <div className="brand">
            <div className="brand-icon">+</div>

            <div>
              <h1>Smart Patient Dashboard</h1>
              <p>Clinical decision support</p>
            </div>
          </div>

          <div className="login-heading">
            <h2>Doctor Login</h2>
            <p>
              Sign in to access your patient dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <label>
              Email

              <input
                type="email"
                placeholder="doctor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label>
              Password

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app dashboard-app">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-icon small">+</div>

          <div>
            <strong>Smart Patient Dashboard</strong>
            <span>Clinical decision support</span>
          </div>
        </div>

        <div className="doctor-area">
          <div className="doctor-info">
            <strong>{doctor.name}</strong>
            <span>
              {doctor.specialization || 'Doctor'}
            </span>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard">
        {error && (
          <div className="error-box dashboard-error">
            {error}
          </div>
        )}

        <section className="welcome-section">
          <div>
            <h1>Patient Dashboard</h1>

            <p>
              Select a patient to review their information
              and run an AI analysis.
            </p>
          </div>
        </section>

        <div className="dashboard-grid">
          <aside className="patients-panel">
            <div className="panel-header">
              <div>
                <h2>Patients</h2>

                <span>
                  {patients.length} patient
                  {patients.length !== 1 ? 's' : ''}
                </span>
              </div>

              <button
                className="refresh-button"
                onClick={loadPatients}
                disabled={patientsLoading}
              >
                {patientsLoading ? '...' : 'Refresh'}
              </button>
            </div>

            {patientsLoading ? (
              <div className="empty-state">
                Loading patients...
              </div>
            ) : patients.length === 0 ? (
              <div className="empty-state">
                No patients found.
              </div>
            ) : (
              <div className="patient-list">
                {patients.map((patient) => (
                  <button
                    key={patient._id}
                    className={`patient-item ${
                      selectedPatient?._id === patient._id
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() =>
                      handleSelectPatient(patient)
                    }
                  >
                    <div className="patient-avatar">
                      {patient.name
                        ?.charAt(0)
                        ?.toUpperCase() || '?'}
                    </div>

                    <div className="patient-info">
                      <strong>{patient.name}</strong>

                      <span>
                        {patient.age} years · {patient.gender}
                      </span>
                    </div>

                    <span className="arrow">›</span>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="analysis-panel">
            {!selectedPatient ? (
              <div className="select-patient-state">
                <div className="large-icon">+</div>

                <h2>Select a patient</h2>

                <p>
                  Choose a patient from the list to start
                  an AI-assisted clinical analysis.
                </p>
              </div>
            ) : (
              <>
                <div className="patient-header">
                  <div className="patient-avatar large">
                    {selectedPatient.name
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </div>

                  <div>
                    <h2>{selectedPatient.name}</h2>

                    <p>
                      {selectedPatient.age} years ·{' '}
                      {selectedPatient.gender}

                      {selectedPatient.bloodGroup &&
                        ` · ${selectedPatient.bloodGroup}`}
                    </p>
                  </div>
                </div>

                <div className="medical-history">
                  <h3>Medical History</h3>

                  <div className="history-grid">
                    <div>
                      <span>Conditions</span>

                      <strong>
                        {selectedPatient.medicalHistory
                          ?.conditions?.length
                          ? selectedPatient.medicalHistory.conditions
                              .map((item) => item.name)
                              .join(', ')
                          : 'None recorded'}
                      </strong>
                    </div>

                    <div>
                      <span>Allergies</span>

                      <strong>
                        {selectedPatient.medicalHistory
                          ?.allergies?.length
                          ? selectedPatient.medicalHistory.allergies
                              .map(
                                (item) => item.substance
                              )
                              .join(', ')
                          : 'None recorded'}
                      </strong>
                    </div>

                    <div>
                      <span>Medications</span>

                      <strong>
                        {selectedPatient.medicalHistory
                          ?.medications?.length
                          ? selectedPatient.medicalHistory.medications
                              .map((item) => item.name)
                              .join(', ')
                          : 'None recorded'}
                      </strong>
                    </div>
                  </div>
                </div>

                <form
                  className="analysis-form"
                  onSubmit={handleAnalyze}
                >
                  <div className="section-title">
                    <div>
                      <h3>AI Clinical Analysis</h3>

                      <p>
                        Enter the patient's current symptoms
                        for decision support.
                      </p>
                    </div>
                  </div>

                  <label>
                    Symptoms

                    <textarea
                      rows="5"
                      maxLength="3000"
                      placeholder="Example: sudden chest pain since morning..."
                      value={symptoms}
                      onChange={(e) =>
                        setSymptoms(e.target.value)
                      }
                    />

                    <small>
                      {symptoms.length}/3000
                    </small>
                  </label>

                  <label>
                    Current Condition

                    <textarea
                      rows="3"
                      maxLength="2000"
                      placeholder="Optional additional clinical context..."
                      value={currentCondition}
                      onChange={(e) =>
                        setCurrentCondition(e.target.value)
                      }
                    />

                    <small>
                      {currentCondition.length}/2000
                    </small>
                  </label>

                  <button
                    className="primary-button analyze-button"
                    type="submit"
                    disabled={aiLoading}
                  >
                    {aiLoading
                      ? 'Analyzing...'
                      : 'Analyze with AI'}
                  </button>
                </form>

                {insight && (
                  <AIResultCard insight={insight} />
                )}

                <div className="history-panel">
                  <div className="section-title">
                    <div>
                      <h3>Previous AI Analyses</h3>

                      <p>
                        Previous analyses for this patient.
                      </p>
                    </div>
                  </div>

                  {insights.length === 0 ? (
                    <div className="empty-state">
                      No previous analyses.
                    </div>
                  ) : (
                    <div className="previous-list">
                      {insights.map((item) => (
                        <div
                          className="previous-item"
                          key={item._id}
                        >
                          <div className="previous-top">
                            <strong>
                              {item.riskLevel} Risk
                            </strong>

                            <span>
                              {new Date(
                                item.createdAt
                              ).toLocaleString()}
                            </span>
                          </div>

                          <p>{item.symptoms}</p>

                          {item.escalatedBySafetyRules && (
                            <span className="safety-label">
                              Safety rules escalated this
                              result
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
