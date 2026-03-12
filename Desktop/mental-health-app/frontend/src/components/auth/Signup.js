import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PsychologyIcon from '@mui/icons-material/Psychology';
import PersonIcon from '@mui/icons-material/Person';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const Signup = () => {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <PsychologyIcon color="primary" sx={{ fontSize: 48, mr: 2 }} />
          <Typography component="h1" variant="h3">
            Join Mental Health Connect
          </Typography>
        </Box>

        <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Choose how you want to use our platform
        </Typography>

        <Grid container spacing={4}>
          {/* Patient Card */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <PersonIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                <Typography gutterBottom variant="h4" component="h2">
                  I'm a Patient
                </Typography>
                <Typography color="text.secondary" paragraph>
                  Looking for mental health support and therapy
                </Typography>
                <Box sx={{ textAlign: 'left', mt: 2 }}>
                  <Typography variant="body2" paragraph>✓ Find the right therapist for you</Typography>
                  <Typography variant="body2" paragraph>✓ Book and manage sessions</Typography>
                  <Typography variant="body2" paragraph>✓ Chat and video call with therapists</Typography>
                  <Typography variant="body2" paragraph>✓ Get personalized recommendations</Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  fullWidth 
                  variant="contained" 
                  size="large"
                  onClick={() => navigate('/signup/patient')}
                  sx={{ py: 1.5 }}
                >
                  Sign up as Patient
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Therapist Card */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <LocalHospitalIcon sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
                <Typography gutterBottom variant="h4" component="h2">
                  I'm a Therapist
                </Typography>
                <Typography color="text.secondary" paragraph>
                  Offering professional mental health services
                </Typography>
                <Box sx={{ textAlign: 'left', mt: 2 }}>
                  <Typography variant="body2" paragraph>✓ Create your professional profile</Typography>
                  <Typography variant="body2" paragraph>✓ Manage your availability</Typography>
                  <Typography variant="body2" paragraph>✓ Connect with patients</Typography>
                  <Typography variant="body2" paragraph>✓ Grow your practice</Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="secondary"
                  size="large"
                  onClick={() => navigate('/signup/therapist')}
                  sx={{ py: 1.5 }}
                >
                  Sign up as Therapist
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Button color="primary" onClick={() => navigate('/login')}>
              Login here
            </Button>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Signup;