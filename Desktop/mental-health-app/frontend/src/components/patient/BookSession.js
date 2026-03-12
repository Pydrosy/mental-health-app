import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Avatar,
  Chip,
  Rating,
  Divider,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { therapists, sessions } from '../../services/api';
import { format, addDays, startOfDay } from 'date-fns';

// Icons
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VideocamIcon from '@mui/icons-material/Videocam';
import PhoneIcon from '@mui/icons-material/Phone';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const steps = ['Select Date & Time', 'Confirm Details', 'Payment', 'Confirmation'];

const sessionTypes = [
  { value: 'video', label: 'Video Call', icon: <VideocamIcon />, description: 'Face-to-face video session' },
  { value: 'audio', label: 'Audio Call', icon: <PhoneIcon />, description: 'Phone/audio only session' },
  { value: 'chat', label: 'Chat Session', icon: <ChatIcon />, description: 'Text-based chat session' },
];

const durations = [30, 50, 80];

const BookSession = () => {
  const { therapistId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeStep, setActiveStep] = useState(0);
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState(50);
  const [sessionType, setSessionType] = useState('video');
  const [notes, setNotes] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [confirmationDialog, setConfirmationDialog] = useState(false);
  const [minDate, setMinDate] = useState(startOfDay(new Date()));
  const [therapistAvailability, setTherapistAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  useEffect(() => {
    fetchTherapistDetails();
  }, [therapistId]);

  useEffect(() => {
    if (selectedDate && therapistAvailability.length > 0) {
      getAvailableSlotsForDate(selectedDate);
    }
  }, [selectedDate, therapistAvailability]);

  const fetchTherapistDetails = async () => {
    try {
      setLoading(true);
      // Fetch therapist details
      const response = await therapists.getById(therapistId);
      setTherapist(response.data.therapist);
      
      // Fetch therapist availability
      await fetchTherapistAvailability();
      
    } catch (error) {
      console.error('Error fetching therapist:', error);
      setError('Failed to load therapist details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTherapistAvailability = async () => {
    try {
      setAvailabilityLoading(true);
      const response = await therapists.getAvailability(therapistId);
      console.log('Raw availability response from DB:', response.data);
      
      let availabilityData = [];
      
      if (response.data && response.data.availability) {
        availabilityData = response.data.availability;
      } else if (Array.isArray(response.data)) {
        availabilityData = response.data;
      }
      
      console.log('Processed availability data:', availabilityData);
      setTherapistAvailability(availabilityData);
      
      // If we have a selected date, try to get slots for it
      if (selectedDate && availabilityData.length > 0) {
        getAvailableSlotsForDate(selectedDate, availabilityData);
      }
    } catch (error) {
      console.error('Error fetching availability from DB:', error);
      setTherapistAvailability([]);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const getAvailableSlotsForDate = (date, availabilityData = therapistAvailability) => {
    if (!date || availabilityData.length === 0) {
      console.log('No date or availability data');
      setAvailableSlots([]);
      return;
    }

    // Get day name (e.g., "Monday", "Tuesday")
    const dayName = format(date, 'EEEE');
    console.log('Selected day name:', dayName);
    console.log('Checking availability for day:', dayName);

    // Find the day in availability data
    const dayAvailability = availabilityData.find(
      item => item.day && item.day.toLowerCase() === dayName.toLowerCase()
    );

    console.log('Found day availability:', dayAvailability);

    if (dayAvailability && dayAvailability.slots && dayAvailability.slots.length > 0) {
      // Filter out booked slots and get available times
      const availableTimes = dayAvailability.slots
        .filter(slot => !slot.isBooked)
        .map(slot => slot.startTime);
      
      console.log('Available times for this day:', availableTimes);
      setAvailableSlots(availableTimes);
    } else {
      console.log('No slots found for this day');
      setAvailableSlots([]);
    }
  };

  const handleDateChange = (date) => {
    console.log('Date selected:', date);
    setSelectedDate(date);
    setSelectedTime(null);
    setError('');
    
    if (date && therapistAvailability.length > 0) {
      getAvailableSlotsForDate(date);
    } else {
      setAvailableSlots([]);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setError('');
  };

  const handleDurationSelect = (duration) => {
    setSelectedDuration(duration);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!selectedDate) {
        setError('Please select a date');
        return;
      }
      if (!selectedTime) {
        setError('Please select a time');
        return;
      }
      if (!selectedDuration) {
        setError('Please select a duration');
        return;
      }
    }

    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  const handleBookSession = async () => {
    setLoading(true);
    setError('');

    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':');
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const sessionData = {
        therapistId,
        scheduledTime: scheduledDateTime.toISOString(),
        duration: selectedDuration,
        sessionType,
        notes,
      };

      const response = await sessions.create(sessionData);
      setBookingId(response.data.session._id);
      setBookingComplete(true);
      handleNext();
      setConfirmationDialog(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to book session');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateEndTime = () => {
    if (!selectedTime || !selectedDuration) return '';
    const [hours, minutes] = selectedTime.split(':');
    const start = new Date();
    start.setHours(parseInt(hours), parseInt(minutes));
    const end = new Date(start.getTime() + selectedDuration * 60000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateTotal = () => {
    if (!therapist || !selectedDuration) return '0.00';
    const rate = therapist.therapistDetails?.sessionRate || 150;
    return (rate * (selectedDuration / 50)).toFixed(2);
  };

  const isDateDisabled = (date) => {
    // You can add logic here to disable dates without availability
    return false;
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              {/* Date Selection */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Select Date
                  </Typography>
                  <DatePicker
                    label="Choose a date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    minDate={minDate}
                    maxDate={addDays(new Date(), 60)}
                    shouldDisableDate={isDateDisabled}
                    format="MM/dd/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        error: !selectedDate && error.includes('date'),
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Select a date to see available times
                  </Typography>
                </Card>
              </Grid>

              {/* Time Slots */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Available Times
                  </Typography>
                  {!selectedDate ? (
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      Please select a date first
                    </Typography>
                  ) : availabilityLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : therapistAvailability.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      Therapist hasn't set availability yet
                    </Typography>
                  ) : availableSlots.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No available slots for this date
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {availableSlots.map((time) => (
                        <Chip
                          key={time}
                          label={formatTime(time)}
                          onClick={() => handleTimeSelect(time)}
                          color={selectedTime === time ? 'primary' : 'default'}
                          variant={selectedTime === time ? 'filled' : 'outlined'}
                          sx={{ 
                            minWidth: 80, 
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: selectedTime === time ? 'primary.dark' : 'action.hover',
                            }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  {selectedDate && availableSlots.length > 0 && !selectedTime && error && (
                    <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                      Please select a time
                    </Typography>
                  )}
                </Card>
              </Grid>

              {/* Duration Selection */}
              <Grid item xs={12}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Session Duration
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {durations.map((duration) => (
                      <Chip
                        key={duration}
                        label={`${duration} min`}
                        onClick={() => handleDurationSelect(duration)}
                        color={selectedDuration === duration ? 'primary' : 'default'}
                        variant={selectedDuration === duration ? 'filled' : 'outlined'}
                        sx={{ 
                          minWidth: 100, 
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: selectedDuration === duration ? 'primary.dark' : 'action.hover',
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Card>
              </Grid>

              {/* Session Type */}
              <Grid item xs={12}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Session Type
                  </Typography>
                  <RadioGroup
                    row={!isMobile}
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                  >
                    {sessionTypes.map((type) => (
                      <FormControlLabel
                        key={type.value}
                        value={type.value}
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {type.icon}
                            <Box>
                              <Typography variant="body2">{type.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {type.description}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        sx={{ 
                          mr: 2, 
                          mb: isMobile ? 1 : 0,
                          p: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          width: isMobile ? '100%' : 'auto',
                        }}
                      />
                    ))}
                  </RadioGroup>
                </Card>
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Additional Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Any specific concerns or topics you'd like to discuss?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Card>
              </Grid>
            </Grid>
          </LocalizationProvider>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                    {therapist?.profile?.firstName?.[0]}
                    {therapist?.profile?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h5">
                      Dr. {therapist?.profile?.firstName} {therapist?.profile?.lastName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Rating value={therapist?.therapistDetails?.averageRating || 0} readOnly size="small" />
                      <Typography variant="body2" color="text.secondary">
                        ({therapist?.therapistDetails?.totalReviews || 0} reviews)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {therapist?.therapistDetails?.specializations?.slice(0, 3).map((spec) => (
                        <Chip key={spec} label={spec} size="small" />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Session Details
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><CalendarTodayIcon /></ListItemIcon>
                    <ListItemText
                      primary="Date"
                      secondary={selectedDate ? format(selectedDate, 'EEEE, MMMM do, yyyy') : ''}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><AccessTimeIcon /></ListItemIcon>
                    <ListItemText
                      primary="Time"
                      secondary={`${formatTime(selectedTime)} - ${calculateEndTime()}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><AccessTimeIcon /></ListItemIcon>
                    <ListItemText
                      primary="Duration"
                      secondary={`${selectedDuration} minutes`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {sessionTypes.find(t => t.value === sessionType)?.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary="Session Type"
                      secondary={sessionTypes.find(t => t.value === sessionType)?.label}
                    />
                  </ListItem>
                  <Divider sx={{ my: 1 }} />
                  <ListItem>
                    <ListItemText primary="Total Amount" />
                    <Typography variant="h6" color="primary">
                      ${calculateTotal()}
                    </Typography>
                  </ListItem>
                </List>
              </Card>
            </Grid>

            {notes && (
              <Grid item xs={12}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Your Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {notes}
                  </Typography>
                </Card>
              </Grid>
            )}
          </Grid>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" paragraph>
              Payment integration coming soon. For now, sessions can be booked without payment.
            </Typography>
            <Button
              variant="contained"
              onClick={handleBookSession}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Confirm Booking'}
            </Button>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Booking Confirmed!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your session has been successfully scheduled.
            </Typography>
            
            <Card sx={{ maxWidth: 500, mx: 'auto', mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Details
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Date" />
                    <Typography>
                      {selectedDate ? format(selectedDate, 'EEEE, MMMM do, yyyy') : ''}
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Time" />
                    <Typography>{formatTime(selectedTime)} - {calculateEndTime()}</Typography>
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="With" />
                    <Typography>
                      Dr. {therapist?.profile?.firstName} {therapist?.profile?.lastName}
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Booking ID" />
                    <Typography>{bookingId}</Typography>
                  </ListItem>
                </List>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/my-sessions')}
                  >
                    View My Sessions
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/chat/${therapistId}`)}
                  >
                    Message Therapist
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  if (loading && !therapist) {
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            Book Session with Dr. {therapist?.profile?.firstName} {therapist?.profile?.lastName}
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} alternativeLabel={isMobile}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Step Content */}
      <Paper sx={{ p: 3 }}>
        {getStepContent(activeStep)}

        {/* Navigation Buttons */}
        {activeStep < steps.length - 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={activeStep === 2 ? handleBookSession : handleNext}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : activeStep === 2 ? 'Confirm Booking' : 'Next'}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationDialog}
        onClose={() => setConfirmationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h5">Booking Confirmed!</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Your session has been successfully scheduled.
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><CalendarTodayIcon color="primary" /></ListItemIcon>
              <ListItemText
                primary="Session Time"
                secondary={selectedDate ? `${format(selectedDate, 'EEEE, MMMM do, yyyy')} at ${formatTime(selectedTime)}` : ''}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><AttachMoneyIcon color="primary" /></ListItemIcon>
              <ListItemText
                primary="Amount"
                secondary={`$${calculateTotal()}`}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon color="primary" /></ListItemIcon>
              <ListItemText
                primary="Booking ID"
                secondary={bookingId}
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/my-sessions')} variant="contained">
            View My Sessions
          </Button>
          <Button onClick={() => setConfirmationDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookSession;