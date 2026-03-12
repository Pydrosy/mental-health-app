import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  Grid,
  TextField,
  Divider,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Rating,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemIcon,
  FormControlLabel,
  Switch,
  Badge,
  Tooltip,
  Stack,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { users, therapists, sessions } from '../../services/api';
import { useNavigate } from 'react-router-dom';

// Icons
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import LanguageIcon from '@mui/icons-material/Language';
import StarIcon from '@mui/icons-material/Star';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';

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

const Profile = () => {
  const { user, updateProfile, isPatient, isTherapist } = useAuth();
  const navigate = useNavigate();
  
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
        country: '',
      },
      preferredLanguage: 'English',
    },
    patientDetails: {
      concerns: [],
      therapyGoals: [],
      preferredTherapyType: [],
      insuranceProvider: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
      },
      previousTherapy: false,
      currentMedication: '',
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
    },
  });

  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    averageRating: 0,
    totalReviews: 0,
  });

  const [recentSessions, setRecentSessions] = useState([]);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        profile: {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          dateOfBirth: user.profile?.dateOfBirth ? user.profile.dateOfBirth.split('T')[0] : '',
          gender: user.profile?.gender || '',
          phoneNumber: user.profile?.phoneNumber || '',
          bio: user.profile?.bio || '',
          address: user.profile?.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
          },
          preferredLanguage: user.profile?.preferredLanguage || 'English',
        },
        patientDetails: user.patientDetails || {
          concerns: [],
          therapyGoals: [],
          preferredTherapyType: [],
          insuranceProvider: '',
          emergencyContact: { name: '', relationship: '', phone: '' },
          previousTherapy: false,
          currentMedication: '',
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
        },
      });

      if (isTherapist) {
        fetchTherapistStats();
      }
    }
  }, [user, isTherapist]);

  const fetchTherapistStats = async () => {
    try {
      const response = await therapists.getStats();
      setStats(response.data.statistics);
      
      const sessionsResponse = await sessions.getMySessions({ limit: 5 });
      setRecentSessions(sessionsResponse.data.sessions || []);
    } catch (error) {
      console.error('Error fetching therapist stats:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else if (name.includes('address.')) {
      const field = name.split('.')[1];
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
    } else if (name.includes('emergency.')) {
      const field = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        patientDetails: {
          ...prev.patientDetails,
          emergencyContact: {
            ...prev.patientDetails.emergencyContact,
            [field]: value,
          },
        },
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value,
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
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setSuccess('Profile updated successfully!');
        setEditMode(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original user data
    setProfileData({
      profile: {
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        dateOfBirth: user.profile?.dateOfBirth ? user.profile.dateOfBirth.split('T')[0] : '',
        gender: user.profile?.gender || '',
        phoneNumber: user.profile?.phoneNumber || '',
        bio: user.profile?.bio || '',
        address: user.profile?.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        preferredLanguage: user.profile?.preferredLanguage || 'English',
      },
      patientDetails: user.patientDetails || {
        concerns: [],
        therapyGoals: [],
        preferredTherapyType: [],
        insuranceProvider: '',
        emergencyContact: { name: '', relationship: '', phone: '' },
        previousTherapy: false,
        currentMedication: '',
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
      },
    });
    setEditMode(false);
    setError('');
  };

  const handlePasswordChange = async () => {
    // Implement password change API call
    setOpenPasswordDialog(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const concernOptions = [
    'anxiety', 'depression', 'stress', 'relationship', 'trauma',
    'grief', 'self-esteem', 'eating-disorder', 'addiction', 'ocd',
    'ptsd', 'bipolar', 'insomnia', 'anger-management'
  ];

  const specializationOptions = [
    'cognitive-behavioral', 'psychodynamic', 'humanistic', 'mindfulness',
    'trauma-focused', 'emdr', 'dialectical-behavioral', 'acceptance-commitment',
    'family-therapy', 'group-therapy', 'couples-counseling', 'child-psychology',
    'adolescent-psychology', 'addiction-counseling', 'eating-disorders'
  ];

  const therapyTypeOptions = ['individual', 'couples', 'family', 'group', 'teen', 'child'];
  const languageOptions = ['English', 'Spanish', 'Mandarin', 'French', 'German', 'Arabic', 'Hindi'];
  const licenseTypeOptions = ['Psychologist', 'Psychiatrist', 'LCSW', 'LMFT', 'LPC', 'LMHC', 'Other'];
  const insuranceOptions = ['Aetna', 'Blue Cross', 'Cigna', 'UnitedHealth', 'Medicare', 'Medicaid'];

  return (
    <Box>
      {/* Header with Avatar and Basic Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Tooltip title="Change photo">
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    <PhotoCameraIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h4">
                {profileData.profile.firstName} {profileData.profile.lastName}
              </Typography>
              <Chip
                label={isPatient ? 'Patient' : 'Therapist'}
                color={isPatient ? 'primary' : 'secondary'}
                size="small"
              />
              {!editMode ? (
                <Button
                  variant="outlined"
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
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save'}
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

            <Stack direction="row" spacing={3} divider={<Divider orientation="vertical" flexItem />}>
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
              {isTherapist && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StarIcon color="warning" />
                    <Typography>{stats.averageRating.toFixed(1)} ({stats.totalReviews} reviews)</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventAvailableIcon color="action" />
                    <Typography>{stats.completedSessions} sessions</Typography>
                  </Box>
                </>
              )}
            </Stack>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
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
          {isPatient && <Tab label="Health Information" />}
          {isTherapist && <Tab label="Professional Information" />}
          {isTherapist && <Tab label="Practice Settings" />}
          {isTherapist && <Tab label="Statistics" />}
          <Tab label="Account Settings" />
        </Tabs>

        {/* Personal Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                name="profile.firstName"
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
                name="profile.lastName"
                value={profileData.profile.lastName}
                onChange={handleInputChange}
                disabled={!editMode}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="profile.dateOfBirth"
                type="date"
                value={profileData.profile.dateOfBirth}
                onChange={handleInputChange}
                disabled={!editMode}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="profile.gender"
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
                name="profile.phoneNumber"
                value={profileData.profile.phoneNumber}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel>Preferred Language</InputLabel>
                <Select
                  name="profile.preferredLanguage"
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
                rows={3}
                label="Bio"
                name="profile.bio"
                value={profileData.profile.bio}
                onChange={handleInputChange}
                disabled={!editMode}
                placeholder="Tell us a little about yourself..."
              />
            </Grid>
            
            {/* Address Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Address
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                name="address.state"
                value={profileData.profile.address?.state}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                name="address.zipCode"
                value={profileData.profile.address?.zipCode}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={4}>
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

        {/* Patient Health Information Tab */}
        {isPatient && (
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Concerns</InputLabel>
                  <Select
                    multiple
                    value={profileData.patientDetails.concerns}
                    onChange={(e) => handleArrayChange('patientDetails', 'concerns', e.target.value)}
                    input={<OutlinedInput label="Concerns" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {concernOptions.map((concern) => (
                      <MenuItem key={concern} value={concern}>
                        <Checkbox checked={profileData.patientDetails.concerns.indexOf(concern) > -1} />
                        <ListItemText primary={concern} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Therapy Goals"
                  name="patientDetails.therapyGoals"
                  value={profileData.patientDetails.therapyGoals?.join('\n')}
                  onChange={(e) => handleArrayChange('patientDetails', 'therapyGoals', e.target.value.split('\n'))}
                  disabled={!editMode}
                  helperText="Enter each goal on a new line"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Preferred Therapy Type</InputLabel>
                  <Select
                    multiple
                    value={profileData.patientDetails.preferredTherapyType}
                    onChange={(e) => handleArrayChange('patientDetails', 'preferredTherapyType', e.target.value)}
                    input={<OutlinedInput label="Preferred Therapy Type" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {therapyTypeOptions.map((type) => (
                      <MenuItem key={type} value={type}>
                        <Checkbox checked={profileData.patientDetails.preferredTherapyType?.indexOf(type) > -1} />
                        <ListItemText primary={type} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Insurance Provider"
                  name="patientDetails.insuranceProvider"
                  value={profileData.patientDetails.insuranceProvider}
                  onChange={handleInputChange}
                  disabled={!editMode}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Emergency Contact
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Name"
                  name="emergency.name"
                  value={profileData.patientDetails.emergencyContact?.name}
                  onChange={handleInputChange}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Relationship"
                  name="emergency.relationship"
                  value={profileData.patientDetails.emergencyContact?.relationship}
                  onChange={handleInputChange}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="emergency.phone"
                  value={profileData.patientDetails.emergencyContact?.phone}
                  onChange={handleInputChange}
                  disabled={!editMode}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profileData.patientDetails.previousTherapy}
                      onChange={(e) => handleArrayChange('patientDetails', 'previousTherapy', e.target.checked)}
                      disabled={!editMode}
                    />
                  }
                  label="I have attended therapy before"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Medication (if any)"
                  name="patientDetails.currentMedication"
                  value={profileData.patientDetails.currentMedication}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </TabPanel>
        )}

        {/* Therapist Professional Information Tab */}
        {isTherapist && (
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
                <TextField
                  fullWidth
                  label="License Expiry"
                  name="therapistDetails.licenseExpiry"
                  type="date"
                  value={profileData.therapistDetails.licenseExpiry}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  InputLabelProps={{ shrink: true }}
                />
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
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Education
                </Typography>
                {/* Add education fields here - can be expanded */}
                <Button variant="outlined" startIcon={<SchoolIcon />} disabled={!editMode}>
                  Add Education
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Certifications
                </Typography>
                <Button variant="outlined" startIcon={<WorkIcon />} disabled={!editMode}>
                  Add Certification
                </Button>
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
        )}

        {/* Therapist Practice Settings Tab */}
        {isTherapist && (
          <TabPanel value={tabValue} index={2}>
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
        )}

        {/* Therapist Statistics Tab */}
        {isTherapist && (
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Total Sessions
                    </Typography>
                    <Typography variant="h3">
                      {stats.totalSessions}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Completed Sessions
                    </Typography>
                    <Typography variant="h3">
                      {stats.completedSessions}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Average Rating
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h3">
                        {stats.averageRating.toFixed(1)}
                      </Typography>
                      <Rating value={stats.averageRating} readOnly precision={0.5} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Based on {stats.totalReviews} reviews
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Recent Sessions
                </Typography>
                <List>
                  {recentSessions.map((session) => (
                    <ListItem key={session._id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          {session.patient?.profile?.firstName?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${session.patient?.profile?.firstName} ${session.patient?.profile?.lastName}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {new Date(session.scheduledTime).toLocaleDateString()} - 
                              {session.status}
                            </Typography>
                            {session.rating && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Rating value={session.rating.score} readOnly size="small" />
                                <Typography variant="caption">{session.rating.feedback}</Typography>
                              </Box>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </TabPanel>
        )}

        {/* Account Settings Tab */}
        <TabPanel value={tabValue} index={isTherapist ? 4 : 1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <LockIcon color="action" />
                    <Typography variant="h6">Change Password</Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => setOpenPasswordDialog(true)}
                  >
                    Update Password
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <VisibilityIcon color="action" />
                    <Typography variant="h6">Privacy Settings</Typography>
                  </Box>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Show profile to other users"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Allow messages from therapists"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error" gutterBottom>
                    Danger Zone
                  </Typography>
                  <Button variant="outlined" color="error">
                    Deactivate Account
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Change Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            sx={{ mb: 2, mt: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handlePasswordChange} variant="contained">
            Update Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;