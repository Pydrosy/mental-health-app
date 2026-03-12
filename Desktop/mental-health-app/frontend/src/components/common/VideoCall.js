import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Avatar,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Slide,
  Zoom,
  Fab,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sessions } from '../../services/api';
import AgoraRTC from 'agora-rtc-sdk-ng';
import AgoraRTM from 'agora-rtm-sdk';

// Icons
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ChatIcon from '@mui/icons-material/Chat';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InfoIcon from '@mui/icons-material/Info';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Initialize Agora
const appId = 'YOUR_AGORA_APP_ID'; // Replace with your Agora App ID

const VideoCall = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [client, setClient] = useState(null);
  const [rtmClient, setRtmClient] = useState(null);
  const [localTracks, setLocalTracks] = useState({
    audioTrack: null,
    videoTrack: null,
  });
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState('chat'); // 'chat', 'participants'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState({
    audioInput: '',
    audioOutput: '',
    videoInput: '',
  });
  const [devices, setDevices] = useState({
    audioInput: [],
    audioOutput: [],
    videoInput: [],
  });
  const [endCallDialog, setEndCallDialog] = useState(false);
  const [stats, setStats] = useState({
    duration: 0,
    bitrate: 0,
    packetLoss: 0,
  });

  const videoRefs = useRef({});
  const durationInterval = useRef(null);

  // Fetch session details
  useEffect(() => {
    fetchSession();
    return () => {
      leaveCall();
    };
  }, [sessionId]);

  // Initialize Agora
  useEffect(() => {
    if (session && !client) {
      initializeAgora();
    }
  }, [session]);

  // Duration timer
  useEffect(() => {
    if (isJoined) {
      durationInterval.current = setInterval(() => {
        setStats(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [isJoined]);

  // Get available devices
  useEffect(() => {
    getDevices();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await sessions.getById(sessionId);
      setSession(response.data.session);
      
      // Check if user is authorized
      if (response.data.session.patient._id !== user?.id && 
          response.data.session.therapist._id !== user?.id) {
        setError('You are not authorized to join this session');
      }
    } catch (error) {
      setError('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const initializeAgora = async () => {
    try {
      // Create RTC client
      const rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(rtcClient);

      // Create RTM client for messaging
      const rtm = AgoraRTM.createInstance(appId);
      setRtmClient(rtm);

      // Set up event handlers
      rtcClient.on('user-published', handleUserPublished);
      rtcClient.on('user-unpublished', handleUserUnpublished);
      rtcClient.on('user-joined', handleUserJoined);
      rtcClient.on('user-left', handleUserLeft);
      rtcClient.on('connection-state-change', handleConnectionStateChange);

      // Join channel
      const uid = await rtcClient.join(
        appId,
        `session-${sessionId}`,
        null,
        user?.id
      );

      // Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks({ audioTrack, videoTrack });

      // Publish local tracks
      await rtcClient.publish([audioTrack, videoTrack]);
      setIsJoined(true);

      // Play local video
      videoTrack.play('local-video');

      // Join RTM channel
      await rtm.login({ uid: user?.id });
      const channel = rtm.createChannel(`session-${sessionId}`);
      await channel.join();

      // Set up RTM message handler
      channel.on('ChannelMessage', (message, memberId) => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          userId: memberId,
          text: message.text,
          timestamp: new Date(),
        }]);
      });

      // Start connection quality monitoring
      startQualityMonitoring(rtcClient);

    } catch (error) {
      console.error('Failed to initialize Agora:', error);
      setError('Failed to initialize video call');
    }
  };

  const handleUserPublished = async (user, mediaType) => {
    await client.subscribe(user, mediaType);
    
    if (mediaType === 'video') {
      setRemoteUsers(prev => {
        if (!prev.find(u => u.uid === user.uid)) {
          return [...prev, user];
        }
        return prev;
      });
    }

    if (mediaType === 'audio') {
      user.audioTrack?.play();
    }
  };

  const handleUserUnpublished = (user, mediaType) => {
    if (mediaType === 'video') {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    }
  };

  const handleUserJoined = (user) => {
    console.log('User joined:', user.uid);
  };

  const handleUserLeft = (user) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
  };

  const handleConnectionStateChange = (curState, revState) => {
    console.log('Connection state:', curState);
  };

  const startQualityMonitoring = (rtcClient) => {
    setInterval(async () => {
      const stats = await rtcClient.getRTCStats();
      setStats(prev => ({
        ...prev,
        bitrate: stats.RecvBitrate || 0,
        packetLoss: stats.RecvPacketLossRate || 0,
      }));

      // Determine connection quality
      if (stats.RecvPacketLossRate > 10) {
        setConnectionQuality('poor');
      } else if (stats.RecvPacketLossRate > 5) {
        setConnectionQuality('fair');
      } else {
        setConnectionQuality('good');
      }
    }, 2000);
  };

  const getDevices = async () => {
    const devices = await AgoraRTC.getDevices();
    setDevices({
      audioInput: devices.filter(d => d.kind === 'audioinput'),
      audioOutput: devices.filter(d => d.kind === 'audiooutput'),
      videoInput: devices.filter(d => d.kind === 'videoinput'),
    });

    // Set default devices
    if (devices.length > 0) {
      setSelectedDevice({
        audioInput: devices.find(d => d.kind === 'audioinput')?.deviceId || '',
        audioOutput: devices.find(d => d.kind === 'audiooutput')?.deviceId || '',
        videoInput: devices.find(d => d.kind === 'videoinput')?.deviceId || '',
      });
    }
  };

  const toggleAudio = async () => {
    if (localTracks.audioTrack) {
      await localTracks.audioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = async () => {
    if (localTracks.videoTrack) {
      await localTracks.videoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack();
        setScreenTrack(screenTrack);
        
        // Replace video track with screen track
        await client.unpublish(localTracks.videoTrack);
        await client.publish(screenTrack);
        
        // Stop local camera
        localTracks.videoTrack.stop();
        localTracks.videoTrack.close();
        
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Failed to share screen:', error);
      }
    } else {
      // Stop screen sharing
      await client.unpublish(screenTrack);
      screenTrack.stop();
      screenTrack.close();
      
      // Restore camera
      const [videoTrack] = await AgoraRTC.createCameraVideoTrack();
      setLocalTracks(prev => ({ ...prev, videoTrack }));
      await client.publish(videoTrack);
      
      setIsScreenSharing(false);
      setScreenTrack(null);
    }
  };

  const leaveCall = async () => {
    try {
      // Stop all tracks
      localTracks.audioTrack?.stop();
      localTracks.audioTrack?.close();
      localTracks.videoTrack?.stop();
      localTracks.videoTrack?.close();
      screenTrack?.stop();
      screenTrack?.close();

      // Leave channel
      if (client) {
        await client.leave();
      }

      // Leave RTM
      if (rtmClient) {
        await rtmClient.logout();
      }

      // Update session status
      if (session) {
        await sessions.updateStatus(sessionId, 'completed');
      }

      navigate(-1);
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !rtmClient) return;

    const channel = rtmClient.createChannel(`session-${sessionId}`);
    await channel.sendMessage({ text: newMessage });
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      userId: user?.id,
      text: newMessage,
      timestamp: new Date(),
      isLocal: true,
    }]);
    
    setNewMessage('');
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setFullscreen(!fullscreen);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionColor = () => {
    switch (connectionQuality) {
      case 'good':
        return 'success';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'default';
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  const otherParticipant = session?.patient._id === user?.id
    ? session?.therapist
    : session?.patient;

  return (
    <Box sx={{ height: '100vh', bgcolor: 'black', position: 'relative', overflow: 'hidden' }}>
      {/* Main Video Grid */}
      <Grid container sx={{ height: '100%' }}>
        {/* Remote Videos */}
        {remoteUsers.map((user, index) => (
          <Grid
            item
            xs={12}
            md={remoteUsers.length === 1 ? 12 : 6}
            key={user.uid}
            sx={{ position: 'relative', height: '50%' }}
          >
            <Box
              ref={el => videoRefs.current[user.uid] = el}
              id={`remote-video-${user.uid}`}
              sx={{
                width: '100%',
                height: '100%',
                '& video': {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                },
              }}
            />
            <Chip
              label={`Participant ${index + 1}`}
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
              }}
            />
          </Grid>
        ))}

        {/* Local Video - Picture in Picture */}
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
            boxShadow: 3,
          }}
        >
          <Box
            id="local-video"
            sx={{
              width: '100%',
              height: '100%',
              bgcolor: '#1a1a1a',
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
        </Box>
      </Grid>

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

        <Tooltip title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}>
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
        </Tooltip>

        <Tooltip title="End Call">
          <IconButton
            onClick={() => setEndCallDialog(true)}
            sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
          >
            <CallEndIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Chat">
          <IconButton
            onClick={() => {
              setDrawerContent('chat');
              setDrawerOpen(true);
            }}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
          >
            <Badge badgeContent={messages.filter(m => !m.isLocal).length} color="primary">
              <ChatIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Participants">
          <IconButton
            onClick={() => {
              setDrawerContent('participants');
              setDrawerOpen(true);
            }}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
          >
            <Badge badgeContent={remoteUsers.length + 1} color="primary">
              <PeopleIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Settings">
          <IconButton
            onClick={(e) => setSettingsAnchor(e.currentTarget)}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          <IconButton
            onClick={toggleFullscreen}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
          >
            {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>
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
            onClick={() => navigate(-1)}
            sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Paper sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', px: 2, py: 1 }}>
            <Typography variant="body2">
              {formatDuration(stats.duration)}
            </Typography>
          </Paper>

          <Tooltip title={`Connection Quality: ${connectionQuality}`}>
            <Chip
              icon={<SignalCellularAltIcon />}
              label={connectionQuality}
              color={getConnectionColor()}
              size="small"
              sx={{ bgcolor: 'rgba(0,0,0,0.6)' }}
            />
          </Tooltip>
        </Box>

        <Paper sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', px: 2, py: 1 }}>
          <Typography variant="body2">
            Session with {otherParticipant?.profile?.firstName} {otherParticipant?.profile?.lastName}
          </Typography>
        </Paper>
      </Box>

      {/* Chat/Participants Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 350,
            bgcolor: 'rgba(0,0,0,0.9)',
            color: 'white',
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {drawerContent === 'chat' ? 'Chat' : 'Participants'}
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }}>
              <ArrowBackIcon />
            </IconButton>
          </Box>

          {drawerContent === 'chat' ? (
            <>
              {/* Chat Messages */}
              <Box
                sx={{
                  height: 'calc(100vh - 200px)',
                  overflowY: 'auto',
                  mb: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                {messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      justifyContent: message.isLocal ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1.5,
                        maxWidth: '80%',
                        bgcolor: message.isLocal ? 'primary.main' : 'grey.800',
                        color: 'white',
                      }}
                    >
                      <Typography variant="body2">{message.text}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>

              {/* Chat Input */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'grey.700',
                      },
                    },
                  }}
                />
                <IconButton onClick={sendMessage} sx={{ color: 'primary.main' }}>
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            // Participants List
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    {user?.profile?.firstName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${user?.profile?.firstName} ${user?.profile?.lastName} (You)`}
                  secondary={isAudioEnabled ? 'Audio On' : 'Audio Off'}
                />
                <Chip
                  size="small"
                  label="Host"
                  color="primary"
                />
              </ListItem>
              <Divider sx={{ bgcolor: 'grey.800' }} />
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    {otherParticipant?.profile?.firstName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${otherParticipant?.profile?.firstName} ${otherParticipant?.profile?.lastName}`}
                />
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.9)',
            color: 'white',
            width: 300,
          },
        }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">Audio Input</Typography>
        </MenuItem>
        {devices.audioInput.map((device) => (
          <MenuItem
            key={device.deviceId}
            selected={selectedDevice.audioInput === device.deviceId}
            onClick={() => setSelectedDevice(prev => ({ ...prev, audioInput: device.deviceId }))}
          >
            {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
          </MenuItem>
        ))}
        
        <Divider sx={{ my: 1, bgcolor: 'grey.800' }} />
        
        <MenuItem disabled>
          <Typography variant="subtitle2">Video Input</Typography>
        </MenuItem>
        {devices.videoInput.map((device) => (
          <MenuItem
            key={device.deviceId}
            selected={selectedDevice.videoInput === device.deviceId}
            onClick={() => setSelectedDevice(prev => ({ ...prev, videoInput: device.deviceId }))}
          >
            {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
          </MenuItem>
        ))}
      </Menu>

      {/* End Call Confirmation Dialog */}
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

      {/* Connection Quality Warning */}
      {connectionQuality === 'poor' && (
        <Zoom in>
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{
              position: 'absolute',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
            }}
          >
            Poor connection quality. You may experience lag.
          </Alert>
        </Zoom>
      )}
    </Box>
  );
};

export default VideoCall;