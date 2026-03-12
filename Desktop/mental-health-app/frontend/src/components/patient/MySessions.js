import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  Rating,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  LinearProgress,
  Stack,
  useMediaQuery,
  useTheme,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  InputAdornment,
  Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sessions as sessionsApi } from '../../services/api';
import { format, parseISO } from 'date-fns';

// Icons
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VideocamIcon from '@mui/icons-material/Videocam';
import PhoneIcon from '@mui/icons-material/Phone';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MessageIcon from '@mui/icons-material/Message';
import RateReviewIcon from '@mui/icons-material/RateReview';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningIcon from '@mui/icons-material/Warning';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sessions-tabpanel-${index}`}
      aria-labelledby={`sessions-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const statusColors = {
  scheduled: 'primary',
  ongoing: 'warning',
  completed: 'success',
  cancelled: 'error',
  'no-show': 'error',
  rescheduled: 'info',
};

const statusIcons = {
  scheduled: <EventAvailableIcon />,
  ongoing: <RefreshIcon />,
  completed: <CheckCircleIcon />,
  cancelled: <CancelIcon />,
  'no-show': <EventBusyIcon />,
  rescheduled: <HistoryIcon />,
};

const MySessions = () => {
  const [tabValue, setTabValue] = useState(0);
  const [sessions, setSessions] = useState({
    scheduled: [],
    completed: [],
    cancelled: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [rateDialog, setRateDialog] = useState(false);
  const [rating, setRating] = useState({
    score: 0,
    feedback: '',
  });
  const [notesDialog, setNotesDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesType, setNotesType] = useState('patient');
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    upcoming: 0,
    cancelled: 0,
    totalHours: 0,
  });
  const [permissionError, setPermissionError] = useState('');

  const navigate = useNavigate();
  const { user, isPatient } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, [tabValue, page, searchTerm, dateFilter, typeFilter]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    setPermissionError('');
    try {
      const status = getStatusFromTab(tabValue);
      const params = {
        page,
        limit: 10,
        search: searchTerm || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      };
      
      if (status) params.status = status;
      if (dateFilter !== 'all') {
        const now = new Date();
        if (dateFilter === 'upcoming') {
          params.startDate = now.toISOString();
        } else if (dateFilter === 'past') {
          params.endDate = now.toISOString();
        } else if (dateFilter === 'thisWeek') {
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
          params.startDate = weekStart.toISOString();
          params.endDate = weekEnd.toISOString();
        } else if (dateFilter === 'thisMonth') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          params.startDate = monthStart.toISOString();
          params.endDate = monthEnd.toISOString();
        }
      }

      console.log('Fetching sessions with params:', params);
      const response = await sessionsApi.getMySessions(params);
      console.log('Sessions response:', response.data);
      
      // Group sessions by status
      const grouped = {
        scheduled: [],
        completed: [],
        cancelled: [],
      };

      response.data.sessions.forEach(session => {
        if (session.status === 'scheduled' || session.status === 'ongoing' || session.status === 'rescheduled') {
          grouped.scheduled.push(session);
        } else if (session.status === 'completed') {
          grouped.completed.push(session);
        } else if (session.status === 'cancelled' || session.status === 'no-show') {
          grouped.cancelled.push(session);
        }
      });

      setSessions(grouped);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      if (error.response?.status === 403) {
        setPermissionError('You do not have permission to view these sessions');
      } else if (error.response?.status === 401) {
        setError('Please login to view your sessions');
      } else {
        setError('Failed to load sessions');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await sessionsApi.getMySessions({ limit: 1000 });
      const allSessions = response.data.sessions || [];
      
      const completed = allSessions.filter(s => s.status === 'completed');
      const totalMinutes = completed.reduce((acc, s) => acc + (s.duration || 0), 0);
      
      setStats({
        total: allSessions.length,
        completed: completed.length,
        upcoming: allSessions.filter(s => s.status === 'scheduled').length,
        cancelled: allSessions.filter(s => s.status === 'cancelled').length,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusFromTab = (tab) => {
    switch (tab) {
      case 0: return null; // All
      case 1: return 'scheduled'; // Upcoming
      case 2: return 'completed'; // Past
      case 3: return 'cancelled'; // Cancelled
      default: return null;
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1);
  };

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setDetailsDialog(true);
  };

  const handleRateSession = (session) => {
    setSelectedSession(session);
    setRating({ score: 0, feedback: '' });
    setRateDialog(true);
  };

  const handleSubmitRating = async () => {
    if (!rating.score) {
      showSnackbar('Please select a rating', 'warning');
      return;
    }

    try {
      await sessionsApi.rateSession(selectedSession._id, rating);
      setRateDialog(false);
      showSnackbar('Rating submitted successfully', 'success');
      fetchSessions();
    } catch (error) {
      console.error('Error submitting rating:', error);
      if (error.response?.status === 403) {
        showSnackbar('You do not have permission to rate this session', 'error');
      } else if (error.response?.status === 400) {
        showSnackbar(error.response.data.message || 'Cannot rate this session', 'error');
      } else {
        showSnackbar('Failed to submit rating', 'error');
      }
    }
  };

  const handleAddNotes = (session) => {
    setSelectedSession(session);
    setNotes(session.notes?.[notesType]?.content || '');
    setNotesDialog(true);
  };

  const handleSubmitNotes = async () => {
    try {
      await sessionsApi.addNotes(selectedSession._id, {
        content: notes,
        type: notesType,
      });
      setNotesDialog(false);
      showSnackbar('Notes saved successfully', 'success');
      fetchSessions();
    } catch (error) {
      console.error('Error saving notes:', error);
      if (error.response?.status === 403) {
        showSnackbar('You do not have permission to add notes to this session', 'error');
      } else {
        showSnackbar('Failed to save notes', 'error');
      }
    }
  };

  const handleCancelSession = async () => {
    if (!selectedSession) return;

    try {
      console.log('Cancelling session:', selectedSession._id);
      console.log('Current user:', user);
      console.log('Session patient:', selectedSession.patient);
      console.log('Session therapist:', selectedSession.therapist);
      
      // Check if user has permission to cancel
      const isPatientUser = selectedSession.patient?._id === user?.id;
      const isTherapistUser = selectedSession.therapist?._id === user?.id;
      
      if (!isPatientUser && !isTherapistUser) {
        showSnackbar('You do not have permission to cancel this session', 'error');
        setCancelDialog(false);
        return;
      }

      if (selectedSession.status !== 'scheduled') {
        showSnackbar('Only scheduled sessions can be cancelled', 'error');
        setCancelDialog(false);
        return;
      }

      await sessionsApi.updateStatus(selectedSession._id, {
        status: 'cancelled',
        cancellationReason: cancelReason,
      });
      setCancelDialog(false);
      setCancelReason('');
      showSnackbar('Session cancelled successfully', 'success');
      fetchSessions();
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

  const handleRescheduleSession = async () => {
    if (!selectedSession || !rescheduleDate || !rescheduleTime) {
      showSnackbar('Please select a new date and time', 'warning');
      return;
    }

    try {
      // Check if user has permission to reschedule
      const isPatientUser = selectedSession.patient?._id === user?.id;
      const isTherapistUser = selectedSession.therapist?._id === user?.id;
      
      if (!isPatientUser && !isTherapistUser) {
        showSnackbar('You do not have permission to reschedule this session', 'error');
        setRescheduleDialog(false);
        return;
      }

      if (selectedSession.status !== 'scheduled') {
        showSnackbar('Only scheduled sessions can be rescheduled', 'error');
        setRescheduleDialog(false);
        return;
      }

      const [hours, minutes] = rescheduleTime.split(':');
      const newDateTime = new Date(rescheduleDate);
      newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await sessionsApi.updateStatus(selectedSession._id, {
        status: 'rescheduled',
        rescheduledTime: newDateTime.toISOString(),
      });
      setRescheduleDialog(false);
      setRescheduleDate('');
      setRescheduleTime('');
      showSnackbar('Session rescheduled successfully', 'success');
      fetchSessions();
    } catch (error) {
      console.error('Error rescheduling session:', error);
      if (error.response?.status === 403) {
        showSnackbar('You do not have permission to reschedule this session', 'error');
      } else {
        showSnackbar('Failed to reschedule session', 'error');
      }
    }
  };

  const handleJoinSession = (session) => {
    if (session.sessionType === 'video') {
      navigate(`/video-call/${session._id}`);
    } else if (session.sessionType === 'chat') {
      const otherId = isPatient ? session.therapist._id : session.patient._id;
      navigate(`/chat/${otherId}`);
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = parseISO(dateString);
      return {
        date: format(date, 'EEE, MMM d, yyyy'),
        time: format(date, 'h:mm a'),
        full: format(date, 'EEE, MMM d, yyyy h:mm a'),
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
      case 'video': return <VideocamIcon />;
      case 'audio': return <PhoneIcon />;
      case 'chat': return <ChatIcon />;
      default: return <VideocamIcon />;
    }
  };

  const canModifySession = (session) => {
    if (!session || !user) return false;
    
    // Check if user is the patient or therapist for this session
    const isPatientUser = session.patient?._id === user?.id;
    const isTherapistUser = session.therapist?._id === user?.id;
    
    return isPatientUser || isTherapistUser;
  };

  const canCancelSession = (session) => {
    // Can only cancel if user has permission AND session is scheduled
    return canModifySession(session) && session.status === 'scheduled';
  };

  const canRescheduleSession = (session) => {
    // Can only reschedule if user has permission AND session is scheduled
    return canModifySession(session) && session.status === 'scheduled';
  };

  const canRateSession = (session) => {
    // Can only rate if user has permission, session is completed, and not already rated
    return canModifySession(session) && session.status === 'completed' && !session.rating;
  };

  const renderSessionCard = (session) => {
    const { date, time } = formatDateTime(session.scheduledTime);
    const otherParticipant = isPatient ? session.therapist : session.patient;
    const canJoin = (session.status === 'scheduled' || session.status === 'ongoing') && canModifySession(session);
    const canCancel = canCancelSession(session);
    const canReschedule = canRescheduleSession(session);
    const canRate = canRateSession(session);
    const hasPermission = canModifySession(session);

    return (
      <Card key={session._id} sx={{ mb: 2, position: 'relative' }}>
        <CardContent>
          {/* Status Badge */}
          <Chip
            size="small"
            icon={statusIcons[session.status]}
            label={session.status.toUpperCase()}
            color={statusColors[session.status]}
            sx={{ position: 'absolute', top: 16, right: 16 }}
          />

          {/* Permission Warning */}
          {!hasPermission && (
            <Chip
              size="small"
              icon={<WarningIcon />}
              label="View Only"
              color="warning"
              variant="outlined"
              sx={{ position: 'absolute', top: 16, left: 16 }}
            />
          )}

          <Grid container spacing={2}>
            {/* Participant Info */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}
                >
                  {otherParticipant?.profile?.firstName?.[0]}
                  {otherParticipant?.profile?.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {isPatient ? 'Dr. ' : ''}{otherParticipant?.profile?.firstName} {otherParticipant?.profile?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isPatient ? 'Therapist' : 'Patient'}
                  </Typography>
                  {!isPatient && session.patientDetails?.concerns && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      {session.patientDetails.concerns.slice(0, 2).map((concern) => (
                        <Chip key={concern} label={concern} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Session Details */}
            <Grid item xs={12} md={4}>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarTodayIcon fontSize="small" color="action" />
                  <Typography variant="body2">{date}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {time} ({session.duration} min)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getSessionIcon(session.sessionType)}
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {session.sessionType} Session
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            {/* Rating (if completed) */}
            {session.status === 'completed' && session.rating && (
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating value={session.rating.score} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary">
                    {session.rating.feedback?.substring(0, 50)}
                    {session.rating.feedback?.length > 50 ? '...' : ''}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', gap: 1, p: 2 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => handleViewDetails(session)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          {canJoin && (
            <Button
              variant="contained"
              size="small"
              startIcon={getSessionIcon(session.sessionType)}
              onClick={() => handleJoinSession(session)}
            >
              Join
            </Button>
          )}

          {canRate && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<RateReviewIcon />}
              onClick={() => handleRateSession(session)}
            >
              Rate
            </Button>
          )}

          <Tooltip title="Add Notes">
            <IconButton 
              size="small" 
              onClick={() => handleAddNotes(session)}
              disabled={!hasPermission}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Message">
            <IconButton
              size="small"
              onClick={() => navigate(`/chat/${otherParticipant._id}`)}
            >
              <MessageIcon />
            </IconButton>
          </Tooltip>

          {canReschedule && (
            <Tooltip title="Reschedule">
              <IconButton
                size="small"
                color="info"
                onClick={() => {
                  setSelectedSession(session);
                  setRescheduleDialog(true);
                }}
              >
                <ScheduleIcon />
              </IconButton>
            </Tooltip>
          )}

          {canCancel && (
            <Tooltip title="Cancel Session">
              <IconButton
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
          )}

          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </CardActions>
      </Card>
    );
  };

  if (loading && sessions.scheduled.length === 0 && sessions.completed.length === 0 && sessions.cancelled.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Stats */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Sessions
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Sessions
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.completed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Upcoming
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats.upcoming}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Hours
                </Typography>
                <Typography variant="h4">{stats.totalHours}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Filter</InputLabel>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                label="Date Filter"
              >
                <MenuItem value="all">All Dates</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="past">Past</MenuItem>
                <MenuItem value="thisWeek">This Week</MenuItem>
                <MenuItem value="thisMonth">This Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Session Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Session Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="chat">Chat</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => showSnackbar('Export feature coming soon!', 'info')}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Permission Error Display */}
      {permissionError && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setPermissionError('')}>
          {permissionError}
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All (${stats.total})`} />
          <Tab label={`Upcoming (${stats.upcoming})`} />
          <Tab label={`Past (${stats.completed})`} />
          <Tab label={`Cancelled (${stats.cancelled})`} />
        </Tabs>

        {/* Loading State */}
        {loading && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress />
          </Box>
        )}

        {/* All Sessions Tab */}
        <TabPanel value={tabValue} index={0}>
          {!loading && !error && sessions.scheduled.length === 0 && 
           sessions.completed.length === 0 && sessions.cancelled.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No sessions found
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/matching')}
                sx={{ mt: 2 }}
              >
                Find a Therapist
              </Button>
            </Box>
          ) : (
            <>
              {sessions.scheduled.map(renderSessionCard)}
              {sessions.completed.map(renderSessionCard)}
              {sessions.cancelled.map(renderSessionCard)}
            </>
          )}
        </TabPanel>

        {/* Upcoming Sessions Tab */}
        <TabPanel value={tabValue} index={1}>
          {sessions.scheduled.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No upcoming sessions
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/matching')}
              >
                Book a Session
              </Button>
            </Box>
          ) : (
            sessions.scheduled.map(renderSessionCard)
          )}
        </TabPanel>

        {/* Past Sessions Tab */}
        <TabPanel value={tabValue} index={2}>
          {sessions.completed.length === 0 ? (
            <Typography variant="h6" color="text.secondary" align="center" sx={{ py: 4 }}>
              No past sessions
            </Typography>
          ) : (
            sessions.completed.map(renderSessionCard)
          )}
        </TabPanel>

        {/* Cancelled Sessions Tab */}
        <TabPanel value={tabValue} index={3}>
          {sessions.cancelled.length === 0 ? (
            <Typography variant="h6" color="text.secondary" align="center" sx={{ py: 4 }}>
              No cancelled sessions
            </Typography>
          ) : (
            sessions.cancelled.map(renderSessionCard)
          )}
        </TabPanel>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Session Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedSession && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h5">Session Details</Typography>
                <Chip
                  icon={statusIcons[selectedSession.status]}
                  label={selectedSession.status.toUpperCase()}
                  color={statusColors[selectedSession.status]}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Session Information
                  </Typography>
                  <List>
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
                      <ListItemIcon>{getSessionIcon(selectedSession.sessionType)}</ListItemIcon>
                      <ListItemText
                        primary="Session Type"
                        secondary={selectedSession.sessionType}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText
                        primary="With"
                        secondary={isPatient ? 
                          `Dr. ${selectedSession.therapist?.profile?.firstName} ${selectedSession.therapist?.profile?.lastName}` :
                          `${selectedSession.patient?.profile?.firstName} ${selectedSession.patient?.profile?.lastName}`
                        }
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Additional Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Session ID"
                        secondary={selectedSession._id}
                      />
                    </ListItem>
                    {selectedSession.notes?.therapist && (
                      <ListItem>
                        <ListItemText
                          primary="Therapist Notes"
                          secondary={selectedSession.notes.therapist.content}
                        />
                      </ListItem>
                    )}
                    {selectedSession.notes?.patient && (
                      <ListItem>
                        <ListItemText
                          primary="Your Notes"
                          secondary={selectedSession.notes.patient.content}
                        />
                      </ListItem>
                    )}
                    {selectedSession.rating && (
                      <ListItem>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Your Rating
                          </Typography>
                          <Rating value={selectedSession.rating.score} readOnly />
                          <Typography variant="body2" color="text.secondary">
                            {selectedSession.rating.feedback}
                          </Typography>
                        </Box>
                      </ListItem>
                    )}
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialog(false)}>Close</Button>
              {selectedSession.status === 'scheduled' && canModifySession(selectedSession) && (
                <Button
                  variant="contained"
                  startIcon={getSessionIcon(selectedSession.sessionType)}
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

      {/* Rate Session Dialog */}
      <Dialog open={rateDialog} onClose={() => setRateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rate Your Session</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>How would you rate this session?</Typography>
            <Rating
              size="large"
              value={rating.score}
              onChange={(e, newValue) => setRating({ ...rating, score: newValue })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Feedback (optional)"
              value={rating.feedback}
              onChange={(e) => setRating({ ...rating, feedback: e.target.value })}
              placeholder="Share your experience..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitRating}
            variant="contained"
            disabled={!rating.score}
          >
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialog} onClose={() => setNotesDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Session Notes</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Note Type</InputLabel>
              <Select
                value={notesType}
                onChange={(e) => setNotesType(e.target.value)}
                label="Note Type"
              >
                <MenuItem value="patient">My Notes</MenuItem>
                <MenuItem value="therapist">Therapist's Notes (View Only)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={notesType === 'therapist'}
              placeholder="Add your private notes about this session..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitNotes}
            variant="contained"
            disabled={notesType === 'therapist'}
          >
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Session Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Session</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to cancel this session with {selectedSession?.patient?.profile?.firstName}?
          </Typography>
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

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialog} onClose={() => setRescheduleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reschedule Session</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="date"
            label="New Date"
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2, mb: 2 }}
            inputProps={{ min: new Date().toISOString().split('T')[0] }}
          />
          <TextField
            fullWidth
            label="New Time"
            type="time"
            value={rescheduleTime}
            onChange={(e) => setRescheduleTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleRescheduleSession} 
            variant="contained" 
            color="primary"
            disabled={!rescheduleDate || !rescheduleTime}
          >
            Confirm Reschedule
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

export default MySessions;