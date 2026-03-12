import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Avatar,
  Chip,
  Rating,
  LinearProgress,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { matching, sessions } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Icons
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChatIcon from '@mui/icons-material/Chat';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const PatientDashboard = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    averageRating: 0,
  });
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recommendations
      const recsResponse = await matching.getRecommendations({ limit: 3 });
      setRecommendations(recsResponse.data.recommendations || []);

      // Fetch upcoming sessions
      const sessionsResponse = await sessions.getMySessions({ 
        status: 'scheduled',
        limit: 5 
      });
      setUpcomingSessions(sessionsResponse.data.sessions || []);

      // Calculate stats (simplified)
      const allSessions = await sessions.getMySessions({ limit: 100 });
      const sessionsList = allSessions.data.sessions || [];
      const completed = sessionsList.filter(s => s.status === 'completed');
      const avgRating = completed.reduce((acc, s) => acc + (s.rating?.score || 0), 0) / (completed.length || 1);

      setStats({
        totalSessions: sessionsList.length,
        completedSessions: completed.length,
        averageRating: avgRating,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.profile?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your mental health journey
        </Typography>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Sessions</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {stats.totalSessions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.completedSessions} completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Progress</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography variant="h3" color="secondary">
                  {stats.completedSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  completion rate
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PsychologyIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Average Rating</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating value={stats.averageRating} readOnly precision={0.5} />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({stats.completedSessions} reviews)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recommendations Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Recommended Therapists
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/matching')}
          >
            View All
          </Button>
        </Box>

        <Grid container spacing={2}>
          {recommendations.map((rec, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card variant="outlined">
                <CardActionArea onClick={() => navigate(`/book-session/${rec.therapist.id}`)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        sx={{ width: 56, height: 56, mr: 2, bgcolor: 'primary.main' }}
                      >
                        {rec.therapist.name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{rec.therapist.name}</Typography>
                        <Chip 
                          size="small" 
                          label={`${rec.match_score}% Match`}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      {rec.therapist.specializations?.slice(0, 3).map((spec, i) => (
                        <Chip
                          key={i}
                          label={spec}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {rec.therapist.experience} years exp.
                        </Typography>
                        <Rating value={rec.therapist.rating} readOnly size="small" />
                      </Box>
                      <Typography variant="body1" color="primary.main">
                        ${rec.therapist.session_rate}/hr
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Upcoming Sessions */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Upcoming Sessions
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/my-sessions')}
          >
            View Calendar
          </Button>
        </Box>

        {upcomingSessions.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
            No upcoming sessions. Book a session with a therapist!
          </Typography>
        ) : (
          upcomingSessions.map((session) => (
            <Card key={session._id} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2 }}>
                        {session.therapist?.profile?.firstName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          Dr. {session.therapist?.profile?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {session.therapist?.therapistDetails?.specializations?.[0]}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2">
                          {new Date(session.scheduledTime).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(session.scheduledTime).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      startIcon={<ChatIcon />}
                      onClick={() => navigate(`/chat/${session.therapist._id}`)}
                    >
                      Message
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))
        )}
      </Paper>
    </Box>
  );
};

export default PatientDashboard;