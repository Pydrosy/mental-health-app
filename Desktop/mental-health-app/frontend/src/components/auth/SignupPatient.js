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

const concerns = [
  'anxiety',
  'depression',
  'stress',
  'relationship',
  'trauma',
  'grief',
  'self-esteem',
  'eating-disorder',
  'addiction',
  'ocd',
  'ptsd',
  'bipolar',
  'insomnia',
  'anger-management',
];

const therapyTypes = ['individual', 'couples', 'family', 'group', 'teen', 'child'];

const steps = ['Account Information', 'Personal Details', 'Health Information'];

const SignupPatient = () => {
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
    concerns: [],
    therapyGoals: '',
    preferredTherapyType: [],
    previousTherapy: false,
    currentMedication: '',
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

  const handleConcernsChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      concerns: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleTherapyTypeChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      preferredTherapyType: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate step 1
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    } else if (activeStep === 1) {
      // Validate step 2
      if (!formData.firstName || !formData.lastName) {
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
      role: 'patient',
      profile: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        phoneNumber: formData.phoneNumber || undefined,
      },
      patientDetails: {
        concerns: formData.concerns,
        therapyGoals: formData.therapyGoals ? [formData.therapyGoals] : [],
        preferredTherapyType: formData.preferredTherapyType,
        previousTherapy: formData.previousTherapy,
        currentMedication: formData.currentMedication || undefined,
      },
    };

    const result = await signup(userData);
    
    if (result.success) {
      navigate('/');
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="dateOfBirth"
                label="Date of Birth"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  label="Gender"
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                  <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="phoneNumber"
                label="Phone Number"
                value={formData.phoneNumber}
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
                <InputLabel>Concerns</InputLabel>
                <Select
                  multiple
                  name="concerns"
                  value={formData.concerns}
                  onChange={handleConcernsChange}
                  input={<OutlinedInput label="Concerns" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {concerns.map((concern) => (
                    <MenuItem key={concern} value={concern}>
                      <Checkbox checked={formData.concerns.indexOf(concern) > -1} />
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
                rows={3}
                name="therapyGoals"
                label="Therapy Goals"
                value={formData.therapyGoals}
                onChange={handleChange}
                placeholder="What do you hope to achieve through therapy?"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Preferred Therapy Type</InputLabel>
                <Select
                  multiple
                  name="preferredTherapyType"
                  value={formData.preferredTherapyType}
                  onChange={handleTherapyTypeChange}
                  input={<OutlinedInput label="Preferred Therapy Type" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {therapyTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      <Checkbox checked={formData.preferredTherapyType.indexOf(type) > -1} />
                      <ListItemText primary={type} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="previousTherapy"
                    checked={formData.previousTherapy}
                    onChange={handleChange}
                  />
                }
                label="I have attended therapy before"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="currentMedication"
                label="Current Medication (if any)"
                value={formData.currentMedication}
                onChange={handleChange}
              />
            </Grid>
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
            <PsychologyIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
            <Typography component="h1" variant="h4">
              Patient Sign Up
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

export default SignupPatient;