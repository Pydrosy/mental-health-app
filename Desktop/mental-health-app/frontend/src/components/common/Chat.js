import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  CircularProgress,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  Alert,
  Chip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { messages as messagesApi, users } from '../../services/api';
import { format, isToday, isYesterday } from 'date-fns';

// Icons
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import VideocamIcon from '@mui/icons-material/Videocam';

const Chat = () => {
  const { userId: recipientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    socket,
    onlineUsers,
    isConnected,
    joinChat,
    sendMessage,
    onNewMessage,
    onMessageSent,
    sendTyping,
    onUserTyping,
    markAsRead,
    isUserOnline
  } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState(null);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch recipient details and messages when recipientId changes
  useEffect(() => {
    if (recipientId) {
      fetchRecipientDetails();
      fetchMessages();
    }
  }, [recipientId]);

  // Join chat room when socket is connected and recipient is selected
  useEffect(() => {
    if (isConnected && recipientId) {
      console.log('Joining chat with recipient:', recipientId);
      joinChat(recipientId);
    }
  }, [isConnected, recipientId, joinChat]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    console.log('Setting up socket listeners, connection status:', isConnected);

    const handleNewMessage = (message) => {
      console.log('New message received:', message);
      console.log('Current user ID:', user?._id || user?.id);
      console.log('Message sender ID:', message.sender?._id || message.sender);
      
      setMessages((prev) => [...prev, message]);
      
      // Update last message in conversations
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === message.sender._id || conv._id === message.recipient._id
            ? { ...conv, lastMessage: message }
            : conv
        )
      );

      // Mark as read if it's the current conversation
      if (message.sender._id === recipientId) {
        markAsRead([message._id]);
      }
    };

    const handleMessageSent = (message) => {
      console.log('Message sent confirmation:', message);
      setSending(false);
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    };

    const handleTyping = ({ userId, isTyping }) => {
      console.log('Typing event:', userId, isTyping);
      if (userId === recipientId) {
        setOtherTyping(isTyping);
      }
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      setConnectionError(true);
    };

    // Subscribe to events
    const unsubscribeNewMessage = onNewMessage(handleNewMessage);
    const unsubscribeMessageSent = onMessageSent(handleMessageSent);
    const unsubscribeTyping = onUserTyping(handleTyping);

    // Handle connection errors
    socket.on('connect_error', handleError);
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionError(true);
    });
    socket.on('connect', () => {
      console.log('Socket connected');
      setConnectionError(false);
      
      // Rejoin chat if we have a recipient
      if (recipientId) {
        joinChat(recipientId);
      }
    });

    return () => {
      unsubscribeNewMessage?.();
      unsubscribeMessageSent?.();
      unsubscribeTyping?.();
      socket.off('connect_error', handleError);
      socket.off('disconnect');
      socket.off('connect');
    };
  }, [socket, recipientId, onNewMessage, onMessageSent, onUserTyping, markAsRead, isConnected, joinChat, user]);

  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations...');
      const response = await messagesApi.getConversations();
      console.log('Conversations response:', response.data);
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchRecipientDetails = async () => {
    try {
      console.log('Fetching recipient details for ID:', recipientId);
      const response = await users.getProfile(recipientId);
      console.log('Recipient details:', response.data);
      setRecipient(response.data.user);
    } catch (error) {
      console.error('Error fetching recipient:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log('Fetching messages for recipient:', recipientId);
      const response = await messagesApi.getConversation(recipientId, { limit: 100 });
      console.log('Messages response:', response.data);
      console.log('Current user ID:', user?._id || user?.id);
      
      setMessages(response.data.messages || []);
      
      // Mark unread messages as read
      const unreadIds = response.data.messages
        .filter((m) => {
          const senderId = m.sender?._id || m.sender;
          return senderId === recipientId && !m.read;
        })
        .map((m) => m._id);
      
      if (unreadIds.length > 0) {
        console.log('Marking messages as read:', unreadIds);
        markAsRead(unreadIds);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !recipientId || sending) return;

    console.log('Sending message to:', recipientId);
    console.log('Message content:', newMessage);
    console.log('Socket connected:', isConnected);
    
    if (!isConnected) {
      setError('Cannot send message: Not connected to chat server');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setSending(true);
    sendMessage(recipientId, newMessage.trim(), 'text');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!typing && isConnected) {
      setTyping(true);
      sendTyping(recipientId, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      sendTyping(recipientId, false);
    }, 1000);
  };

  const handleMessageMenu = (event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  const handleEditMessage = () => {
    setEditContent(selectedMessage?.content || '');
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim() || !selectedMessage) return;

    try {
      await messagesApi.editMessage(selectedMessage._id, editContent);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === selectedMessage._id ? { ...m, content: editContent, edited: true } : m
        )
      );
      setEditDialogOpen(false);
      setEditContent('');
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      await messagesApi.deleteMessage(selectedMessage._id);
      setMessages((prev) => prev.filter((m) => m._id !== selectedMessage._id));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleRetryConnection = () => {
    setConnectionError(false);
    window.location.reload();
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const getReadStatus = (message) => {
    const senderId = message.sender?._id || message.sender;
    const currentUserId = user?._id || user?.id;
    
    if (senderId !== currentUserId) return null;
    if (message.read) return <DoneAllIcon fontSize="small" color="primary" />;
    if (message.delivered) return <DoneAllIcon fontSize="small" color="disabled" />;
    return <CheckIcon fontSize="small" color="disabled" />;
  };

  // Helper function to determine if message is from current user
  const isMessageFromCurrentUser = (message) => {
    if (!message || !user) return false;
    
    const senderId = message.sender?._id || message.sender;
    const currentUserId = user._id || user.id;
    
    console.log('Comparing:', {
      senderId,
      currentUserId,
      isMatch: senderId === currentUserId
    });
    
    return senderId === currentUserId;
  };

  // Helper function to get sender name
  const getSenderName = (message) => {
    if (!message.sender) return 'Unknown';
    if (message.sender.profile) {
      return `${message.sender.profile.firstName || ''} ${message.sender.profile.lastName || ''}`.trim() || 'Unknown';
    }
    return message.sender === recipientId 
      ? recipient?.profile?.firstName || 'User'
      : 'You';
  };

  // If no recipient selected, show conversations list
  if (!recipientId) {
    return (
      <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex' }}>
        {/* Conversations List */}
        <Paper
          sx={{
            width: 350,
            borderRight: '1px solid',
            borderColor: 'divider',
            overflow: 'auto',
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6">Messages</Typography>
          </Box>
          <List sx={{ p: 0 }}>
            {conversations.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">No conversations yet</Typography>
              </Box>
            ) : (
              conversations.map((conv) => (
                <ListItem
                  key={conv._id}
                  button
                  onClick={() => navigate(`/chat/${conv._id}`)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      color="success"
                      variant="dot"
                      invisible={!isUserOnline(conv._id)}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                    >
                      <Avatar>
                        {conv.user?.profile?.firstName?.[0]}
                        {conv.user?.profile?.lastName?.[0]}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">
                          {conv.user?.profile?.firstName} {conv.user?.profile?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {conv.lastMessage && formatMessageTime(conv.lastMessage.createdAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {conv.lastMessage?.content}
                        </Typography>
                        {conv.unreadCount > 0 && (
                          <Badge
                            badgeContent={conv.unreadCount}
                            color="primary"
                            sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </Paper>

        {/* Empty Chat Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            bgcolor: 'grey.50',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Select a conversation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose someone to start chatting
          </Typography>
        </Box>
      </Box>
    );
  }

  // Chat view with recipient
  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      {/* Connection Error Banner */}
      {connectionError && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetryConnection}>
              Retry Connection
            </Button>
          }
        >
          Connection issues. Messages may be delayed.
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Chat Header */}
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
        }}
      >
        <IconButton onClick={() => navigate('/chat')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Badge
          color="success"
          variant="dot"
          invisible={!isUserOnline(recipientId)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
          <Avatar sx={{ mr: 2 }}>
            {recipient?.profile?.firstName?.[0]}
            {recipient?.profile?.lastName?.[0]}
          </Avatar>
        </Badge>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              {recipient?.profile?.firstName} {recipient?.profile?.lastName}
            </Typography>
            <Chip
              size="small"
              label={isConnected ? 'Connected' : 'Disconnected'}
              color={isConnected ? 'success' : 'error'}
              sx={{ height: 20 }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {isUserOnline(recipientId) ? 'Online' : 'Offline'}
          </Typography>
        </Box>
        <Tooltip title="Video Call">
          <IconButton color="primary">
            <VideocamIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: 'grey.50',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography color="text.secondary">No messages yet</Typography>
            <Typography variant="body2" color="text.secondary">
              Send a message to start the conversation
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => {
            // CRITICAL FIX: Determine if this message is from the current user
            const isOwn = isMessageFromCurrentUser(message);
            
            return (
              <Box
                key={message._id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwn ? 'flex-end' : 'flex-start',
                  mb: 2,
                  width: '100%',
                }}
              >
                {/* Sender name (only for messages from others) */}
                {!isOwn && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 5, mb: 0.5 }}>
                    {getSenderName(message)}
                  </Typography>
                )}
                
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: isOwn ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    maxWidth: '80%',
                  }}
                >
                  {/* Avatar for messages from others */}
                  {!isOwn && (
                    <Avatar 
                      sx={{ width: 32, height: 32, mr: 1 }}
                    >
                      {recipient?.profile?.firstName?.[0] || '?'}
                    </Avatar>
                  )}
                  
                  {/* Message bubble */}
                  <Box sx={{ maxWidth: '100%' }}>
                    <Paper
                      sx={{
                        p: 1.5,
                        bgcolor: isOwn ? 'primary.main' : 'white',
                        color: isOwn ? 'white' : 'text.primary',
                        borderRadius: 2,
                        borderTopRightRadius: isOwn ? 2 : 16,
                        borderTopLeftRadius: isOwn ? 16 : 2,
                      }}
                      elevation={1}
                    >
                      <Typography variant="body1">{message.content}</Typography>
                      {message.edited && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            color: isOwn ? 'rgba(255,255,255,0.7)' : 'text.disabled',
                          }}
                        >
                          (edited)
                        </Typography>
                      )}
                    </Paper>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        alignItems: 'center',
                        mt: 0.5,
                        gap: 0.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {formatMessageTime(message.createdAt)}
                      </Typography>
                      {isOwn && (
                        <Tooltip title={message.read ? 'Read' : message.delivered ? 'Delivered' : 'Sent'}>
                          {getReadStatus(message)}
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  {/* Edit/Delete menu for own messages */}
                  {isOwn && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMessageMenu(e, message)}
                      sx={{ ml: 1, alignSelf: 'center' }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            );
          })
        )}

        {otherTyping && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
              {recipient?.profile?.firstName?.[0]}
            </Avatar>
            <Paper sx={{ p: 1, bgcolor: 'grey.100' }}>
              <Typography variant="body2" color="text.secondary">
                typing...
              </Typography>
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Paper
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleTyping}
          onKeyPress={handleKeyPress}
          disabled={sending}
          error={!isConnected}
          helperText={!isConnected ? 'Connecting to chat server...' : ''}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconButton size="small" disabled={!isConnected}>
                  <AttachFileIcon />
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending || !isConnected}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Message Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditMessage}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} color="error" /> Delete
        </MenuItem>
      </Menu>

      {/* Edit Message Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Message</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Message Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Message</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this message?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteMessage} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat;