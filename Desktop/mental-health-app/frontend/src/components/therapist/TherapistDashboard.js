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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { therapists as therapistsApi, sessions as sessionsApi } from '../../services/api';

// Icons
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VideocamIcon from '@mui/icons-material/Videocam';
import PhoneIcon from '@mui/icons-material/Phone';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import StarIcon from '@mui/icons-material/Star';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MessageIcon from '@mui/icons-material/Message';
import SettingsIcon from '@mui/icons-material/Settings';
import PsychologyIcon from '@mui/icons-material/Psychology';

// Import Chart.js components properly
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
);

const TherapistDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiReady, setApiReady] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    cancelledSessions: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    completionRate: 0,
    newPatients: 0,
    activePatients: 0,
  });

  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Chart data states
  const [earningsData, setEarningsData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Earnings',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4,
        fill: false,
      },
    ],
  });

  const [sessionTypeData, setSessionTypeData] = useState({
    labels: ['Video', 'Audio', 'Chat'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Check if APIs are available
  useEffect(() => {
    console.log('therapistsApi:', therapistsApi);
    console.log('sessionsApi:', sessionsApi);
    
    if (therapistsApi?.getStats && sessionsApi?.getMySessions) {
      setApiReady(true);
    }
  }, []);

  useEffect(() => {
    if (apiReady) {
      fetchDashboardData();
    } else {
      // Use mock data if API is not ready
      setMockData();
      setLoading(false);
    }
  }, [apiReady]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      let statsData = {
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        cancelledSessions: 0,
        totalEarnings: 0,
        monthlyEarnings: 0,
        averageRating: 0,
        totalReviews: 0,
        completionRate: 0,
        newPatients: 0,
        activePatients: 0,
      };

      try {
        const statsResponse = await therapistsApi.getStats();
        if (statsResponse?.data?.statistics) {
          statsData = { ...statsData, ...statsResponse.data.statistics };
        }
      } catch (statsError) {
        console.warn('Error fetching stats, using defaults:', statsError);
      }

      let upcoming = [];
      try {
        const sessionsResponse = await sessionsApi.getMySessions({ 
          status: 'scheduled',
          limit: 5,
          sort: 'scheduledTime:asc'
        });
        upcoming = sessionsResponse?.data?.sessions || [];
      } catch (sessionsError) {
        console.warn('Error fetching sessions, using defaults:', sessionsError);
      }

      let completed = [];
      try {
        const completedResponse = await sessionsApi.getMySessions({ 
          status: 'completed',
          limit: 10,
          sort: 'updatedAt:desc'
        });
        completed = completedResponse?.data?.sessions || [];
      } catch (completedError) {
        console.warn('Error fetching completed sessions, using defaults:', completedError);
      }

      setStats(statsData);
      setUpcomingSessions(upcoming);
      
      const activity = completed.map(session => ({
        id: session._id,
        type: 'session_completed',
        patient: session.patient,
        time: session.updatedAt,
        rating: session.rating?.score,
        duration: session.duration,
      }));
      setRecentActivity(activity);

      if (completed.length > 0) {
        generateChartData(completed);
      } else {
        // Use mock chart data
        setEarningsData({
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Earnings',
              data: [3200, 3400, 3600, 3800, 3850, 4000],
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              tension: 0.4,
              fill: false,
            },
          ],
        });

        setSessionTypeData({
          labels: ['Video', 'Audio', 'Chat'],
          datasets: [
            {
              data: [85, 45, 12],
              backgroundColor: [
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
              ],
            },
          ],
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    setStats({
      totalSessions: 156,
      completedSessions: 142,
      upcomingSessions: 8,
      cancelledSessions: 6,
      totalEarnings: 23450,
      monthlyEarnings: 3850,
      averageRating: 4.8,
      totalReviews: 98,
      completionRate: 91,
      newPatients: 12,
      activePatients: 45,
    });

    setUpcomingSessions([
      {
        _id: '1',
        scheduledTime: new Date(Date.now() + 86400000).toISOString(),
        duration: 50,
        sessionType: 'video',
        patient: {
          profile: { firstName: 'John', lastName: 'Doe' }
        }
      },
      {
        _id: '2',
        scheduledTime: new Date(Date.now() + 172800000).toISOString(),
        duration: 50,
        sessionType: 'audio',
        patient: {
          profile: { firstName: 'Jane', lastName: 'Smith' }
        }
      },
      {
        _id: '3',
        scheduledTime: new Date(Date.now() + 259200000).toISOString(),
        duration: 80,
        sessionType: 'video',
        patient: {
          profile: { firstName: 'Mike', lastName: 'Johnson' }
        }
      },
    ]);

    setRecentActivity([
      {
        id: 'a1',
        type: 'session_completed',
        patient: { profile: { firstName: 'Alice', lastName: 'Brown' } },
        time: new Date(Date.now() - 86400000).toISOString(),
        rating: 5,
        duration: 50,
      },
      {
        id: 'a2',
        type: 'session_completed',
        patient: { profile: { firstName: 'Bob', lastName: 'Wilson' } },
        time: new Date(Date.now() - 172800000).toISOString(),
        rating: 4,
        duration: 50,
      },
    ]);

    setEarningsData({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Earnings',
          data: [3200, 3400, 3600, 3800, 3850, 4000],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.4,
          fill: false,
        },
      ],
    });

    setSessionTypeData({
      labels: ['Video', 'Audio', 'Chat'],
      datasets: [
        {
          data: [85, 45, 12],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
          ],
        },
      ],
    });
  };

  const generateChartData = (sessions) => {
    const monthlyEarnings = {};
    const sessionTypes = { video: 0, audio: 0, chat: 0 };
    
    sessions.forEach(session => {
      if (session.payment?.amount) {
        const month = new Date(session.scheduledTime).getMonth();
        monthlyEarnings[month] = (monthlyEarnings[month] || 0) + session.payment.amount;
      }
      
      if (session.sessionType) {
        sessionTypes[session.sessionType] = (sessionTypes[session.sessionType] || 0) + 1;
      }
    });

    setEarningsData({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Earnings',
          data: Object.values(monthlyEarnings),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.4,
          fill: false,
        },
      ],
    });

    setSessionTypeData({
      labels: ['Video', 'Audio', 'Chat'],
      datasets: [
        {
          data: [sessionTypes.video, sessionTypes.audio, sessionTypes.chat],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
          ],
        },
      ],
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: '', time: '' };
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      };
    } catch (e) {
      return { date: '', time: '' };
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

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '$0';
    return `$${value.toLocaleString()}`;
  };

  const StatCard = ({ title, value, icon, color, trend, trendValue }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography color="text.secondary" variant="body2">
            {title}
          </Typography>
          <Avatar sx={{ bgcolor: `${color}.light`, width: 40, height: 40 }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {trend === 'up' ? (
              <ArrowUpwardIcon fontSize="small" color="success" />
            ) : (
              <ArrowDownwardIcon fontSize="small" color="error" />
            )}
            <Typography variant="body2" color="text.secondary">
              {trendValue}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Welcome back, Dr. {user?.profile?.lastName || 'Therapist'}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's an overview of your practice
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sessions"
            value={stats.totalSessions}
            icon={<EventAvailableIcon />}
            color="primary"
            trend="up"
            trendValue="+12 from last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={stats.completedSessions}
            icon={<CheckCircleIcon />}
            color="success"
            trend="up"
            trendValue="+8 from last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming"
            value={stats.upcomingSessions}
            icon={<ScheduleIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Earnings"
            value={formatCurrency(stats.monthlyEarnings)}
            icon={<AttachMoneyIcon />}
            color="secondary"
            trend="up"
            trendValue="+$450 from last month"
          />
        </Grid>
      </Grid>

      {/* Second Row Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Average Rating
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4">{stats.averageRating.toFixed(1)}</Typography>
                <Rating value={stats.averageRating} readOnly precision={0.1} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Based on {stats.totalReviews} reviews
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completion Rate
              </Typography>
              <Typography variant="h4">{stats.completionRate}%</Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.completionRate} 
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Patients
              </Typography>
              <Typography variant="h4">{stats.activePatients}</Typography>
              <Typography variant="body2" color="success.main">
                +{stats.newPatients} new this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Earnings
              </Typography>
              <Typography variant="h4">{formatCurrency(stats.totalEarnings)}</Typography>
              <Typography variant="body2" color="text.secondary">
                Lifetime
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Earnings Overview
            </Typography>
            <Box sx={{ height: 300, position: 'relative' }}>
              <Line 
                key="earnings-chart"
                data={earningsData}
                options={lineChartOptions}
                redraw={true}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Session Types
            </Typography>
            <Box sx={{ height: 300, position: 'relative' }}>
              <Pie 
                key="session-chart"
                data={sessionTypeData}
                options={chartOptions}
                redraw={true}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Upcoming Sessions and Recent Activity */}
      <Grid container spacing={3}>
        {/* Upcoming Sessions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Upcoming Sessions</Typography>
              <Button size="small" onClick={() => navigate('/therapist/sessions')}>
                View All
              </Button>
            </Box>
            
            {upcomingSessions.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No upcoming sessions
              </Typography>
            ) : (
              <List>
                {upcomingSessions.map((session) => {
                  const { date, time } = formatDateTime(session.scheduledTime);
                  return (
                    <ListItem
                      key={session._id}
                      secondaryAction={
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          onClick={() => navigate(`/therapist/sessions/${session._id}`)}
                        >
                          Details
                        </Button>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {session.patient?.profile?.firstName?.[0] || '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle2">
                              {session.patient?.profile?.firstName || 'Unknown'} {session.patient?.profile?.lastName || ''}
                            </Typography>
                            <Chip
                              size="small"
                              icon={getSessionIcon(session.sessionType)}
                              label={session.sessionType || 'video'}
                              variant="outlined"
                              sx={{ height: 20 }}
                            />
                          </Box>
                        }
                        secondary={
                          date && time ? (
                            <Typography variant="body2" component="span">
                              {date} at {time} • {session.duration || 50} min
                            </Typography>
                          ) : (
                            <Typography variant="body2" component="span">
                              Time not set
                            </Typography>
                          )
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            
            {recentActivity.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No recent activity
              </Typography>
            ) : (
              <List>
                {recentActivity.slice(0, 5).map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.light' }}>
                        <CheckCircleIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2">
                          Session with {activity.patient?.profile?.firstName || 'Unknown'} {activity.patient?.profile?.lastName || ''}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" component="span">
                            Completed • {activity.duration || 50} min
                          </Typography>
                          {activity.rating && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <Rating value={activity.rating} readOnly size="small" />
                              <Typography variant="caption" color="text.secondary">
                                rated
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <Typography variant="caption" color="text.secondary">
                      {activity.time ? new Date(activity.time).toLocaleDateString() : ''}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<EventAvailableIcon />}
              onClick={() => navigate('/therapist/availability')}
              sx={{ py: 1.5 }}
            >
              Manage Availability
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/therapist/sessions')}
              sx={{ py: 1.5 }}
            >
              View Sessions
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<MessageIcon />}
              onClick={() => navigate('/chat')}
              sx={{ py: 1.5 }}
            >
              Messages
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/therapist/profile')}
              sx={{ py: 1.5 }}
            >
              Profile Settings
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default TherapistDashboard;