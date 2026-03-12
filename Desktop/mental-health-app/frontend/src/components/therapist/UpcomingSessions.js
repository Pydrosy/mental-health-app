import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  LinearProgress,
  Stack,
  useMediaQuery,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sessions as sessionsApi } from '../../services/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, startOfDay, endOfDay, isToday, isThisWeek, parseISO } from 'date-fns';

// Icons
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VideocamIcon from '@mui/icons-material/Videocam';
import PhoneIcon from '@mui/icons-material/Phone';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MessageIcon from '@mui/icons-material/Message';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TodayIcon from '@mui/icons-material/Today';

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

const sessionTypes = [
  { value: 'video', label: 'Video Call', icon: <VideocamIcon /> },
  { value: 'audio', label: 'Audio Call', icon: <PhoneIcon /> },
  { value: 'chat', label: 'Chat Session', icon: <ChatIcon /> },
];

const UpcomingSessions = () => {
  const [tabValue, setTabValue] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [notesDialog, setNotesDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    total: 0,
    completed: 0,
    cancelled: 0,
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchSessions();
  }, [tabValue, selectedDate, searchTerm, filterStatus, page, rowsPerPage]);

  useEffect(() => {
    calculateStats();
  }, [sessions]);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const status = getStatusFromTab(tabValue);
      
      // Build params
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus : status || undefined,
      };

      // Add date filters based on selectedDate
      if (viewMode === 'calendar' && selectedDate) {
        params.startDate = startOfDay(selectedDate).toISOString();
        params.endDate = endOfDay(selectedDate).toISOString();
      }

      console.log('Fetching sessions with params:', params);
      
      const response = await sessionsApi.getMySessions(params);
      
      if (response.data && response.data.sessions) {
        setSessions(response.data.sessions);
        setTotalCount(response.data.pagination?.total || 0);
      } else {
        setSessions([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load sessions');
      
      // Set mock data for development if API fails
      if (process.env.NODE_ENV === 'development') {
        setMockData();
      }
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    const mockSessions = [
      {
        _id: '1',
        scheduledTime: new Date(Date.now() + 86400000).toISOString(),
        duration: 50,
        sessionType: 'video',
        status: 'scheduled',
        patient: {
          _id: 'p1',
          profile: { firstName: 'John', lastName: 'Doe' },
          patientDetails: { concerns: ['anxiety', 'stress'] },
        },
        notes: { therapist: '' },
      },
      {
        _id: '2',
        scheduledTime: new Date(Date.now() + 172800000).toISOString(),
        duration: 50,
        sessionType: 'audio',
        status: 'scheduled',
        patient: {
          _id: 'p2',
          profile: { firstName: 'Jane', lastName: 'Smith' },
          patientDetails: { concerns: ['depression'] },
        },
        notes: { therapist: '' },
      },
      {
        _id: '3',
        scheduledTime: new Date(Date.now() + 259200000).toISOString(),
        duration: 80,
        sessionType: 'video',
        status: 'scheduled',
        patient: {
          _id: 'p3',
          profile: { firstName: 'Mike', lastName: 'Johnson' },
          patientDetails: { concerns: ['trauma', 'ptsd'] },
        },
        notes: { therapist: '' },
      },
    ];
    setSessions(mockSessions);
    setTotalCount(mockSessions.length);
  };

  const calculateStats = () => {
    const today = sessions.filter(s => isToday(parseISO(s.scheduledTime))).length;
    const thisWeek = sessions.filter(s => isThisWeek(parseISO(s.scheduledTime))).length;
    const completed = sessions.filter(s => s.status === 'completed').length;
    const cancelled = sessions.filter(s => s.status === 'cancelled').length;

    setStats({
      today,
      thisWeek,
      total: sessions.length,
      completed,
      cancelled,
    });
  };

  const getStatusFromTab = (tab) => {
    switch (tab) {
      case 0: return 'scheduled';
      case 1: return 'ongoing';
      case 2: return 'completed';
      case 3: return 'cancelled';
      default: return 'scheduled';
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
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
      await sessionsApi.updateStatus(selectedSession._id, {
        status: 'cancelled',
        cancellationReason: cancelReason,
      });
      setCancelDialog(false);
      setCancelReason('');
      fetchSessions();
    } catch (error) {
      console.error('Error cancelling session:', error);
      setError('Failed to cancel session');
    }
  };

  const handleRescheduleSession = async () => {
    if (!selectedSession || !rescheduleDate || !rescheduleTime) return;
    
    try {
      const [hours, minutes] = rescheduleTime.split(':');
      const newDateTime = new Date(rescheduleDate);
      newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await sessionsApi.updateStatus(selectedSession._id, {
        status: 'rescheduled',
        rescheduledTime: newDateTime.toISOString(),
      });
      setRescheduleDialog(false);
      setRescheduleDate(null);
      setRescheduleTime('');
      fetchSessions();
    } catch (error) {
      console.error('Error rescheduling session:', error);
      setError('Failed to reschedule session');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedSession) return;
    
    try {
      await sessionsApi.addNotes(selectedSession._id, {
        content: sessionNotes,
        type: 'therapist',
      });
      setNotesDialog(false);
      fetchSessions();
    } catch (error) {
      console.error('Error saving notes:', error);
      setError('Failed to save notes');
    }
  };

  const formatDateTime = (dateString) => {
    const date = parseISO(dateString);
    return {
      date: format(date, 'EEE, MMM d, yyyy'),
      time: format(date, 'h:mm a'),
      full: format(date, 'EEE, MMM d, yyyy h:mm a'),
    };
  };

  const getSessionIcon = (type) => {
    switch (type) {
      case 'video': return <VideocamIcon />;
      case 'audio': return <PhoneIcon />;
      case 'chat': return <ChatIcon />;
      default: return <VideocamIcon />;
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const renderSessionCard = (session) => {
    const { date, time } = formatDateTime(session.scheduledTime);
    const canJoin = session.status === 'scheduled' || session.status === 'ongoing';
    const canCancel = session.status === 'scheduled';

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

          <Grid container spacing={2}>
            {/* Patient Info */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                  {session.patient?.profile?.firstName?.[0]}
                  {session.patient?.profile?.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {session.patient?.profile?.firstName} {session.patient?.profile?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Patient
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {session.patient?.patientDetails?.concerns?.slice(0, 3).map((concern) => (
                      <Chip key={concern} label={concern} size="small" variant="outlined" />
                    ))}
                  </Box>
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

            {/* Notes Preview */}
            <Grid item xs={12} md={4}>
              {session.notes?.therapist && (
                <Box sx={{ bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Your notes:
                  </Typography>
                  <Typography variant="body2" noWrap>
                    {session.notes.therapist.content}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', gap: 1, p: 2 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => handleViewSession(session)}>
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

          <Tooltip title="Message Patient">
            <IconButton
              size="small"
              onClick={() => handleMessagePatient(session.patient._id)}
            >
              <MessageIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add Notes">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedSession(session);
                setSessionNotes(session.notes?.therapist?.content || '');
                setNotesDialog(true);
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>

          {canCancel && (
            <>
              <Tooltip title="Reschedule">
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => {
                    setSelectedSession(session);
                    setRescheduleDate(parseISO(session.scheduledTime));
                    setRescheduleTime(format(parseISO(session.scheduledTime), 'HH:mm'));
                    setRescheduleDialog(true);
                  }}
                >
                  <ScheduleIcon />
                </IconButton>
              </Tooltip>
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
            </>
          )}

          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </CardActions>
      </Card>
    );
  };

  const renderTableView = () => (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Patient</TableCell>
            <TableCell>Date & Time</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Concerns</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session._id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                    {session.patient?.profile?.firstName?.[0]}
                  </Avatar>
                  <Typography variant="body2">
                    {session.patient?.profile?.firstName} {session.patient?.profile?.lastName}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>{formatDateTime(session.scheduledTime).full}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  icon={getSessionIcon(session.sessionType)}
                  label={session.sessionType}
                  variant="outlined"
                  sx={{ height: 24 }}
                />
              </TableCell>
              <TableCell>{session.duration} min</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={session.status}
                  color={statusColors[session.status]}
                  sx={{ height: 24 }}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {session.patient?.patientDetails?.concerns?.slice(0, 2).map((c) => (
                    <Chip key={c} label={c} size="small" variant="outlined" sx={{ height: 20 }} />
                  ))}
                </Box>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => handleViewSession(session)}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleMessagePatient(session.patient._id)}>
                  <MessageIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {sessions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <Typography color="text.secondary">No sessions found</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCalendarView = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handlePrevDay}>
          Previous Day
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Typography>
          <Button variant="outlined" startIcon={<TodayIcon />} onClick={handleToday}>
            Today
          </Button>
        </Box>
        <Button endIcon={<ArrowForwardIcon />} onClick={handleNextDay}>
          Next Day
        </Button>
      </Box>

      <Paper sx={{ p: 3, minHeight: 400 }}>
        {sessions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">No sessions scheduled for this day</Typography>
          </Box>
        ) : (
          <List>
            {sessions.map((session) => {
              const { time } = formatDateTime(session.scheduledTime);
              return (
                <ListItem
                  key={session._id}
                  secondaryAction={
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewSession(session)}
                    >
                      View
                    </Button>
                  }
                  divider
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
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
                          label={time}
                          color="primary"
                          variant="outlined"
                          sx={{ height: 20 }}
                        />
                        <Chip
                          size="small"
                          icon={getSessionIcon(session.sessionType)}
                          label={session.sessionType}
                          variant="outlined"
                          sx={{ height: 20 }}
                        />
                      </Box>
                    }
                    secondary={`${session.duration} minutes • ${session.status}`}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );

  if (loading && sessions.length === 0) {
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
        <Typography variant="h4" gutterBottom>
          Upcoming Sessions
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mt: 1, mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Today
                </Typography>
                <Typography variant="h4" color="primary">
                  {stats.today}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  This Week
                </Typography>
                <Typography variant="h4" color="secondary">
                  {stats.thisWeek}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total
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
        </Grid>

        {/* Search and Filter */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search patients..."
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
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>View Mode</InputLabel>
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                label="View Mode"
              >
                <MenuItem value="list">List View</MenuItem>
                <MenuItem value="calendar">Calendar View</MenuItem>
                <MenuItem value="table">Table View</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {
                // TODO: Implement export functionality
                alert('Export feature coming soon!');
              }}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Message */}
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
          <Tab label="Scheduled" />
          <Tab label="Ongoing" />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
        </Tabs>

        {/* Loading State */}
        {loading && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress />
          </Box>
        )}

        {/* View Content */}
        <Box sx={{ p: 3 }}>
          {viewMode === 'list' && (
            sessions.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No sessions found
              </Typography>
            ) : (
              sessions.map(renderSessionCard)
            )
          )}

          {viewMode === 'table' && renderTableView()}
          {viewMode === 'calendar' && renderCalendarView()}

          {/* Pagination (only for list and table views) */}
          {viewMode !== 'calendar' && totalCount > rowsPerPage && (
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ mt: 2 }}
            />
          )}
        </Box>
      </Paper>

      {/* Session Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="sm" fullWidth>
        {selectedSession && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h5">Session Details</Typography>
                <Chip
                  icon={statusIcons[selectedSession.status]}
                  label={selectedSession.status.toUpperCase()}
                  color={statusColors[selectedSession.status]}
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
                      <ListItemIcon>{getSessionIcon(selectedSession.sessionType)}</ListItemIcon>
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
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
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
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="New Date"
              value={rescheduleDate}
              onChange={setRescheduleDate}
              minDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { mt: 2, mb: 2 }
                }
              }}
            />
          </LocalizationProvider>
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

      {/* Notes Dialog */}
      <Dialog open={notesDialog} onClose={() => setNotesDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Session Notes</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={6}
            label="Notes"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Add private notes about this session..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveNotes} variant="contained">
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UpcomingSessions;