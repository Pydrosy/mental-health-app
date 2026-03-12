import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  FormControlLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PsychologyIcon from '@mui/icons-material/Psychology';

const specializations = [
  'cognitive-behavioral',
  'psychodynamic',
  'humanistic',
  'mindfulness',
  'trauma-focused',
  'emdr',
  'dialectical-behavioral',
  'acceptance-commitment',
  'family-therapy',
  'group-therapy',
  'couples-counseling',
  'child-psychology',
  'adolescent-psychology',
  'addiction-counseling',
  'eating-disorders',
];

const languages = ['English', 'Spanish', 'Mandarin', 'French', 'German', 'Arabic', 'Hindi'];

const licenseTypes = ['Psychologist', 'Psychiatrist', 'LCSW', 'LMFT', 'LPC', 'LMHC', 'Other'];

const steps = ['Account Information', 'Professional Details', 'Practice Information'];

const SignupTherapist = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    bio: '',
    specializations: [],
    licenseNumber: '',
    licenseType: '',
    licenseExpiry: '',
    yearsExperience: '',
    languages: ['English'],
    sessionRate: '',
    acceptsInsurance: false,
    insuranceAccepted: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSpecializationsChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      specializations: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleLanguagesChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      languages: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleInsuranceAcceptedChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      insuranceAccepted: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else if (activeStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.licenseNumber || !formData.yearsExperience) {
        setError('Please fill in all required fields');
        return;
      }
    }

    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    const userData = {
      email: formData.email,
      password: formData.password,
      role: 'therapist',
      profile: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        bio: formData.bio,
      },
      therapistDetails: {
        specializations: formData.specializations,
        licenseNumber: formData.licenseNumber,
        licenseType: formData.licenseType || 'LCSW',
        licenseExpiry: formData.licenseExpiry || undefined,
        yearsExperience: parseInt(formData.yearsExperience) || 0,
        languages: formData.languages,
        sessionRate: parseFloat(formData.sessionRate) || 0,
        acceptsInsurance: formData.acceptsInsurance,
        insuranceAccepted: formData.insuranceAccepted,
        isAvailable: true,
      },
    };

    const result = await signup(userData);
    
    if (result.success) {
      navigate('/therapist/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField
              margin="normal"
              required
              fullWidth
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              helperText="Minimum 6 characters"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </Box>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="bio"
                label="Professional Bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about your experience and approach to therapy"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="licenseNumber"
                label="License Number"
                value={formData.licenseNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>License Type</InputLabel>
                <Select
                  name="licenseType"
                  value={formData.licenseType}
                  onChange={handleChange}
                  label="License Type"
                >
                  {licenseTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="licenseExpiry"
                label="License Expiry"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.licenseExpiry}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="yearsExperience"
                label="Years of Experience"
                type="number"
                value={formData.yearsExperience}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Specializations</InputLabel>
                <Select
                  multiple
                  name="specializations"
                  value={formData.specializations}
                  onChange={handleSpecializationsChange}
                  input={<OutlinedInput label="Specializations" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {specializations.map((spec) => (
                    <MenuItem key={spec} value={spec}>
                      <Checkbox checked={formData.specializations.indexOf(spec) > -1} />
                      <ListItemText primary={spec} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Languages</InputLabel>
                <Select
                  multiple
                  name="languages"
                  value={formData.languages}
                  onChange={handleLanguagesChange}
                  input={<OutlinedInput label="Languages" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {languages.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      <Checkbox checked={formData.languages.indexOf(lang) > -1} />
                      <ListItemText primary={lang} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="sessionRate"
                label="Session Rate ($)"
                type="number"
                value={formData.sessionRate}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="acceptsInsurance"
                    checked={formData.acceptsInsurance}
                    onChange={handleChange}
                  />
                }
                label="I accept insurance"
              />
            </Grid>
            {formData.acceptsInsurance && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Insurance Accepted</InputLabel>
                  <Select
                    multiple
                    name="insuranceAccepted"
                    value={formData.insuranceAccepted}
                    onChange={handleInsuranceAcceptedChange}
                    input={<OutlinedInput label="Insurance Accepted" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {['Aetna', 'Blue Cross', 'Cigna', 'UnitedHealth', 'Medicare', 'Medicaid'].map((ins) => (
                      <MenuItem key={ins} value={ins}>
                        <Checkbox checked={formData.insuranceAccepted.indexOf(ins) > -1} />
                        <ListItemText primary={ins} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PsychologyIcon color="secondary" sx={{ fontSize: 40, mr: 1 }} />
            <Typography component="h1" variant="h4">
              Therapist Sign Up
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" noValidate>
            {getStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign Up'}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignupTherapist;