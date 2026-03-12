import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  useMediaQuery,
  useTheme,
  Snackbar,
} from '@mui/material';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useAuth } from '../../contexts/AuthContext';
import { sessions } from '../../services/api';

// Icons
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RefreshIcon from '@mui/icons-material/Refresh';

// Initialize Agora
const appId = 'e7f6e9aeecf14b2ba10e3f40be9f56e7'; // Your Agora App ID

const VideoCallSimple = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [client, setClient] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [remoteAudioTracks, setRemoteAudioTracks] = useState({});
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [endCallDialog, setEndCallDialog] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [networkQuality, setNetworkQuality] = useState('good');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [initializing, setInitializing] = useState(false);

  const localVideoRef = useRef(null);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    } else {
      setError('No session ID provided');
      setLoading(false);
    }
    
    return () => {
      leaveCall();
    };
  }, [sessionId]);

  useEffect(() => {
    let timer;
    if (isJoined) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isJoined]);

  // Monitor network quality
  useEffect(() => {
    if (client) {
      client.on('network-quality', (stats) => {
        const uplinkQuality = stats.uplinkNetworkQuality;
        const downlinkQuality = stats.downlinkNetworkQuality;
        
        if (uplinkQuality >= 4 || downlinkQuality >= 4) {
          setNetworkQuality('poor');
        } else if (uplinkQuality >= 3 || downlinkQuality >= 3) {
          setNetworkQuality('fair');
        } else {
          setNetworkQuality('good');
        }
      });
    }
  }, [client]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      console.log('Fetching session with ID:', sessionId);
      console.log('Current user:', user);
      
      const response = await sessions.getById(sessionId);
      console.log('Session response:', response.data);
      
      const sessionData = response.data.session;
      setSession(sessionData);
      
      // Check if user is authorized
      const patientId = sessionData.patient?._id?.toString() || sessionData.patient?.toString();
      const therapistId = sessionData.therapist?._id?.toString() || sessionData.therapist?.toString();
      const currentUserId = user?.id?.toString() || user?._id?.toString();
      
      console.log('Authorization check:', {
        currentUserId,
        patientId,
        therapistId
      });
      
      const isPatient = patientId === currentUserId;
      const isTherapist = therapistId === currentUserId;
      
      if (!isPatient && !isTherapist) {
        setError('You are not authorized to join this session');
        setLoading(false);
        return;
      }
      
      // Initialize Agora after session is loaded
      await initAgora();
      
    } catch (error) {
      console.error('Error fetching session:', error);
      if (error.response?.status === 403) {
        setError('You do not have permission to access this session');
      } else if (error.response?.status === 404) {
        setError('Session not found');
      } else {
        setError('Failed to load session details');
      }
    } finally {
      setLoading(false);
    }
  };

  const initAgora = async () => {
    try {
      setInitializing(true);
      
      // Check if Agora is properly initialized
      if (!AgoraRTC) {
        throw new Error('AgoraRTC not loaded');
      }

      // Create Agora client
      const agoraClient = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8',
      });
      
      setClient(agoraClient);

      // Set up event handlers
      agoraClient.on('user-published', handleUserPublished);
      agoraClient.on('user-unpublished', handleUserUnpublished);
      agoraClient.on('user-joined', handleUserJoined);
      agoraClient.on('user-left', handleUserLeft);
      agoraClient.on('connection-state-change', handleConnectionStateChange);

      // Join the channel
      const channelName = `session-${sessionId}`;
      const token = null; // In production, you should generate a token from your backend
      
      console.log('Joining channel:', channelName);
      const uid = await agoraClient.join(appId, channelName, token, user?.id);
      
      console.log('Joined channel with UID:', uid);

      // Create local tracks with error handling
      let videoTrack, audioTrack;
      
      try {
        videoTrack = await AgoraRTC.createCameraVideoTrack();
        console.log('Video track created');
      } catch (videoErr) {
        console.error('Error creating video track:', videoErr);
        setPermissionDenied(true);
        setSnackbar({
          open: true,
          message: 'Could not access camera. Please check permissions.',
          severity: 'warning'
        });
      }

      try {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        console.log('Audio track created');
      } catch (audioErr) {
        console.error('Error creating audio track:', audioErr);
        setPermissionDenied(true);
        setSnackbar({
          open: true,
          message: 'Could not access microphone. Please check permissions.',
          severity: 'warning'
        });
      }

      setLocalVideoTrack(videoTrack);
      setLocalAudioTrack(audioTrack);

      // Publish local tracks
      const tracksToPublish = [];
      if (audioTrack) tracksToPublish.push(audioTrack);
      if (videoTrack) tracksToPublish.push(videoTrack);
      
      if (tracksToPublish.length > 0) {
        await agoraClient.publish(tracksToPublish);
        setIsJoined(true);
        setSnackbar({
          open: true,
          message: 'Connected to video call',
          severity: 'success'
        });
      } else {
        // If no tracks, still mark as joined but show warning
        setIsJoined(true);
      }

      // Play local video if available
      if (videoTrack && localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

    } catch (err) {
      console.error('Failed to initialize Agora:', err);
      setError('Failed to initialize video call. Please check your connection and try again.');
    } finally {
      setInitializing(false);
    }
  };

  const handleUserJoined = (user) => {
    console.log('User joined:', user.uid);
    setSnackbar({
      open: true,
      message: 'Another participant has joined',
      severity: 'info'
    });
  };

  const handleUserLeft = (user) => {
    console.log('User left:', user.uid);
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    setSnackbar({
      open: true,
      message: 'Participant has left the call',
      severity: 'info'
    });
  };

  const handleConnectionStateChange = (curState, revState) => {
    console.log('Connection state changed:', curState);
    if (curState === 'DISCONNECTED') {
      setSnackbar({
        open: true,
        message: 'Disconnected from call',
        severity: 'error'
      });
    } else if (curState === 'CONNECTED') {
      setSnackbar({
        open: true,
        message: 'Connected to call',
        severity: 'success'
      });
    }
  };

  const handleUserPublished = async (user, mediaType) => {
    console.log('User published:', user.uid, mediaType);
    await client.subscribe(user, mediaType);
    
    if (mediaType === 'video') {
      setRemoteUsers(prev => {
        if (!prev.find(u => u.uid === user.uid)) {
          return [...prev, user];
        }
        return prev;
      });

      // Play remote video
      setTimeout(() => {
        const remoteContainer = document.getElementById(`remote-video-${user.uid}`);
        if (remoteContainer && user.videoTrack) {
          user.videoTrack.play(remoteContainer);
        }
      }, 100);
    }

    if (mediaType === 'audio') {
      // Store audio track reference
      setRemoteAudioTracks(prev => ({
        ...prev,
        [user.uid]: user.audioTrack
      }));
      
      if (isSpeakerEnabled) {
        user.audioTrack?.play();
      }
    }
  };

  const handleUserUnpublished = (user, mediaType) => {
    console.log('User unpublished:', user.uid, mediaType);
    if (mediaType === 'video') {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    }
    if (mediaType === 'audio') {
      setRemoteAudioTracks(prev => {
        const newTracks = { ...prev };
        delete newTracks[user.uid];
        return newTracks;
      });
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
      setSnackbar({
        open: true,
        message: isAudioEnabled ? 'Microphone muted' : 'Microphone unmuted',
        severity: 'info'
      });
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
      setSnackbar({
        open: true,
        message: isVideoEnabled ? 'Camera turned off' : 'Camera turned on',
        severity: 'info'
      });
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled);
    
    // Mute/unmute all remote audio tracks
    Object.values(remoteAudioTracks).forEach(track => {
      if (isSpeakerEnabled) {
        track?.stop();
      } else {
        track?.play();
      }
    });

    setSnackbar({
      open: true,
      message: isSpeakerEnabled ? 'Speaker muted' : 'Speaker unmuted',
      severity: 'info'
    });
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack();
        setScreenTrack(screenTrack);
        
        // Replace video track with screen track
        if (localVideoTrack) {
          await client.unpublish(localVideoTrack);
        }
        await client.publish(screenTrack);
        
        setIsScreenSharing(true);
        setSnackbar({
          open: true,
          message: 'Screen sharing started',
          severity: 'success'
        });
      } catch (error) {
        console.error('Failed to share screen:', error);
        setSnackbar({
          open: true,
          message: 'Failed to start screen sharing',
          severity: 'error'
        });
      }
    } else {
      // Stop screen sharing
      if (screenTrack) {
        await client.unpublish(screenTrack);
        screenTrack.stop();
        screenTrack.close();
      }
      
      // Restore camera
      if (localVideoTrack) {
        await client.publish(localVideoTrack);
      }
      
      setIsScreenSharing(false);
      setScreenTrack(null);
      setSnackbar({
        open: true,
        message: 'Screen sharing stopped',
        severity: 'info'
      });
    }
  };

  const leaveCall = async () => {
    try {
      // Close local tracks
      if (localAudioTrack) {
        localAudioTrack.close();
      }
      if (localVideoTrack) {
        localVideoTrack.close();
      }
      if (screenTrack) {
        screenTrack.close();
      }

      // Leave channel
      if (client) {
        await client.leave();
      }

      // Update session status if needed (only if it was ongoing)
      if (session && isJoined) {
        try {
          await sessions.updateStatus(sessionId, { status: 'completed' });
        } catch (err) {
          console.error('Error updating session status:', err);
        }
      }

      navigate('/my-sessions');
    } catch (error) {
      console.error('Error leaving call:', error);
      navigate('/my-sessions');
    }
  };

  const handleRetry = () => {
    setError('');
    setPermissionDenied(false);
    fetchSession();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hours = Math.floor(mins / 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getNetworkColor = () => {
    switch (networkQuality) {
      case 'good': return 'success';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/my-sessions')} 
          sx={{ mr: 2 }}
        >
          Go to My Sessions
        </Button>
        <Button 
          variant="outlined" 
          onClick={handleRetry}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!session) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Session not found
        </Alert>
        <Button variant="contained" onClick={() => navigate('/my-sessions')}>
          Go to My Sessions
        </Button>
      </Box>
    );
  }

  const otherParticipant = session?.patient?._id === user?.id || session?.patient === user?.id
    ? session?.therapist
    : session?.patient;

  if (!otherParticipant) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Could not determine other participant
        </Alert>
        <Button variant="contained" onClick={() => navigate('/my-sessions')}>
          Go to My Sessions
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', bgcolor: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
      {/* Remote Videos Grid */}
      <Grid container sx={{ height: '100%' }}>
        {remoteUsers.length === 0 ? (
          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.1)' }}>
              <Typography variant="h5" color="white" gutterBottom>
                Waiting for {otherParticipant?.profile?.firstName} to join...
              </Typography>
              <Typography variant="body1" color="grey.400">
                The call will start automatically when they connect
              </Typography>
              {initializing && (
                <Box sx={{ mt: 2 }}>
                  <CircularProgress size={30} sx={{ color: 'white' }} />
                  <Typography color="white" sx={{ mt: 1 }}>
                    Initializing camera and microphone...
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        ) : (
          remoteUsers.map((remoteUser, index) => (
            <Grid
              item
              xs={12}
              md={remoteUsers.length === 1 ? 12 : 6}
              key={remoteUser.uid}
              sx={{ height: '50%', position: 'relative' }}
            >
              <Box
                id={`remote-video-${remoteUser.uid}`}
                sx={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#2a2a2a',
                  '& video': {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  },
                }}
              />
              <Chip
                label={otherParticipant?.profile?.firstName}
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                }}
              />
              {!remoteUser.videoTrack && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    textAlign: 'center',
                  }}
                >
                  <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: 'primary.main' }}>
                    {otherParticipant?.profile?.firstName?.[0]}
                  </Avatar>
                  <Typography>Camera is off</Typography>
                </Box>
              )}
            </Grid>
          ))
        )}
      </Grid>

      {/* Local Video (Picture-in-Picture) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 100,
          right: 20,
          width: isMobile ? 120 : 200,
          height: isMobile ? 160 : 150,
          borderRadius: 2,
          overflow: 'hidden',
          border: '2px solid white',
          zIndex: 10,
          bgcolor: '#2a2a2a',
        }}
      >
        <Box
          ref={localVideoRef}
          id="local-video"
          sx={{
            width: '100%',
            height: '100%',
            '& video': {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
            },
          }}
        />
        {!isVideoEnabled && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.7)',
            }}
          >
            <VideocamOffIcon sx={{ color: 'white', fontSize: 40 }} />
          </Box>
        )}
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 5,
            left: 5,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            px: 1,
            borderRadius: 1,
          }}
        >
          You
        </Typography>
      </Box>

      {/* Top Bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate('/my-sessions')}
            sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Paper sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', px: 2, py: 1 }}>
            <Typography variant="body2">
              {formatDuration(callDuration)}
            </Typography>
          </Paper>
          <Chip
            size="small"
            label={networkQuality}
            color={getNetworkColor()}
            sx={{ bgcolor: 'rgba(0,0,0,0.6)' }}
          />
        </Box>

        <Paper sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', px: 2, py: 1 }}>
          <Typography variant="body2">
            Session with {otherParticipant?.profile?.firstName} {otherParticipant?.profile?.lastName}
          </Typography>
        </Paper>
      </Box>

      {/* Call Controls */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 2,
          bgcolor: 'rgba(0,0,0,0.8)',
          borderRadius: 4,
          p: 1.5,
          zIndex: 20,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Tooltip title={isAudioEnabled ? 'Mute' : 'Unmute'}>
          <IconButton
            onClick={toggleAudio}
            sx={{
              bgcolor: isAudioEnabled ? 'rgba(255,255,255,0.1)' : 'error.main',
              color: 'white',
              '&:hover': {
                bgcolor: isAudioEnabled ? 'rgba(255,255,255,0.2)' : 'error.dark',
              },
            }}
          >
            {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title={isVideoEnabled ? 'Stop Video' : 'Start Video'}>
          <IconButton
            onClick={toggleVideo}
            sx={{
              bgcolor: isVideoEnabled ? 'rgba(255,255,255,0.1)' : 'error.main',
              color: 'white',
              '&:hover': {
                bgcolor: isVideoEnabled ? 'rgba(255,255,255,0.2)' : 'error.dark',
              },
            }}
          >
            {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title={isSpeakerEnabled ? 'Mute Speaker' : 'Unmute Speaker'}>
          <IconButton
            onClick={toggleSpeaker}
            sx={{
              bgcolor: isSpeakerEnabled ? 'rgba(255,255,255,0.1)' : 'warning.main',
              color: 'white',
              '&:hover': {
                bgcolor: isSpeakerEnabled ? 'rgba(255,255,255,0.2)' : 'warning.dark',
              },
            }}
          >
            {isSpeakerEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}>
          <span>
            <IconButton
              onClick={toggleScreenShare}
              sx={{
                bgcolor: isScreenSharing ? 'primary.main' : 'rgba(255,255,255,0.1)',
                color: 'white',
                '&:hover': {
                  bgcolor: isScreenSharing ? 'primary.dark' : 'rgba(255,255,255,0.2)',
                },
              }}
            >
              {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="End Call">
          <IconButton
            onClick={() => setEndCallDialog(true)}
            sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
          >
            <CallEndIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* End Call Dialog */}
      <Dialog open={endCallDialog} onClose={() => setEndCallDialog(false)}>
        <DialogTitle>End Call</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to end this call?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndCallDialog(false)}>Cancel</Button>
          <Button onClick={leaveCall} variant="contained" color="error">
            End Call
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Permission Denied Warning */}
      {permissionDenied && (
        <Alert 
          severity="warning" 
          sx={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}
        >
          Camera or microphone access denied. You can still join the call but others won't see/hear you.
        </Alert>
      )}
    </Box>
  );
};

export default VideoCallSimple;