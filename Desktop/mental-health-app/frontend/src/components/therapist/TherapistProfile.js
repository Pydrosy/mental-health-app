import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Button,
  Chip,
  Rating,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  OutlinedInput,
  InputAdornment,
  Tab,
  Tabs,
  Badge,
  Tooltip,
  Switch,
  FormControlLabel,
  Snackbar,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { therapists as therapistsApi, users, sessions as sessionsApi } from '../../services/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

// Icons
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import LanguageIcon from '@mui/icons-material/Language';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VerifiedIcon from '@mui/icons-material/Verified';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import StarIcon from '@mui/icons-material/Star';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarningIcon from '@mui/icons-material/Warning';
import ScheduleIcon from '@mui/icons-material/Schedule';
import MessageIcon from '@mui/icons-material/Message';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Constants
const specializationOptions = [
  'cognitive-behavioral', 'psychodynamic', 'humanistic', 'mindfulness',
  'trauma-focused', 'emdr', 'dialectical-behavioral', 'acceptance-commitment',
  'family-therapy', 'group-therapy', 'couples-counseling', 'child-psychology',
  'adolescent-psychology', 'addiction-counseling', 'eating-disorders',
  'anxiety', 'depression', 'ptsd', 'ocd', 'bipolar',
];

const languageOptions = [
  'English', 'Spanish', 'Mandarin', 'French', 'German', 'Arabic',
  'Hindi', 'Portuguese', 'Russian', 'Japanese', 'Korean', 'Italian',
];

const insuranceOptions = [
  'Aetna', 'Blue Cross', 'Cigna', 'UnitedHealth', 'Medicare', 'Medicaid',
  'Kaiser', 'Optum', 'Humana', 'Anthem', 'Centene', 'Molina',
];

const licenseTypeOptions = [
  'Psychologist', 'Psychiatrist', 'LCSW', 'LMFT', 'LPC', 'LMHC',
  'PsyD', 'PhD', 'MD', 'DO', 'NP', 'PA', 'Other'
];

const degreeOptions = [
  'Bachelor\'s', 'Master\'s', 'Doctorate (PhD)', 'Doctorate (PsyD)',
  'Medical Degree (MD)', 'Doctorate (DO)', 'Post-Doctoral Fellowship',
  'Certificate', 'Diploma', 'Other'
];

const TherapistProfile = () => {
  const [tabValue, setTabValue] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [openEducationDialog, setOpenEducationDialog] = useState(false);
  const [openCertificationDialog, setOpenCertificationDialog] = useState(false);
  const [openLicenseDialog, setOpenLicenseDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Form states
  const [profileData, setProfileData] = useState({
    profile: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phoneNumber: '',
      bio: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
      },
      preferredLanguage: 'English',
    },
    therapistDetails: {
      specializations: [],
      licenseNumber: '',
      licenseType: '',
      licenseExpiry: '',
      yearsExperience: 0,
      education: [],
      certifications: [],
      languages: ['English'],
      sessionRate: 0,
      acceptsInsurance: false,
      insuranceAccepted: [],
      isAvailable: true,
      isVerified: false,
      verifiedAt: null,
    },
  });

  const [educationForm, setEducationForm] = useState({
    degree: '',
    institution: '',
    year: new Date().getFullYear(),
    verified: false,
  });

  const [certificationForm, setCertificationForm] = useState({
    name: '',
    issuedBy: '',
    year: new Date().getFullYear(),
    expiryDate: null,
    verified: false,
  });

  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  // Check if APIs are available
  useEffect(() => {
    console.log('users API:', users);
    console.log('therapistsApi:', therapistsApi);
    
    if (users?.updateTherapistDetails) {
      setApiReady(true);
    }
  }, []);

  useEffect(() => {
    if (apiReady && user) {
      loadProfileData();
      fetchUpcomingSessions();
    } else if (user) {
      // Use user data from auth context
      setProfileData({
        profile: {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          dateOfBirth: user.profile?.dateOfBirth || '',
          gender: user.profile?.gender || '',
          phoneNumber: user.profile?.phoneNumber || '',
          bio: user.profile?.bio || '',
          address: user.profile?.address || {
            street: '', city: '', state: '', zipCode: '', country: 'USA',
          },
          preferredLanguage: user.profile?.preferredLanguage || 'English',
        },
        therapistDetails: user.therapistDetails || {
          specializations: [],
          licenseNumber: '',
          licenseType: '',
          licenseExpiry: '',
          yearsExperience: 0,
          education: [],
          certifications: [],
          languages: ['English'],
          sessionRate: 0,
          acceptsInsurance: false,
          insuranceAccepted: [],
          isAvailable: true,
          isVerified: false,
        },
      });
      setLoading(false);
    }
  }, [apiReady, user]);

  const fetchUpcomingSessions = async () => {
    try {
      setSessionsLoading(true);
      console.log('Fetching upcoming sessions for therapist:', user?.id || user?._id);
      
      const response = await sessionsApi.getMySessions({ 
        status: 'scheduled',
        limit: 5,
        sort: 'scheduledTime:asc'
      });
      
      console.log('Fetched sessions:', response.data.sessions);
      
      // Log each session's therapist ID for debugging
      response.data.sessions?.forEach((session, index) => {
        console.log(`Session ${index} therapist ID:`, session.therapist?._id || session.therapist);
        console.log(`Session ${index} patient:`, session.patient?.profile?.firstName);
        console.log(`Session ${index} status:`, session.status);
      });
      
      setUpcomingSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const loadProfileData = async () => {
    setLoading(true);
    try {
      // Fetch therapist profile if needed
      setProfileData({
        profile: {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          dateOfBirth: user.profile?.dateOfBirth || '',
          gender: user.profile?.gender || '',
          phoneNumber: user.profile?.phoneNumber || '',
          bio: user.profile?.bio || '',
          address: user.profile?.address || {
            street: '', city: '', state: '', zipCode: '', country: 'USA',
          },
          preferredLanguage: user.profile?.preferredLanguage || 'English',
        },
        therapistDetails: user.therapistDetails || {
          specializations: [],
          licenseNumber: '',
          licenseType: '',
          licenseExpiry: '',
          yearsExperience: 0,
          education: [],
          certifications: [],
          languages: ['English'],
          sessionRate: 0,
          acceptsInsurance: false,
          insuranceAccepted: [],
          isAvailable: true,
          isVerified: false,
        },
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      if (section === 'address') {
        setProfileData(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            address: {
              ...prev.profile.address,
              [field]: value,
            },
          },
        }));
      } else {
        setProfileData(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value,
          },
        }));
      }
    } else {
      setProfileData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [name]: value,
        },
      }));
    }
  };

  const handleArrayChange = (section, field, value) => {
    setProfileData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (users?.updateTherapistDetails) {
        await users.updateTherapistDetails(profileData.therapistDetails);
      }
      
      if (updateProfile) {
        await updateProfile(profileData);
      }
      
      setSuccess('Profile updated successfully');
      setEditMode(false);
      showSnackbar('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile');
      showSnackbar('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadProfileData();
    setEditMode(false);
    setError('');
  };

  const handleAddEducation = () => {
    setEducationForm({
      degree: '',
      institution: '',
      year: new Date().getFullYear(),
      verified: false,
    });
    setSelectedItem(null);
    setOpenEducationDialog(true);
  };

  const handleEditEducation = (index) => {
    const edu = profileData.therapistDetails.education[index];
    setEducationForm(edu);
    setSelectedItem(index);
    setOpenEducationDialog(true);
  };

  const handleSaveEducation = () => {
    const updatedEducation = [...(profileData.therapistDetails.education || [])];
    
    if (selectedItem !== null) {
      // Edit existing
      updatedEducation[selectedItem] = educationForm;
    } else {
      // Add new
      updatedEducation.push(educationForm);
    }

    setProfileData(prev => ({
      ...prev,
      therapistDetails: {
        ...prev.therapistDetails,
        education: updatedEducation,
      },
    }));

    setOpenEducationDialog(false);
    showSnackbar('Education saved successfully', 'success');
  };

  const handleDeleteEducation = (index) => {
    const updatedEducation = profileData.therapistDetails.education.filter((_, i) => i !== index);
    setProfileData(prev => ({
      ...prev,
      therapistDetails: {
        ...prev.therapistDetails,
        education: updatedEducation,
      },
    }));
    showSnackbar('Education deleted', 'info');
  };

  const handleAddCertification = () => {
    setCertificationForm({
      name: '',
      issuedBy: '',
      year: new Date().getFullYear(),
      expiryDate: null,
      verified: false,
    });
    setSelectedItem(null);
    setOpenCertificationDialog(true);
  };

  const handleEditCertification = (index) => {
    const cert = profileData.therapistDetails.certifications[index];
    setCertificationForm(cert);
    setSelectedItem(index);
    setOpenCertificationDialog(true);
  };

  const handleSaveCertification = () => {
    const updatedCertifications = [...(profileData.therapistDetails.certifications || [])];
    
    if (selectedItem !== null) {
      updatedCertifications[selectedItem] = certificationForm;
    } else {
      updatedCertifications.push(certificationForm);
    }

    setProfileData(prev => ({
      ...prev,
      therapistDetails: {
        ...prev.therapistDetails,
        certifications: updatedCertifications,
      },
    }));

    setOpenCertificationDialog(false);
    showSnackbar('Certification saved successfully', 'success');
  };

  const handleDeleteCertification = (index) => {
    const updatedCertifications = profileData.therapistDetails.certifications.filter((_, i) => i !== index);
    setProfileData(prev => ({
      ...prev,
      therapistDetails: {
        ...prev.therapistDetails,
        certifications: updatedCertifications,
      },
    }));
    showSnackbar('Certification deleted', 'info');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadDialog(true);
    }
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
    setDetailsDialog(true);
  };

  const handleJoinSession = (session) => {
    if (session.sessionType === 'video') {
      navigate(`/video-call/${session._id}`);
    } else if (session.sessionType === 'chat') {
      navigate(`/chat/${session.patient._id}`);
    }
  };

  const handleMessagePatient = (patientId) => {
    navigate(`/chat/${patientId}`);
  };

  const handleCancelSession = async () => {
    if (!selectedSession) return;

    try {
      console.log('Cancelling session:', selectedSession._id);
      console.log('Current user:', user);
      console.log('Session therapist:', selectedSession.therapist);
      
      // Get the actual IDs for comparison
      const currentUserId = user?.id || user?._id;
      const therapistId = selectedSession.therapist?._id || selectedSession.therapist;
      
      console.log('Comparing - Current user ID:', currentUserId, 'Therapist ID:', therapistId);
      
      // Check if user has permission to cancel (therapist can cancel)
      if (therapistId !== currentUserId) {
        console.log('Permission denied - user is not the therapist');
        showSnackbar('You do not have permission to cancel this session', 'error');
        setCancelDialog(false);
        return;
      }

      if (selectedSession.status !== 'scheduled') {
        console.log('Session cannot be cancelled - status:', selectedSession.status);
        showSnackbar('Only scheduled sessions can be cancelled', 'error');
        setCancelDialog(false);
        return;
      }

      console.log('All checks passed, proceeding with cancellation');
      await sessionsApi.updateStatus(selectedSession._id, {
        status: 'cancelled',
        cancellationReason: cancelReason,
      });
      setCancelDialog(false);
      setCancelReason('');
      showSnackbar('Session cancelled successfully', 'success');
      fetchUpcomingSessions(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling session:', error);
      if (error.response?.status === 403) {
        showSnackbar('You do not have permission to cancel this session', 'error');
      } else if (error.response?.status === 400) {
        showSnackbar(error.response.data.message || 'Cannot cancel this session', 'error');
      } else {
        showSnackbar('Failed to cancel session', 'error');
      }
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric',
        }),
        time: date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        full: date.toLocaleString(),
      };
    } catch (e) {
      return {
        date: 'Invalid date',
        time: '',
        full: 'Invalid date',
      };
    }
  };

  const getSessionIcon = (type) => {
    switch (type) {
      case 'video': return '🎥';
      case 'audio': return '📞';
      case 'chat': return '💬';
      default: return '📅';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/therapist/dashboard')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4">Therapist Profile</Typography>
          </Box>
          <Box>
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : 'Save'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Profile Header Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                editMode && (
                  <Tooltip title="Change photo">
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                      component="label"
                    >
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                      <PhotoCameraIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: 'primary.main',
                  fontSize: 48,
                }}
              >
                {profileData.profile.firstName?.[0]}
                {profileData.profile.lastName?.[0]}
              </Avatar>
            </Badge>
          </Grid>
          <Grid item xs>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="h4">
                Dr. {profileData.profile.firstName} {profileData.profile.lastName}
              </Typography>
              {profileData.therapistDetails.isVerified ? (
                <Chip
                  icon={<VerifiedIcon />}
                  label="Verified"
                  color="success"
                  size="small"
                />
              ) : (
                <Chip
                  icon={<PendingIcon />}
                  label="Verification Pending"
                  color="warning"
                  size="small"
                />
              )}
            </Box>

            <Stack direction="row" spacing={3} divider={<Divider orientation="vertical" flexItem />} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon color="action" />
                <Typography>{user?.email}</Typography>
              </Box>
              {profileData.profile.phoneNumber && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon color="action" />
                  <Typography>{profileData.profile.phoneNumber}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon color="warning" />
                <Typography>
                  {profileData.therapistDetails.averageRating?.toFixed(1) || '0.0'} rating
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {profileData.therapistDetails.specializations?.slice(0, 5).map((spec) => (
                <Chip key={spec} label={spec} size="small" color="primary" variant="outlined" />
              ))}
              {profileData.therapistDetails.specializations?.length > 5 && (
                <Chip label={`+${profileData.therapistDetails.specializations.length - 5}`} size="small" />
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Upcoming Sessions Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Upcoming Sessions</Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => navigate('/therapist/sessions')}
          >
            View All
          </Button>
        </Box>

        {sessionsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={30} />
          </Box>
        ) : upcomingSessions.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
            No upcoming sessions scheduled
          </Typography>
        ) : (
          <List>
            {upcomingSessions.map((session) => {
              const { date, time } = formatDateTime(session.scheduledTime);
              return (
                <ListItem
                  key={session._id}
                  secondaryAction={
                    <Box>
                      <Tooltip title="View Details">
                        <IconButton 
                          edge="end" 
                          size="small"
                          onClick={() => handleViewSession(session)}
                          sx={{ mr: 1 }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Message Patient">
                        <IconButton 
                          edge="end" 
                          size="small"
                          onClick={() => handleMessagePatient(session.patient._id)}
                          sx={{ mr: 1 }}
                        >
                          <MessageIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel Session">
                        <IconButton 
                          edge="end" 
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedSession(session);
                            setCancelDialog(true);
                          }}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>
                      {session.patient?.profile?.firstName?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle2">
                          {session.patient?.profile?.firstName} {session.patient?.profile?.lastName}
                        </Typography>
                        <Chip
                          size="small"
                          label={getSessionIcon(session.sessionType)}
                          variant="outlined"
                          sx={{ height: 20 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {date} at {time} • {session.duration} min
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Personal Information" />
          <Tab label="Professional Details" />
          <Tab label="Education & Certifications" />
          <Tab label="Practice Information" />
          <Tab label="Verification" />
        </Tabs>

        {/* Personal Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={profileData.profile.firstName}
                onChange={handleInputChange}
                disabled={!editMode}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={profileData.profile.lastName}
                onChange={handleInputChange}
                disabled={!editMode}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date of Birth"
                  value={profileData.profile.dateOfBirth ? new Date(profileData.profile.dateOfBirth) : null}
                  onChange={(date) => handleInputChange({ target: { name: 'dateOfBirth', value: date } })}
                  disabled={!editMode}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={profileData.profile.gender}
                  onChange={handleInputChange}
                  label="Gender"
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                  <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={profileData.profile.phoneNumber}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel>Preferred Language</InputLabel>
                <Select
                  name="preferredLanguage"
                  value={profileData.profile.preferredLanguage}
                  onChange={handleInputChange}
                  label="Preferred Language"
                >
                  {languageOptions.map(lang => (
                    <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Professional Bio"
                name="bio"
                value={profileData.profile.bio}
                onChange={handleInputChange}
                disabled={!editMode}
                placeholder="Tell patients about yourself, your approach, and what they can expect from sessions with you..."
              />
            </Grid>

            {/* Address Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Practice Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                name="address.street"
                value={profileData.profile.address?.street}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                name="address.city"
                value={profileData.profile.address?.city}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="State"
                name="address.state"
                value={profileData.profile.address?.state}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="ZIP Code"
                name="address.zipCode"
                value={profileData.profile.address?.zipCode}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Country"
                name="address.country"
                value={profileData.profile.address?.country}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Professional Details Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel>Specializations</InputLabel>
                <Select
                  multiple
                  value={profileData.therapistDetails.specializations}
                  onChange={(e) => handleArrayChange('therapistDetails', 'specializations', e.target.value)}
                  input={<OutlinedInput label="Specializations" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {specializationOptions.map((spec) => (
                    <MenuItem key={spec} value={spec}>
                      <Checkbox checked={profileData.therapistDetails.specializations.indexOf(spec) > -1} />
                      <ListItemText primary={spec} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Number"
                name="therapistDetails.licenseNumber"
                value={profileData.therapistDetails.licenseNumber}
                onChange={handleInputChange}
                disabled={!editMode}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel>License Type</InputLabel>
                <Select
                  name="therapistDetails.licenseType"
                  value={profileData.therapistDetails.licenseType}
                  onChange={handleInputChange}
                  label="License Type"
                >
                  {licenseTypeOptions.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="License Expiry"
                  value={profileData.therapistDetails.licenseExpiry ? new Date(profileData.therapistDetails.licenseExpiry) : null}
                  onChange={(date) => handleInputChange({ target: { name: 'therapistDetails.licenseExpiry', value: date } })}
                  disabled={!editMode}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Years of Experience"
                name="therapistDetails.yearsExperience"
                type="number"
                value={profileData.therapistDetails.yearsExperience}
                onChange={handleInputChange}
                disabled={!editMode}
                InputProps={{
                  inputProps: { min: 0, max: 60 },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel>Languages</InputLabel>
                <Select
                  multiple
                  value={profileData.therapistDetails.languages}
                  onChange={(e) => handleArrayChange('therapistDetails', 'languages', e.target.value)}
                  input={<OutlinedInput label="Languages" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {languageOptions.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      <Checkbox checked={profileData.therapistDetails.languages.indexOf(lang) > -1} />
                      <ListItemText primary={lang} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Education & Certifications Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Education</Typography>
              {editMode && (
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  size="small"
                  onClick={handleAddEducation}
                >
                  Add Education
                </Button>
              )}
            </Box>

            {profileData.therapistDetails.education?.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No education history added
              </Typography>
            ) : (
              <List>
                {profileData.therapistDetails.education.map((edu, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      editMode && (
                        <Box>
                          <IconButton edge="end" onClick={() => handleEditEducation(index)} size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton edge="end" onClick={() => handleDeleteEducation(index)} size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )
                    }
                  >
                    <ListItemIcon>
                      <SchoolIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={edu.degree}
                      secondary={`${edu.institution}, ${edu.year} ${edu.verified ? '✓ Verified' : ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Certifications</Typography>
              {editMode && (
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  size="small"
                  onClick={handleAddCertification}
                >
                  Add Certification
                </Button>
              )}
            </Box>

            {profileData.therapistDetails.certifications?.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No certifications added
              </Typography>
            ) : (
              <List>
                {profileData.therapistDetails.certifications.map((cert, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      editMode && (
                        <Box>
                          <IconButton edge="end" size="small" onClick={() => handleEditCertification(index)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton edge="end" size="small" color="error" onClick={() => handleDeleteCertification(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )
                    }
                  >
                    <ListItemIcon>
                      <WorkIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={cert.name}
                      secondary={`${cert.issuedBy}, ${cert.year} ${cert.verified ? '✓ Verified' : ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>

        {/* Practice Information Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Session Rate ($)"
                name="therapistDetails.sessionRate"
                type="number"
                value={profileData.therapistDetails.sessionRate}
                onChange={handleInputChange}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={profileData.therapistDetails.acceptsInsurance}
                    onChange={(e) => handleArrayChange('therapistDetails', 'acceptsInsurance', e.target.checked)}
                    disabled={!editMode}
                  />
                }
                label="I accept insurance"
              />
            </Grid>

            {profileData.therapistDetails.acceptsInsurance && (
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Insurance Accepted</InputLabel>
                  <Select
                    multiple
                    value={profileData.therapistDetails.insuranceAccepted}
                    onChange={(e) => handleArrayChange('therapistDetails', 'insuranceAccepted', e.target.value)}
                    input={<OutlinedInput label="Insurance Accepted" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {insuranceOptions.map((ins) => (
                      <MenuItem key={ins} value={ins}>
                        <Checkbox checked={profileData.therapistDetails.insuranceAccepted.indexOf(ins) > -1} />
                        <ListItemText primary={ins} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={profileData.therapistDetails.isAvailable}
                    onChange={(e) => handleArrayChange('therapistDetails', 'isAvailable', e.target.checked)}
                    disabled={!editMode}
                  />
                }
                label="Available for new patients"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Verification Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Upload your credentials for verification. Our team will review and verify your documents within 2-3 business days.
              </Alert>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Verification Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    {profileData.therapistDetails.isVerified ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Verified"
                        color="success"
                        size="large"
                        sx={{ fontSize: '1rem', py: 2 }}
                      />
                    ) : (
                      <Chip
                        icon={<PendingIcon />}
                        label="Pending Verification"
                        color="warning"
                        size="large"
                        sx={{ fontSize: '1rem', py: 2 }}
                      />
                    )}
                    {profileData.therapistDetails.verifiedAt && (
                      <Typography variant="body2" color="text.secondary">
                        Verified on: {formatDate(profileData.therapistDetails.verifiedAt)}
                      </Typography>
                    )}
                  </Box>

                  <Typography variant="subtitle1" gutterBottom>
                    Required Documents
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <SchoolIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="License Certificate" />
                      <Button size="small" variant="outlined" component="label">
                        Upload
                        <input type="file" hidden accept=".pdf,.jpg,.png" />
                      </Button>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WorkIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Proof of Identity" />
                      <Button size="small" variant="outlined" component="label">
                        Upload
                        <input type="file" hidden accept=".pdf,.jpg,.png" />
                      </Button>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <SchoolIcon color="action" />
                      </ListItemIcon>
                      <ListItemText primary="Degree Certificate" />
                      <Button size="small" variant="outlined" component="label">
                        Upload
                        <input type="file" hidden accept=".pdf,.jpg,.png" />
                      </Button>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Education Dialog */}
      <Dialog open={openEducationDialog} onClose={() => setOpenEducationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedItem !== null ? 'Edit Education' : 'Add Education'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Degree</InputLabel>
              <Select
                value={educationForm.degree}
                onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
                label="Degree"
              >
                {degreeOptions.map(deg => (
                  <MenuItem key={deg} value={deg}>{deg}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Institution"
              value={educationForm.institution}
              onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Year"
              type="number"
              value={educationForm.year}
              onChange={(e) => setEducationForm({ ...educationForm, year: parseInt(e.target.value) })}
              InputProps={{ inputProps: { min: 1950, max: new Date().getFullYear() } }}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={educationForm.verified}
                  onChange={(e) => setEducationForm({ ...educationForm, verified: e.target.checked })}
                />
              }
              label="Verified"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEducationDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEducation} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Certification Dialog */}
      <Dialog open={openCertificationDialog} onClose={() => setOpenCertificationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedItem !== null ? 'Edit Certification' : 'Add Certification'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Certification Name"
              value={certificationForm.name}
              onChange={(e) => setCertificationForm({ ...certificationForm, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Issued By"
              value={certificationForm.issuedBy}
              onChange={(e) => setCertificationForm({ ...certificationForm, issuedBy: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Year"
              type="number"
              value={certificationForm.year}
              onChange={(e) => setCertificationForm({ ...certificationForm, year: parseInt(e.target.value) })}
              sx={{ mb: 2 }}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Expiry Date (if applicable)"
                value={certificationForm.expiryDate}
                onChange={(date) => setCertificationForm({ ...certificationForm, expiryDate: date })}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              />
            </LocalizationProvider>
            <FormControlLabel
              control={
                <Switch
                  checked={certificationForm.verified}
                  onChange={(e) => setCertificationForm({ ...certificationForm, verified: e.target.checked })}
                />
              }
              label="Verified"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCertificationDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCertification} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Session Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="sm" fullWidth>
        {selectedSession && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h5">Session Details</Typography>
                <Chip
                  label={selectedSession.status.toUpperCase()}
                  color={selectedSession.status === 'scheduled' ? 'primary' : 'default'}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Patient Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 48, height: 48 }}>
                      {selectedSession.patient?.profile?.firstName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedSession.patient?.profile?.firstName} {selectedSession.patient?.profile?.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Patient ID: {selectedSession.patient?._id}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Session Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><CalendarTodayIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Date & Time"
                        secondary={formatDateTime(selectedSession.scheduledTime).full}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><AccessTimeIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Duration"
                        secondary={`${selectedSession.duration} minutes`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><ScheduleIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Session Type"
                        secondary={selectedSession.sessionType}
                      />
                    </ListItem>
                  </List>
                </Grid>

                {selectedSession.notes?.therapist && (
                  <>
                    <Grid item xs={12}>
                      <Divider />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Your Notes
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography>{selectedSession.notes.therapist.content}</Typography>
                      </Paper>
                    </Grid>
                  </>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialog(false)}>Close</Button>
              {selectedSession.status === 'scheduled' && (
                <Button
                  variant="contained"
                  onClick={() => {
                    setDetailsDialog(false);
                    handleJoinSession(selectedSession);
                  }}
                >
                  Join Session
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Cancel Session Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Session</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to cancel this session with {selectedSession?.patient?.profile?.firstName}?
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            As the therapist, you have permission to cancel this session.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Please provide a reason for cancellation..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>No, Keep It</Button>
          <Button onClick={handleCancelSession} variant="contained" color="error">
            Yes, Cancel Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            {uploadFile && (
              <>
                <WorkIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="subtitle1">{uploadFile.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {(uploadFile.size / 1024).toFixed(1)} KB
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button onClick={() => setUploadDialog(false)} variant="contained">
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TherapistProfile;