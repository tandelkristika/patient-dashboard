import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Brain,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  LogOut,
  Pencil,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';

import AIResultCard from './components/AIResultCard';
import './App.css';
import heroImage from './assets/hero.png';

const API_BASE = '/api';

const EMPTY_PATIENT_FORM = {
  name: '',
  age: '',
  gender: '',
  bloodGroup: 'Unknown',
  phone: '',
  email: '',
  conditionName: '',
  conditionNotes: '',
  allergySubstance: '',
  allergyReaction: '',
  medicationName: '',
  medicationDosage: '',
  surgeryName: '',
  familyHistory: '',
  lifestyleNotes: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

// Form fields that have their own error message under the input
const EDIT_FORM_FIELDS = [
  'name',
  'age',
  'gender',
  'bloodGroup',
  'phone',
  'email',
];

// Turns a saved patient into the flat form used by the Edit dialog
const patientToForm = (patient) => {
  const history = patient?.medicalHistory || {};
  const condition = history.conditions?.[0] || {};
  const allergy = history.allergies?.[0] || {};
  const medication = history.medications?.[0] || {};
  const surgery = history.surgeries?.[0] || {};

  return {
    name: patient?.name || '',
    age:
      patient?.age === undefined || patient?.age === null
        ? ''
        : String(patient.age),
    gender: patient?.gender || '',
    bloodGroup: patient?.bloodGroup || 'Unknown',
    phone: patient?.phone || '',
    email: patient?.email || '',
    conditionName: condition.name || '',
    conditionNotes: condition.notes || '',
    allergySubstance: allergy.substance || '',
    allergyReaction: allergy.reaction || '',
    medicationName: medication.name || '',
    medicationDosage: medication.dosage || '',
    surgeryName: surgery.name || '',
    familyHistory: history.familyHistory || '',
    lifestyleNotes: history.lifestyleNotes || '',
  };
};

// The form edits the FIRST entry of each list. Any further entries the
// patient already has are kept exactly as they are, so nothing is lost.
const replaceFirstItem = (existingList, firstItem) => {
  const rest = Array.isArray(existingList)
    ? existingList.slice(1)
    : [];

  return firstItem ? [firstItem, ...rest] : rest;
};

const buildMedicalHistory = (form, existing = {}) => ({
  conditions: replaceFirstItem(
    existing.conditions,
    form.conditionName.trim()
      ? {
          name: form.conditionName.trim(),
          notes: form.conditionNotes.trim(),
        }
      : null
  ),

  allergies: replaceFirstItem(
    existing.allergies,
    form.allergySubstance.trim()
      ? {
          substance: form.allergySubstance.trim(),
          reaction: form.allergyReaction.trim(),
        }
      : null
  ),

  medications: replaceFirstItem(
    existing.medications,
    form.medicationName.trim()
      ? {
          name: form.medicationName.trim(),
          dosage: form.medicationDosage.trim(),
        }
      : null
  ),

  surgeries: replaceFirstItem(
    existing.surgeries,
    form.surgeryName.trim()
      ? { name: form.surgeryName.trim() }
      : null
  ),

  familyHistory: form.familyHistory.trim(),
  lifestyleNotes: form.lifestyleNotes.trim(),
});

// Returns { fieldName: 'message' }. An empty object means the form is valid.
const validatePatientForm = (form) => {
  const errors = {};

  const name = form.name.trim();

  if (!name) {
    errors.name = 'Patient name is required';
  } else if (name.length < 2 || name.length > 100) {
    errors.name = 'Name must be 2 to 100 characters';
  }

  if (form.age === '' || Number.isNaN(Number(form.age))) {
    errors.age = 'Patient age is required';
  } else if (
    !Number.isInteger(Number(form.age)) ||
    Number(form.age) < 0 ||
    Number(form.age) > 130
  ) {
    errors.age = 'Enter a whole number from 0 to 130';
  }

  if (!form.gender) {
    errors.gender = 'Please select gender';
  }

  const phone = form.phone.trim();

  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone =
      'Use 7 to 20 characters: digits, spaces, + - ( )';
  }

  const email = form.email.trim();

  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  return errors;
};

function App() {
  const [authMode, setAuthMode] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialization: '',
  });

  const [doctor, setDoctor] = useState(null);

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [patientSearch, setPatientSearch] = useState('');

  const [symptoms, setSymptoms] = useState('');
  const [currentCondition, setCurrentCondition] = useState('');

  const [insight, setInsight] = useState(null);
  const [insights, setInsights] = useState([]);

  const [loading, setLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activePage, setActivePage] = useState('dashboard');

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    specialization: '',
  });

  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordSaving, setPasswordSaving] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] =
    useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [mobileMenu, setMobileMenu] = useState(false);

  const [showAddPatient, setShowAddPatient] = useState(false);
  const [patientSaving, setPatientSaving] = useState(false);
  const [patientForm, setPatientForm] = useState(EMPTY_PATIENT_FORM);

  // Edit patient dialog
  const [editingPatient, setEditingPatient] = useState(null);
  const [editForm, setEditForm] = useState({
    ...EMPTY_PATIENT_FORM,
  });
  const [editErrors, setEditErrors] = useState({});
  const [editFormError, setEditFormError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Delete patient dialog
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deletingPatient, setDeletingPatient] = useState(false);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const resetPatientForm = () => {
    setPatientForm({ ...EMPTY_PATIENT_FORM });
  };

  const openAddPatient = () => {
    clearMessages();
    resetPatientForm();
    setShowAddPatient(true);
    setActivePage('patients');
    setMobileMenu(false);
  };

  const closeAddPatient = () => {
    setShowAddPatient(false);
    resetPatientForm();
    clearMessages();
  };

  const filteredPatients = useMemo(() => {
    const search = patientSearch.trim().toLowerCase();

    if (!search) {
      return patients;
    }

    return patients.filter((patient) => {
      const name = patient.name?.toLowerCase() || '';
      const email = patient.email?.toLowerCase() || '';
      const phone = patient.phone?.toLowerCase() || '';
      const gender = patient.gender?.toLowerCase() || '';

      return (
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search) ||
        gender.includes(search)
      );
    });
  }, [patients, patientSearch]);

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password) {
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
          email: email.trim(),
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
      setEmail('');
      setPassword('');
    } catch (err) {
      setError('Cannot connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();

    const {
      name,
      email,
      password,
      confirmPassword,
      specialization,
    } = registerForm;

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword ||
      !specialization.trim()
    ) {
      setError('Please complete all registration fields');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setRegisterLoading(true);

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          specialization: specialization.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Registration failed');
        return;
      }

      localStorage.setItem('token', data.token);

      setDoctor(data.doctor);

      setRegisterForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        specialization: '',
      });

      setSuccess('Account created successfully.');
    } catch (err) {
      setError('Cannot connect to backend server');
    } finally {
      setRegisterLoading(false);
    }
  };

  const loadPatients = async () => {
    const savedToken = localStorage.getItem('token');

    if (!savedToken) return;

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

    if (!savedToken || !patientId) return;

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
    clearMessages();

    await loadInsights(patient._id);
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    clearMessages();

    const {
      name,
      age,
      gender,
      bloodGroup,
      phone,
      email,
      conditionName,
      conditionNotes,
      allergySubstance,
      allergyReaction,
      medicationName,
      medicationDosage,
      surgeryName,
      familyHistory,
      lifestyleNotes,
    } = patientForm;

    if (!name.trim()) {
      setError('Patient name is required');
      return;
    }

    if (age === '' || Number.isNaN(Number(age))) {
      setError('Patient age is required');
      return;
    }

    if (Number(age) < 0 || Number(age) > 130) {
      setError('Please enter a valid age from 0 to 130');
      return;
    }

    if (!gender) {
      setError('Please select gender');
      return;
    }

    if (email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email.trim())) {
        setError('Please enter a valid patient email');
        return;
      }
    }

    try {
      setPatientSaving(true);

      const token = localStorage.getItem('token');

      if (!token) {
        setError(
          'Your session has expired. Please sign in again.'
        );
        return;
      }

      const medicalHistory = {
        conditions: conditionName.trim()
          ? [
              {
                name: conditionName.trim(),
                notes: conditionNotes.trim(),
              },
            ]
          : [],

        allergies: allergySubstance.trim()
          ? [
              {
                substance: allergySubstance.trim(),
                reaction: allergyReaction.trim(),
              },
            ]
          : [],

        medications: medicationName.trim()
          ? [
              {
                name: medicationName.trim(),
                dosage: medicationDosage.trim(),
              },
            ]
          : [],

        surgeries: surgeryName.trim()
          ? [
              {
                name: surgeryName.trim(),
              },
            ]
          : [],

        familyHistory: familyHistory.trim(),
        lifestyleNotes: lifestyleNotes.trim(),
      };

      const response = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          age: Number(age),
          gender,
          bloodGroup: bloodGroup || 'Unknown',
          phone: phone.trim(),
          email: email.trim(),
          medicalHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to add patient'
        );
      }

      const newPatient = data.patient;

      setPatients((currentPatients) => [
        newPatient,
        ...currentPatients,
      ]);

      setSelectedPatient(newPatient);
      setInsights([]);
      setInsight(null);
      setSymptoms('');
      setCurrentCondition('');

      resetPatientForm();

      setShowAddPatient(false);
      setActivePage('patients');
      setMobileMenu(false);

      setSuccess('Patient added successfully');
    } catch (err) {
      setError(err.message || 'Failed to add patient');
    } finally {
      setPatientSaving(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    clearMessages();
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
    setSuccess('');
    setEmail('');
    setPassword('');
    setActivePage('dashboard');
    setMobileMenu(false);
    setShowAddPatient(false);
    setPatientSearch('');
    resetPatientForm();
  };

  const openSettings = () => {
    clearMessages();

    setProfileForm({
      name: doctor?.name || '',
      email: doctor?.email || '',
      specialization: doctor?.specialization || '',
    });

    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    setActivePage('settings');
    setShowAddPatient(false);
    setMobileMenu(false);
  };

  const openPatientsPage = () => {
    clearMessages();
    setActivePage('patients');
    setShowAddPatient(false);
    setMobileMenu(false);
  };

  const openDashboard = () => {
    clearMessages();
    setActivePage('dashboard');
    setShowAddPatient(false);
    setMobileMenu(false);
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    clearMessages();

    if (
      !profileForm.name.trim() ||
      !profileForm.email.trim() ||
      !profileForm.specialization.trim()
    ) {
      setError(
        'Name, email and specialization are required'
      );
      return;
    }

    try {
      setProfileSaving(true);

      const response = await fetch(
        `${API_BASE}/auth/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem(
              'token'
            )}`,
          },
          body: JSON.stringify({
            name: profileForm.name.trim(),
            email: profileForm.email.trim(),
            specialization:
              profileForm.specialization.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Profile update failed'
        );
      }

      setDoctor(data.doctor);

      setProfileForm({
        name: data.doctor.name,
        email: data.doctor.email,
        specialization: data.doctor.specialization,
      });

      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.message || 'Profile update failed');
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setError('Please complete all password fields');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError(
        'New password must be at least 8 characters'
      );
      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setError('New passwords do not match');
      return;
    }

    try {
      setPasswordSaving(true);

      const response = await fetch(
        `${API_BASE}/auth/password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem(
              'token'
            )}`,
          },
          body: JSON.stringify({
            currentPassword:
              passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Password change failed'
        );
      }

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setSuccess('Password changed successfully');
    } catch (err) {
      setError(
        err.message || 'Password change failed'
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setError(
        'Please type DELETE to confirm account deletion'
      );
      return;
    }

    try {
      setDeletingAccount(true);
      clearMessages();

      const response = await fetch(
        `${API_BASE}/auth/me`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              'token'
            )}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Account deletion failed'
        );
      }

      localStorage.removeItem('token');

      setDeleteModal(false);
      setDeleteConfirmation('');
      setDoctor(null);
      setPatients([]);
      setSelectedPatient(null);
      setInsight(null);
      setInsights([]);
      setActivePage('dashboard');
      setShowAddPatient(false);
      setPatientSearch('');
      resetPatientForm();

      setSuccess(
        'Your account has been deleted successfully.'
      );
    } catch (err) {
      setError(
        err.message || 'Account deletion failed'
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const openEditPatient = (patient) => {
    clearMessages();
    setEditForm(patientToForm(patient));
    setEditErrors({});
    setEditFormError('');
    setEditingPatient(patient);
  };

  const closeEditPatient = () => {
    if (editSaving) return;

    setEditingPatient(null);
  };

  const updateEditField = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));

    setEditErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const renderEditFieldError = (field) =>
    editErrors[field] ? (
      <small className="field-error" role="alert">
        {editErrors[field]}
      </small>
    ) : null;

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editingPatient || editSaving) return;

    setEditFormError('');

    const validationErrors = validatePatientForm(editForm);
    setEditErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setEditFormError('Please fix the highlighted fields.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setEditFormError(
        'Your session has expired. Please sign in again.'
      );
      return;
    }

    try {
      setEditSaving(true);

      const response = await fetch(
        `${API_BASE}/patients/${editingPatient._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editForm.name.trim(),
            age: Number(editForm.age),
            gender: editForm.gender,
            bloodGroup: editForm.bloodGroup || 'Unknown',
            phone: editForm.phone.trim(),
            email: editForm.email.trim(),
            medicalHistory: buildMedicalHistory(
              editForm,
              editingPatient.medicalHistory
            ),
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const fieldErrors = {};
        const otherMessages = [];

        if (Array.isArray(data?.errors)) {
          data.errors.forEach((item) => {
            if (EDIT_FORM_FIELDS.includes(item.field)) {
              fieldErrors[item.field] = item.message;
            } else if (item.message) {
              otherMessages.push(item.message);
            }
          });
        }

        setEditErrors(fieldErrors);

        if (response.status === 401) {
          setEditFormError(
            'Your session has expired. Please sign in again.'
          );
        } else if (response.status === 404) {
          setEditFormError(
            'This patient no longer exists. Close this window; the list has been refreshed.'
          );
          loadPatients();
        } else if (response.status >= 500) {
          setEditFormError(
            'Something went wrong on our side. Please try again later.'
          );
        } else if (otherMessages.length > 0) {
          setEditFormError(otherMessages.join('. '));
        } else if (Object.keys(fieldErrors).length > 0) {
          setEditFormError('Please fix the highlighted fields.');
        } else {
          setEditFormError(
            data?.message || 'Failed to update patient'
          );
        }

        return;
      }

      const updatedPatient = data.patient;

      setPatients((currentPatients) =>
        currentPatients.map((item) =>
          item._id === updatedPatient._id
            ? updatedPatient
            : item
        )
      );

      setSelectedPatient((current) =>
        current && current._id === updatedPatient._id
          ? updatedPatient
          : current
      );

      setEditingPatient(null);
      setError('');
      setSuccess(
        `${updatedPatient.name} was updated successfully`
      );
    } catch (err) {
      setEditFormError(
        err instanceof TypeError
          ? 'Cannot reach the server. Check your connection and try again.'
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setEditSaving(false);
    }
  };

  const openDeletePatient = (patient) => {
    clearMessages();
    setDeleteError('');
    setPatientToDelete(patient);
  };

  const closeDeletePatient = () => {
    if (deletingPatient) return;

    setPatientToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete || deletingPatient) return;

    const token = localStorage.getItem('token');

    if (!token) {
      setDeleteError(
        'Your session has expired. Please sign in again.'
      );
      return;
    }

    const { _id: deletedId, name: deletedName } =
      patientToDelete;

    try {
      setDeletingPatient(true);
      setDeleteError('');

      const response = await fetch(
        `${API_BASE}/patients/${deletedId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (response.status === 404) {
        // Already gone on the server: refresh the list instead of guessing
        setPatientToDelete(null);
        setError(
          'That patient no longer exists. The list has been refreshed.'
        );
        loadPatients();
        return;
      }

      if (!response.ok || !data?.success) {
        setDeleteError(
          response.status === 401
            ? 'Your session has expired. Please sign in again.'
            : response.status >= 500
            ? 'Something went wrong on our side. Please try again later.'
            : data?.message || 'Failed to delete patient'
        );
        return;
      }

      // Only now, after the server confirmed, remove it from the screen
      setPatients((currentPatients) =>
        currentPatients.filter(
          (item) => item._id !== deletedId
        )
      );

      if (selectedPatient?._id === deletedId) {
        setSelectedPatient(null);
        setInsights([]);
        setInsight(null);
        setSymptoms('');
        setCurrentCondition('');
      }

      setPatientToDelete(null);
      setError('');
      setSuccess(`${deletedName} was deleted`);
    } catch (err) {
      setDeleteError(
        err instanceof TypeError
          ? 'Cannot reach the server. Check your connection and try again.'
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setDeletingPatient(false);
    }
  };

  // Escape closes whichever dialog is open (unless a save/delete is running)
  useEffect(() => {
    if (!editingPatient && !patientToDelete) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (editSaving || deletingPatient) return;

      setEditingPatient(null);
      setPatientToDelete(null);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () =>
      window.removeEventListener('keydown', handleKeyDown);
  }, [editingPatient, patientToDelete, editSaving, deletingPatient]);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');

    if (!savedToken) return;

    const loadDoctor = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          }
        );

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

      setProfileForm({
        name: doctor.name || '',
        email: doctor.email || '',
        specialization:
          doctor.specialization || '',
      });
    }
  }, [doctor]);

  if (!doctor) {
    return (
      <div className="login-page">
        <div className="login-shell">
          <section className="login-hero">
            <div className="hero-glow hero-glow-one" />
            <div className="hero-glow hero-glow-two" />

            <div className="hero-content">
              <div className="hero-brand">
                <div className="brand-icon">+</div>

                <div>
                  <strong>Smart Patient</strong>
                  <span>Dashboard</span>
                </div>
              </div>

              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  Clinical decision support
                </div>

                <h1>
                  Better decisions.
                  <br />
                  <span>Better patient care.</span>
                </h1>

                <p>
                  A secure workspace for doctors to review
                  patients, understand clinical information
                  and use AI-assisted decision support.
                </p>
              </div>

              <div className="hero-features">
                <div className="hero-feature">
                  <span className="feature-check">
                    <Check size={15} />
                  </span>

                  <div>
                    <strong>Patient overview</strong>
                    <span>
                      Keep important clinical information
                      together.
                    </span>
                  </div>
                </div>

                <div className="hero-feature">
                  <span className="feature-check">
                    <Check size={15} />
                  </span>

                  <div>
                    <strong>AI-assisted analysis</strong>
                    <span>
                      Review symptoms with safety-focused
                      insights.
                    </span>
                  </div>
                </div>

                <div className="hero-feature">
                  <span className="feature-check">
                    <Check size={15} />
                  </span>

                  <div>
                    <strong>Secure access</strong>
                    <span>
                      Designed with authentication and safety
                      in mind.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <img
              src={heroImage}
              alt=""
              className="hero-image"
            />

            <div className="hero-bottom">
              <span>SMART PATIENT DASHBOARD</span>
              <span>Healthcare • AI • Security</span>
            </div>
          </section>

          <section className="login-section">
            <div className="login-card">
              <div className="mobile-brand">
                <div className="brand-icon">+</div>

                <div>
                  <strong>Smart Patient</strong>
                  <span>Dashboard</span>
                </div>
              </div>

              <div className="login-heading">
                <span className="login-kicker">
                  DOCTOR PORTAL
                </span>

                <h2>
                  {authMode === 'login'
                    ? 'Welcome back'
                    : 'Create your account'}
                </h2>

                <p>
                  {authMode === 'login'
                    ? 'Sign in to securely access your patient dashboard.'
                    : 'Create a secure account for your clinical workspace.'}
                </p>
              </div>

              {authMode === 'login' ? (
                <form
                  onSubmit={handleLogin}
                  className="login-form"
                >
                  <label>
                    <span>Email address</span>

                    <input
                      type="email"
                      placeholder="doctor@example.com"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      autoComplete="email"
                    />
                  </label>

                  <label>
                    <span>Password</span>

                    <div className="password-input">
                      <input
                        type={
                          showLoginPassword
                            ? 'text'
                            : 'password'
                        }
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        autoComplete="current-password"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowLoginPassword(
                            !showLoginPassword
                          )
                        }
                        aria-label="Show password"
                      >
                        {showLoginPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </label>

                  {error && (
                    <div className="error-box login-error">
                      <span>!</span>
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="success-box">
                      <Check size={16} />
                      {success}
                    </div>
                  )}

                  <button
                    className="primary-button login-submit"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="button-spinner" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleRegister}
                  className="login-form"
                >
                  <label>
                    <span>Full name</span>

                    <input
                      type="text"
                      placeholder="Dr. John Smith"
                      value={registerForm.name}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          name: e.target.value,
                        })
                      }
                      autoComplete="name"
                    />
                  </label>

                  <label>
                    <span>Email address</span>

                    <input
                      type="email"
                      placeholder="doctor@example.com"
                      value={registerForm.email}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          email: e.target.value,
                        })
                      }
                      autoComplete="email"
                    />
                  </label>

                  <label>
                    <span>Specialization</span>

                    <input
                      type="text"
                      placeholder="Cardiology"
                      value={registerForm.specialization}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          specialization:
                            e.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Password</span>

                    <div className="password-input">
                      <input
                        type={
                          showRegisterPassword
                            ? 'text'
                            : 'password'
                        }
                        placeholder="Minimum 8 characters"
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            password: e.target.value,
                          })
                        }
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowRegisterPassword(
                            !showRegisterPassword
                          )
                        }
                        aria-label="Show password"
                      >
                        {showRegisterPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </label>

                  <label>
                    <span>Confirm password</span>

                    <div className="password-input">
                      <input
                        type={
                          showRegisterConfirmPassword
                            ? 'text'
                            : 'password'
                        }
                        placeholder="Repeat your password"
                        value={
                          registerForm.confirmPassword
                        }
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            confirmPassword:
                              e.target.value,
                          })
                        }
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowRegisterConfirmPassword(
                            !showRegisterConfirmPassword
                          )
                        }
                        aria-label="Show confirm password"
                      >
                        {showRegisterConfirmPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </label>

                  {error && (
                    <div className="error-box login-error">
                      <span>!</span>
                      {error}
                    </div>
                  )}

                  <button
                    className="primary-button login-submit"
                    type="submit"
                    disabled={registerLoading}
                  >
                    {registerLoading ? (
                      <>
                        <span className="button-spinner" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}

              <button
                type="button"
                className="auth-switch"
                onClick={() => {
                  clearMessages();

                  setAuthMode(
                    authMode === 'login'
                      ? 'register'
                      : 'login'
                  );
                }}
              >
                {authMode === 'login'
                  ? "Don't have an account?"
                  : 'Already have an account?'}

                <strong>
                  {authMode === 'login'
                    ? ' Sign up'
                    : ' Sign in'}
                </strong>
              </button>

              <div className="login-security">
                <span className="security-icon">
                  <ShieldCheck size={18} />
                </span>

                <div>
                  <strong>
                    Secure clinical workspace
                  </strong>

                  <span>
                    Your session is protected with secure
                    authentication.
                  </span>
                </div>
              </div>

              <p className="login-disclaimer">
                For authorized healthcare professionals only.
                AI output is intended as clinical decision
                support, not a diagnosis.
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const renderAddPatient = () => (
    <section className="settings-page add-patient-page">
      <div className="settings-heading">
        <div>
          <span className="dashboard-kicker">
            PATIENT MANAGEMENT
          </span>

          <h1>Add Patient</h1>

          <p>
            Add patient information and medical history to
            your secure clinical workspace.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={closeAddPatient}
        >
          <X size={17} />
          Cancel
        </button>
      </div>

      {error && (
        <div className="error-box dashboard-error">
          <span>!</span>
          {error}
        </div>
      )}

      <form
        className="patient-form-card"
        onSubmit={handleAddPatient}
      >
        <section className="form-section">
          <div className="form-section-heading">
            <div className="settings-card-icon blue">
              <UserRound size={20} />
            </div>

            <div>
              <h2>Basic Information</h2>
              <p>
                Enter the patient's basic details.
              </p>
            </div>
          </div>

          <div className="patient-form-grid">
            <label>
              <span>Full name *</span>

              <input
                type="text"
                value={patientForm.name}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    name: e.target.value,
                  })
                }
                placeholder="Patient full name"
                autoComplete="name"
              />
            </label>

            <label>
              <span>Age *</span>

              <input
                type="number"
                min="0"
                max="130"
                value={patientForm.age}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    age: e.target.value,
                  })
                }
                placeholder="Age"
              />
            </label>

            <label>
              <span>Gender *</span>

              <select
                value={patientForm.gender}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    gender: e.target.value,
                  })
                }
              >
                <option value="">
                  Select gender
                </option>
                <option value="Male">Male</option>
                <option value="Female">
                  Female
                </option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              <span>Blood group</span>

              <select
                value={patientForm.bloodGroup}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    bloodGroup: e.target.value,
                  })
                }
              >
                <option value="Unknown">
                  Unknown
                </option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </label>

            <label>
              <span>Phone</span>

              <input
                type="tel"
                value={patientForm.phone}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    phone: e.target.value,
                  })
                }
                placeholder="+91 98765 43210"
                autoComplete="tel"
              />
            </label>

            <label>
              <span>Email</span>

              <input
                type="email"
                value={patientForm.email}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    email: e.target.value,
                  })
                }
                placeholder="patient@example.com"
                autoComplete="email"
              />
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <div className="settings-card-icon purple">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2>Medical History</h2>
              <p>
                Add important clinical information.
              </p>
            </div>
          </div>

          <div className="patient-form-grid">
            <label>
              <span>Condition</span>

              <input
                type="text"
                value={patientForm.conditionName}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    conditionName: e.target.value,
                  })
                }
                placeholder="e.g. Hypertension"
              />
            </label>

            <label>
              <span>Condition notes</span>

              <input
                type="text"
                value={patientForm.conditionNotes}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    conditionNotes: e.target.value,
                  })
                }
                placeholder="Additional notes"
              />
            </label>

            <label>
              <span>Allergy</span>

              <input
                type="text"
                value={patientForm.allergySubstance}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    allergySubstance: e.target.value,
                  })
                }
                placeholder="e.g. Penicillin"
              />
            </label>

            <label>
              <span>Allergy reaction</span>

              <input
                type="text"
                value={patientForm.allergyReaction}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    allergyReaction: e.target.value,
                  })
                }
                placeholder="e.g. Rash"
              />
            </label>

            <label>
              <span>Medication</span>

              <input
                type="text"
                value={patientForm.medicationName}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    medicationName: e.target.value,
                  })
                }
                placeholder="e.g. Metformin"
              />
            </label>

            <label>
              <span>Dosage</span>

              <input
                type="text"
                value={patientForm.medicationDosage}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    medicationDosage:
                      e.target.value,
                  })
                }
                placeholder="e.g. 500 mg twice daily"
              />
            </label>

            <label>
              <span>Previous surgery</span>

              <input
                type="text"
                value={patientForm.surgeryName}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    surgeryName: e.target.value,
                  })
                }
                placeholder="e.g. Appendectomy"
              />
            </label>
          </div>

          <div className="patient-form-full">
            <label>
              <span>Family history</span>

              <textarea
                rows="3"
                maxLength="1000"
                value={patientForm.familyHistory}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    familyHistory:
                      e.target.value,
                  })
                }
                placeholder="Relevant family medical history..."
              />

              <small>
                {patientForm.familyHistory.length}/1000
              </small>
            </label>

            <label>
              <span>Lifestyle notes</span>

              <textarea
                rows="3"
                maxLength="1000"
                value={patientForm.lifestyleNotes}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    lifestyleNotes:
                      e.target.value,
                  })
                }
                placeholder="Smoking, alcohol, exercise, diet, etc..."
              />

              <small>
                {patientForm.lifestyleNotes.length}/1000
              </small>
            </label>
          </div>
        </section>

        <div className="patient-form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={closeAddPatient}
            disabled={patientSaving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={patientSaving}
          >
            {patientSaving ? (
              <>
                <span className="button-spinner" />
                Saving patient...
              </>
            ) : (
              <>
                <Check size={17} />
                Save Patient
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );

  const renderPatientList = () => (
    <section className="patients-page">
      {showAddPatient ? (
        renderAddPatient()
      ) : (
        <>
          <section className="welcome-section patients-page-heading">
            <div>
              <div className="dashboard-kicker">
                <Users size={15} />
                PATIENT MANAGEMENT
              </div>

              <h1>Patients</h1>

              <p>
                Search, review and manage your patient
                records from one secure workspace.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={openAddPatient}
            >
              <UserRound size={17} />
              Add Patient
            </button>
          </section>

          {success && (
            <div className="success-box dashboard-message">
              <Check size={16} />
              {success}
            </div>
          )}

          {error && (
            <div className="error-box dashboard-message">
              <span>!</span>
              {error}
            </div>
          )}

          <section className="patients-management-card">
            <div className="patients-management-header">
              <div>
                <div className="panel-title">
                  <Users size={19} />

                  <div>
                    <h2>All Patients</h2>

                    <span>
                      {patients.length} patient
                      {patients.length !== 1
                        ? 's'
                        : ''}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="refresh-button"
                onClick={loadPatients}
                disabled={patientsLoading}
                title="Refresh patients"
                type="button"
              >
                <RefreshCw
                  size={16}
                  className={
                    patientsLoading ? 'spin' : ''
                  }
                />

                <span>Refresh</span>
              </button>
            </div>

            <div className="patient-search">
              <Search size={18} />

              <input
                type="search"
                value={patientSearch}
                onChange={(e) =>
                  setPatientSearch(e.target.value)
                }
                placeholder="Search patients by name, phone or email..."
              />

              {patientSearch && (
                <button
                  type="button"
                  onClick={() => setPatientSearch('')}
                  aria-label="Clear patient search"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            {patientsLoading ? (
              <div className="empty-state">
                <div className="loading-circle" />
                <span>Loading patients...</span>
              </div>
            ) : patients.length === 0 ? (
              <div className="empty-state patient-empty-state">
                <UserRound size={34} />

                <strong>No patients found</strong>

                <span>
                  Add your first patient to get started.
                </span>

                <button
                  type="button"
                  className="primary-button"
                  onClick={openAddPatient}
                >
                  <UserRound size={16} />
                  Add Patient
                </button>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="empty-state patient-empty-state">
                <Search size={32} />

                <strong>No matching patients</strong>

                <span>
                  Try another name, phone number or email.
                </span>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setPatientSearch('')
                  }
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="patient-management-list">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient._id}
                    className={`patient-management-item ${
                      selectedPatient?._id ===
                      patient._id
                        ? 'selected'
                        : ''
                    }`}
                  >
                    <button
                      className="patient-management-select"
                      onClick={async () => {
                        await handleSelectPatient(
                          patient
                        );

                        setActivePage('dashboard');
                      }}
                      aria-label={`Open ${patient.name}`}
                      type="button"
                    >
                      <span className="patient-avatar">
                        {patient.name
                          ?.charAt(0)
                          ?.toUpperCase() || '?'}
                      </span>

                      <span className="patient-management-info">
                        <strong>{patient.name}</strong>

                        <span>
                          {patient.age} years ·{' '}
                          {patient.gender}
                        </span>

                        <small>
                          {patient.phone ||
                            patient.email ||
                            'No contact information'}
                        </small>
                      </span>
                    </button>

                    <div className="patient-management-right">
                      <span className="patient-record-status">
                        Active record
                      </span>

                      <button
                        className="patient-action-button"
                        onClick={() =>
                          openEditPatient(patient)
                        }
                        aria-label={`Edit ${patient.name}`}
                        title="Edit patient"
                        type="button"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="patient-action-button danger"
                        onClick={() =>
                          openDeletePatient(patient)
                        }
                        aria-label={`Delete ${patient.name}`}
                        title="Delete patient"
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );

  const renderDashboard = () => (
    <>
      {showAddPatient ? (
        renderAddPatient()
      ) : (
        <>
          <section className="welcome-section">
            <div>
              <div className="dashboard-kicker">
                <Sparkles size={15} />
                DOCTOR WORKSPACE
              </div>

              <h1>Patient Dashboard</h1>

              <p>
                Review patient information and run
                AI-assisted clinical analysis from one
                secure workspace.
              </p>
            </div>

            <div className="dashboard-stats">
              <div className="mini-stat">
                <div className="mini-stat-icon blue">
                  <Users size={18} />
                </div>

                <div>
                  <strong>{patients.length}</strong>
                  <span>Patients</span>
                </div>
              </div>

              <div className="mini-stat">
                <div className="mini-stat-icon purple">
                  <Brain size={18} />
                </div>

                <div>
                  <strong>AI</strong>
                  <span>Decision support</span>
                </div>
              </div>
            </div>
          </section>

          {success && (
            <div className="success-box dashboard-message">
              <Check size={16} />
              {success}
            </div>
          )}

          <div className="dashboard-grid">
            <aside className="patients-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Users size={18} />

                  <div>
                    <h2>Patients</h2>

                    <span>
                      {patients.length} patient
                      {patients.length !== 1
                        ? 's'
                        : ''}
                    </span>
                  </div>
                </div>

                <button
                  className="refresh-button"
                  onClick={loadPatients}
                  disabled={patientsLoading}
                  title="Refresh patients"
                  type="button"
                >
                  <RefreshCw
                    size={16}
                    className={
                      patientsLoading ? 'spin' : ''
                    }
                  />

                  <span>Refresh</span>
                </button>
              </div>

              <div className="patient-search dashboard-patient-search">
                <Search size={17} />

                <input
                  type="search"
                  value={patientSearch}
                  onChange={(e) =>
                    setPatientSearch(e.target.value)
                  }
                  placeholder="Search patients..."
                />

                {patientSearch && (
                  <button
                    type="button"
                    onClick={() =>
                      setPatientSearch('')
                    }
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {patientsLoading ? (
                <div className="empty-state">
                  <div className="loading-circle" />
                  <span>Loading patients...</span>
                </div>
              ) : patients.length === 0 ? (
                <div className="empty-state">
                  <UserRound size={30} />

                  <strong>No patients found</strong>

                  <span>
                    Add your first patient to get started.
                  </span>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={openAddPatient}
                  >
                    <UserRound size={16} />
                    Add Patient
                  </button>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="empty-state">
                  <Search size={28} />

                  <strong>No matching patients</strong>

                  <span>
                    Try a different search.
                  </span>
                </div>
              ) : (
                <div className="patient-list">
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient._id}
                      className={`patient-item ${
                        selectedPatient?._id ===
                        patient._id
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        handleSelectPatient(patient)
                      }
                      type="button"
                    >
                      <div className="patient-avatar">
                        {patient.name
                          ?.charAt(0)
                          ?.toUpperCase() || '?'}
                      </div>

                      <div className="patient-info">
                        <strong>
                          {patient.name}
                        </strong>

                        <span>
                          {patient.age} years ·{' '}
                          {patient.gender}
                        </span>
                      </div>

                      <ChevronRight
                        size={18}
                        className="patient-arrow"
                      />
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="analysis-panel">
              {!selectedPatient ? (
                <div className="select-patient-state">
                  <div className="select-icon">
                    <Users size={28} />
                  </div>

                  <span className="select-kicker">
                    GET STARTED
                  </span>

                  <h2>Select a patient</h2>

                  <p>
                    Choose a patient from the list to view
                    their medical information and start
                    an AI-assisted clinical analysis.
                  </p>

                  <div className="select-hint">
                    <span>
                      <Check size={14} />
                    </span>
                    Patient history
                  </div>

                  <div className="select-hint">
                    <span>
                      <Check size={14} />
                    </span>
                    AI safety analysis
                  </div>
                </div>
              ) : (
                <>
                  <div className="patient-header">
                    <div className="patient-avatar large">
                      {selectedPatient.name
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                    <div className="patient-main-info">
                      <span className="patient-label">
                        SELECTED PATIENT
                      </span>

                      <h2>
                        {selectedPatient.name}
                      </h2>

                      <p>
                        {selectedPatient.age} years ·{' '}
                        {selectedPatient.gender}

                        {selectedPatient.bloodGroup &&
                          ` · Blood group ${selectedPatient.bloodGroup}`}
                      </p>
                    </div>

                    <div className="patient-status">
                      <span className="status-dot" />
                      Active record
                    </div>
                  </div>

                  <div className="medical-history">
                    <div className="section-heading">
                      <div>
                        <span>
                          PATIENT INFORMATION
                        </span>

                        <h3>Medical History</h3>
                      </div>
                    </div>

                    <div className="history-grid">
                      <div className="history-item">
                        <span>Conditions</span>

                        <strong>
                          {selectedPatient
                            .medicalHistory
                            ?.conditions?.length
                            ? selectedPatient.medicalHistory.conditions
                                .map(
                                  (item) =>
                                    item.name
                                )
                                .join(', ')
                            : 'None recorded'}
                        </strong>
                      </div>

                      <div className="history-item">
                        <span>Allergies</span>

                        <strong>
                          {selectedPatient
                            .medicalHistory
                            ?.allergies?.length
                            ? selectedPatient.medicalHistory.allergies
                                .map(
                                  (item) =>
                                    item.substance
                                )
                                .join(', ')
                            : 'None recorded'}
                        </strong>
                      </div>

                      <div className="history-item">
                        <span>Medications</span>

                        <strong>
                          {selectedPatient
                            .medicalHistory
                            ?.medications?.length
                            ? selectedPatient.medicalHistory.medications
                                .map(
                                  (item) =>
                                    item.name
                                )
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
                      <div className="analysis-title-icon">
                        <Brain size={20} />
                      </div>

                      <div>
                        <span className="section-kicker">
                          AI DECISION SUPPORT
                        </span>

                        <h3>Clinical Analysis</h3>

                        <p>
                          Enter the patient's current
                          symptoms for safety-focused
                          decision support.
                        </p>
                      </div>
                    </div>

                    <label>
                      <span className="input-label">
                        Symptoms
                        <em>Required</em>
                      </span>

                      <textarea
                        rows="5"
                        maxLength="3000"
                        placeholder="Example: sudden chest pain since morning..."
                        value={symptoms}
                        onChange={(e) =>
                          setSymptoms(
                            e.target.value
                          )
                        }
                      />

                      <small>
                        {symptoms.length}/3000
                      </small>
                    </label>

                    <label>
                      <span className="input-label">
                        Current Condition
                        <em>Optional</em>
                      </span>

                      <textarea
                        rows="3"
                        maxLength="2000"
                        placeholder="Add any additional clinical context..."
                        value={currentCondition}
                        onChange={(e) =>
                          setCurrentCondition(
                            e.target.value
                          )
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
                      {aiLoading ? (
                        <>
                          <span className="button-spinner" />
                          Analyzing patient...
                        </>
                      ) : (
                        <>
                          <Brain size={18} />
                          Analyze with AI
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                  </form>

                  {insight && (
                    <AIResultCard insight={insight} />
                  )}

                  <div className="history-panel">
                    <div className="section-title">
                      <div className="history-icon">
                        <Clock3 size={19} />
                      </div>

                      <div>
                        <span className="section-kicker">
                          PATIENT TIMELINE
                        </span>

                        <h3>
                          Previous AI Analyses
                        </h3>

                        <p>
                          Previous analyses recorded
                          for this patient.
                        </p>
                      </div>
                    </div>

                    {insights.length === 0 ? (
                      <div className="empty-state compact">
                        <Clock3 size={25} />

                        <span>
                          No previous analyses for
                          this patient.
                        </span>
                      </div>
                    ) : (
                      <div className="previous-list">
                        {insights.map((item) => (
                          <div
                            className={`previous-item risk-${String(
                              item.riskLevel || ''
                            ).toLowerCase()}`}
                            key={item._id}
                          >
                            <div className="previous-top">
                              <strong>
                                {item.riskLevel
                                  ? `${item.riskLevel} Risk`
                                  : 'Not assessed'}
                              </strong>

                              <span>
                                {item.createdAt
                                  ? new Date(
                                      item.createdAt
                                    ).toLocaleString()
                                  : ''}
                              </span>
                            </div>

                            <p>
                              {item.symptoms}
                            </p>

                            {item.escalatedBySafetyRules && (
                              <span className="safety-label">
                                Safety rules escalated
                                this result
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
        </>
      )}
    </>
  );

  const renderSettings = () => (
    <section className="settings-page">
      <div className="settings-heading">
        <div>
          <span className="dashboard-kicker">
            ACCOUNT MANAGEMENT
          </span>

          <h1>Settings</h1>

          <p>
            Manage your profile, security and account
            preferences.
          </p>
        </div>
      </div>

      {success && (
        <div className="success-box settings-message">
          <Check size={17} />
          {success}
        </div>
      )}

      {error && (
        <div className="error-box settings-message">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon blue">
              <UserRound size={20} />
            </div>

            <div>
              <h2>Profile</h2>
              <p>
                Update your professional information.
              </p>
            </div>
          </div>

          <form
            className="settings-form"
            onSubmit={updateProfile}
          >
            <label>
              <span>Full name</span>

              <input
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    name: e.target.value,
                  })
                }
                placeholder="Dr. John Smith"
              />
            </label>

            <label>
              <span>Email address</span>

              <input
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    email: e.target.value,
                  })
                }
                placeholder="doctor@example.com"
              />
            </label>

            <label>
              <span>Specialization</span>

              <input
                value={profileForm.specialization}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    specialization:
                      e.target.value,
                  })
                }
                placeholder="Cardiology"
              />
            </label>

            <button
              type="submit"
              className="primary-button settings-save"
              disabled={profileSaving}
            >
              {profileSaving ? (
                <>
                  <span className="button-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={17} />
                  Save changes
                </>
              )}
            </button>
          </form>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon purple">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2>Security</h2>
              <p>
                Protect your account with a strong
                password.
              </p>
            </div>
          </div>

          <form
            className="settings-form"
            onSubmit={changePassword}
          >
            <label>
              <span>Current password</span>

              <div className="password-input">
                <input
                  type={
                    showCurrentPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    passwordForm.currentPassword
                  }
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword:
                        e.target.value,
                    })
                  }
                  placeholder="Enter current password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword(
                      !showCurrentPassword
                    )
                  }
                  aria-label="Show current password"
                >
                  {showCurrentPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            <label>
              <span>New password</span>

              <div className="password-input">
                <input
                  type={
                    showNewPassword
                      ? 'text'
                      : 'password'
                  }
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword:
                        e.target.value,
                    })
                  }
                  placeholder="Minimum 8 characters"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      !showNewPassword
                    )
                  }
                  aria-label="Show new password"
                >
                  {showNewPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            <label>
              <span>Confirm new password</span>

              <div className="password-input">
                <input
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    passwordForm.confirmPassword
                  }
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword:
                        e.target.value,
                    })
                  }
                  placeholder="Repeat new password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  aria-label="Show confirm password"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="primary-button settings-save"
              disabled={passwordSaving}
            >
              {passwordSaving ? (
                <>
                  <span className="button-spinner" />
                  Updating...
                </>
              ) : (
                <>
                  <ShieldCheck size={17} />
                  Change password
                </>
              )}
            </button>
          </form>
        </section>

        <section className="settings-card account-card">
          <div className="settings-card-header">
            <div className="settings-card-icon slate">
              <Settings size={20} />
            </div>

            <div>
              <h2>Account</h2>

              <p>
                Information about your Smart Patient
                account.
              </p>
            </div>
          </div>

          <div className="account-info-list">
            <div>
              <span>Account name</span>
              <strong>{doctor.name}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{doctor.email}</strong>
            </div>

            <div>
              <span>Specialization</span>
              <strong>
                {doctor.specialization}
              </strong>
            </div>

            {doctor.createdAt && (
              <div>
                <span>Member since</span>

                <strong>
                  {new Date(
                    doctor.createdAt
                  ).toLocaleDateString()}
                </strong>
              </div>
            )}
          </div>
        </section>

        <section className="settings-card danger-card">
          <div className="settings-card-header">
            <div className="settings-card-icon red">
              <Trash2 size={20} />
            </div>

            <div>
              <h2>Delete account</h2>

              <p>
                Permanently remove your account and
                associated data.
              </p>
            </div>
          </div>

          <div className="danger-content">
            <div className="danger-warning">
              <ShieldAlert size={18} />

              <div>
                <strong>
                  This action cannot be undone
                </strong>

                <p>
                  Deleting your account will permanently
                  remove your doctor profile, patients
                  and AI analysis history.
                </p>
              </div>
            </div>

            <button
              className="delete-button"
              onClick={() => {
                clearMessages();
                setDeleteConfirmation('');
                setDeleteModal(true);
              }}
              type="button"
            >
              <Trash2 size={16} />
              Delete my account
            </button>
          </div>
        </section>
      </div>
    </section>
  );

  return (
    <div className="app dashboard-app">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-icon small">+</div>

          <div>
            <strong>
              Smart Patient Dashboard
            </strong>

            <span>
              Clinical decision support
            </span>
          </div>
        </div>

        <button
          className="mobile-menu-button"
          onClick={() =>
            setMobileMenu(!mobileMenu)
          }
          aria-label="Open menu"
          type="button"
        >
          {mobileMenu ? (
            <X size={20} />
          ) : (
            <Settings size={20} />
          )}
        </button>

        <div className="doctor-area">
          <div className="doctor-avatar">
            {doctor.name
              ?.charAt(0)
              ?.toUpperCase() || 'D'}
          </div>

          <div className="doctor-info">
            <strong>{doctor.name}</strong>

            <span>
              {doctor.specialization ||
                'Doctor'}
            </span>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <div
        className={`app-layout ${
          mobileMenu ? 'mobile-open' : ''
        }`}
      >
        <aside className="sidebar">
          <div className="sidebar-section">
            <span className="sidebar-label">
              WORKSPACE
            </span>

            <button
              className={`sidebar-link ${
                activePage === 'dashboard'
                  ? 'active'
                  : ''
              }`}
              onClick={openDashboard}
              type="button"
            >
              <Brain size={18} />
              <span>Dashboard</span>
            </button>

            <button
              className={`sidebar-link ${
                activePage === 'patients'
                  ? 'active'
                  : ''
              }`}
              onClick={openPatientsPage}
              type="button"
            >
              <Users size={18} />
              <span>Patients</span>
              <small>{patients.length}</small>
            </button>
          </div>

          <div className="sidebar-section">
            <span className="sidebar-label">
              ACCOUNT
            </span>

            <button
              className={`sidebar-link ${
                activePage === 'settings'
                  ? 'active'
                  : ''
              }`}
              onClick={openSettings}
              type="button"
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </div>

          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <div className="doctor-avatar">
                {doctor.name
                  ?.charAt(0)
                  ?.toUpperCase() || 'D'}
              </div>

              <div>
                <strong>{doctor.name}</strong>
                <span>{doctor.email}</span>
              </div>
            </div>

            <button
              className="sidebar-logout"
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </aside>

        <main className="dashboard">
          {error &&
            activePage !== 'settings' &&
            !showAddPatient &&
            activePage !== 'patients' && (
              <div className="error-box dashboard-error">
                <span>!</span>
                {error}
              </div>
            )}

          {activePage === 'settings'
            ? renderSettings()
            : activePage === 'patients'
            ? renderPatientList()
            : renderDashboard()}
        </main>
      </div>

      {editingPatient && (
        <div
          className="modal-overlay"
          onClick={closeEditPatient}
        >
          <div
            className="edit-patient-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-patient-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-patient-header">
              <div className="settings-card-icon blue">
                <Pencil size={20} />
              </div>

              <div>
                <h2 id="edit-patient-title">
                  Edit Patient
                </h2>

                <p>
                  Update the details for{' '}
                  {editingPatient.name}. Changes are
                  saved to the patient record.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeEditPatient}
                disabled={editSaving}
                aria-label="Close edit patient"
                type="button"
              >
                <X size={19} />
              </button>
            </div>

            {editFormError && (
              <div
                className="error-box edit-patient-error"
                role="alert"
              >
                <span>!</span>
                {editFormError}
              </div>
            )}

            <form
              className="edit-patient-form"
              onSubmit={handleSaveEdit}
              noValidate
            >
              <section className="form-section">
                <div className="form-section-heading">
                  <div className="settings-card-icon blue">
                    <UserRound size={20} />
                  </div>

                  <div>
                    <h2>Basic Information</h2>
                    <p>
                      Fields marked * are required.
                    </p>
                  </div>
                </div>

                <div className="patient-form-grid">
                  <label>
                    <span>Full name *</span>

                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        updateEditField(
                          'name',
                          e.target.value
                        )
                      }
                      aria-invalid={Boolean(
                        editErrors.name
                      )}
                      autoComplete="off"
                      autoFocus
                    />

                    {renderEditFieldError('name')}
                  </label>

                  <label>
                    <span>Age *</span>

                    <input
                      type="number"
                      min="0"
                      max="130"
                      value={editForm.age}
                      onChange={(e) =>
                        updateEditField(
                          'age',
                          e.target.value
                        )
                      }
                      aria-invalid={Boolean(
                        editErrors.age
                      )}
                    />

                    {renderEditFieldError('age')}
                  </label>

                  <label>
                    <span>Gender *</span>

                    <select
                      value={editForm.gender}
                      onChange={(e) =>
                        updateEditField(
                          'gender',
                          e.target.value
                        )
                      }
                      aria-invalid={Boolean(
                        editErrors.gender
                      )}
                    >
                      <option value="">
                        Select gender
                      </option>
                      <option value="Male">Male</option>
                      <option value="Female">
                        Female
                      </option>
                      <option value="Other">Other</option>
                    </select>

                    {renderEditFieldError('gender')}
                  </label>

                  <label>
                    <span>Blood group</span>

                    <select
                      value={editForm.bloodGroup}
                      onChange={(e) =>
                        updateEditField(
                          'bloodGroup',
                          e.target.value
                        )
                      }
                      aria-invalid={Boolean(
                        editErrors.bloodGroup
                      )}
                    >
                      <option value="Unknown">
                        Unknown
                      </option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>

                    {renderEditFieldError('bloodGroup')}
                  </label>

                  <label>
                    <span>Phone</span>

                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        updateEditField(
                          'phone',
                          e.target.value
                        )
                      }
                      aria-invalid={Boolean(
                        editErrors.phone
                      )}
                      placeholder="+91 98765 43210"
                      autoComplete="off"
                    />

                    {renderEditFieldError('phone')}
                  </label>

                  <label>
                    <span>Email</span>

                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        updateEditField(
                          'email',
                          e.target.value
                        )
                      }
                      aria-invalid={Boolean(
                        editErrors.email
                      )}
                      placeholder="patient@example.com"
                      autoComplete="off"
                    />

                    {renderEditFieldError('email')}
                  </label>
                </div>
              </section>

              <section className="form-section">
                <div className="form-section-heading">
                  <div className="settings-card-icon purple">
                    <ShieldCheck size={20} />
                  </div>

                  <div>
                    <h2>Medical History</h2>
                    <p>
                      Edits the first entry of each
                      list. Other saved entries are
                      kept unchanged.
                    </p>
                  </div>
                </div>

                <div className="patient-form-grid">
                  <label>
                    <span>Condition</span>

                    <input
                      type="text"
                      value={editForm.conditionName}
                      onChange={(e) =>
                        updateEditField(
                          'conditionName',
                          e.target.value
                        )
                      }
                      placeholder="e.g. Hypertension"
                    />
                  </label>

                  <label>
                    <span>Condition notes</span>

                    <input
                      type="text"
                      value={editForm.conditionNotes}
                      onChange={(e) =>
                        updateEditField(
                          'conditionNotes',
                          e.target.value
                        )
                      }
                      placeholder="Additional notes"
                    />
                  </label>

                  <label>
                    <span>Allergy</span>

                    <input
                      type="text"
                      value={editForm.allergySubstance}
                      onChange={(e) =>
                        updateEditField(
                          'allergySubstance',
                          e.target.value
                        )
                      }
                      placeholder="e.g. Penicillin"
                    />
                  </label>

                  <label>
                    <span>Allergy reaction</span>

                    <input
                      type="text"
                      value={editForm.allergyReaction}
                      onChange={(e) =>
                        updateEditField(
                          'allergyReaction',
                          e.target.value
                        )
                      }
                      placeholder="e.g. Skin rash"
                    />
                  </label>

                  <label>
                    <span>Medication</span>

                    <input
                      type="text"
                      value={editForm.medicationName}
                      onChange={(e) =>
                        updateEditField(
                          'medicationName',
                          e.target.value
                        )
                      }
                      placeholder="e.g. Metformin"
                    />
                  </label>

                  <label>
                    <span>Medication dosage</span>

                    <input
                      type="text"
                      value={editForm.medicationDosage}
                      onChange={(e) =>
                        updateEditField(
                          'medicationDosage',
                          e.target.value
                        )
                      }
                      placeholder="e.g. 500 mg twice daily"
                    />
                  </label>

                  <label>
                    <span>Past surgery</span>

                    <input
                      type="text"
                      value={editForm.surgeryName}
                      onChange={(e) =>
                        updateEditField(
                          'surgeryName',
                          e.target.value
                        )
                      }
                      placeholder="e.g. Appendectomy"
                    />
                  </label>
                </div>

                <div className="patient-form-full">
                  <label>
                    <span>Family history</span>

                    <textarea
                      rows="3"
                      maxLength="1000"
                      value={editForm.familyHistory}
                      onChange={(e) =>
                        updateEditField(
                          'familyHistory',
                          e.target.value
                        )
                      }
                      placeholder="Relevant family medical history..."
                    />

                    <small>
                      {editForm.familyHistory.length}/1000
                    </small>
                  </label>

                  <label>
                    <span>Lifestyle notes</span>

                    <textarea
                      rows="3"
                      maxLength="1000"
                      value={editForm.lifestyleNotes}
                      onChange={(e) =>
                        updateEditField(
                          'lifestyleNotes',
                          e.target.value
                        )
                      }
                      placeholder="Smoking, alcohol, exercise, diet, etc..."
                    />

                    <small>
                      {editForm.lifestyleNotes.length}/1000
                    </small>
                  </label>
                </div>
              </section>

              <div className="patient-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeEditPatient}
                  disabled={editSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={editSaving}
                >
                  {editSaving ? (
                    <>
                      <span className="button-spinner" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {patientToDelete && (
        <div
          className="modal-overlay"
          onClick={closeDeletePatient}
        >
          <div
            className="delete-modal delete-patient-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-patient-title"
            aria-describedby="delete-patient-description"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={closeDeletePatient}
              disabled={deletingPatient}
              aria-label="Close delete confirmation"
              type="button"
            >
              <X size={19} />
            </button>

            <div className="delete-modal-icon">
              <Trash2 size={24} />
            </div>

            <h2 id="delete-patient-title">
              Delete {patientToDelete.name}?
            </h2>

            <p id="delete-patient-description">
              This will permanently remove this
              patient's record, including their saved
              AI analyses and appointments. This
              cannot be undone.
            </p>

            {deleteError && (
              <div
                className="error-box delete-patient-error"
                role="alert"
              >
                <span>!</span>
                {deleteError}
              </div>
            )}

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={closeDeletePatient}
                disabled={deletingPatient}
                type="button"
                autoFocus
              >
                Cancel
              </button>

              <button
                className="delete-button modal-delete"
                onClick={handleConfirmDelete}
                disabled={deletingPatient}
                type="button"
              >
                {deletingPatient ? (
                  <>
                    <span className="button-spinner" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!deletingAccount) {
              setDeleteModal(false);
            }
          }}
        >
          <div
            className="delete-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={() => {
                if (!deletingAccount) {
                  setDeleteModal(false);
                }
              }}
              disabled={deletingAccount}
              type="button"
            >
              <X size={19} />
            </button>

            <div className="delete-modal-icon">
              <Trash2 size={24} />
            </div>

            <h2>
              Delete your account?
            </h2>

            <p>
              This will permanently delete your
              doctor account, all patients and all
              AI analysis history associated with
              this account.
            </p>

            <div className="delete-confirm-box">
              <strong>
                Type DELETE to confirm
              </strong>

              <input
                value={deleteConfirmation}
                onChange={(e) =>
                  setDeleteConfirmation(
                    e.target.value
                  )
                }
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() =>
                  setDeleteModal(false)
                }
                disabled={deletingAccount}
                type="button"
              >
                Cancel
              </button>

              <button
                className="delete-button modal-delete"
                onClick={deleteAccount}
                disabled={
                  deletingAccount ||
                  deleteConfirmation !==
                    'DELETE'
                }
                type="button"
              >
                {deletingAccount ? (
                  <>
                    <span className="button-spinner" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Permanently delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
