// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   Box,
//   Paper,
//   Typography,
//   Grid,
//   Card,
//   CardContent,
//   CardActions,
//   Button,
//   Chip,
//   IconButton,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Switch,
//   FormControlLabel,
//   Alert,
//   CircularProgress,
//   Divider,
//   Tooltip,
//   Stack,
//   useMediaQuery,
//   useTheme,
//   Tabs,
//   Tab,
//   Badge,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemIcon,
//   Snackbar,
// } from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { useAuth } from '../../contexts/AuthContext';
// import { therapists as therapistsApi } from '../../services/api';
// import { useNavigate } from 'react-router-dom';
// import debounce from 'lodash/debounce';

// // Icons
// import AddIcon from '@mui/icons-material/Add';
// import EditIcon from '@mui/icons-material/Edit';
// import DeleteIcon from '@mui/icons-material/Delete';
// import AccessTimeIcon from '@mui/icons-material/AccessTime';
// import EventAvailableIcon from '@mui/icons-material/EventAvailable';
// import EventBusyIcon from '@mui/icons-material/EventBusy';
// import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import WarningIcon from '@mui/icons-material/Warning';
// import InfoIcon from '@mui/icons-material/Info';
// import SaveIcon from '@mui/icons-material/Save';
// import CancelIcon from '@mui/icons-material/Cancel';
// import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
// import TodayIcon from '@mui/icons-material/Today';
// import RefreshIcon from '@mui/icons-material/Refresh';

// // Tab Panel Component
// function TabPanel({ children, value, index, ...other }) {
//   return (
//     <div
//       role="tabpanel"
//       hidden={value !== index}
//       id={`availability-tabpanel-${index}`}
//       aria-labelledby={`availability-tab-${index}`}
//       {...other}
//     >
//       {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
//     </div>
//   );
// }

// const daysOfWeek = [
//   'Monday',
//   'Tuesday',
//   'Wednesday',
//   'Thursday',
//   'Friday',
//   'Saturday',
//   'Sunday',
// ];

// const Availability = () => {
//   const [tabValue, setTabValue] = useState(0);
//   const [availability, setAvailability] = useState([]);
//   const [exceptions, setExceptions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [selectedDay, setSelectedDay] = useState(null);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [editingSlot, setEditingSlot] = useState(null);
//   const [apiReady, setApiReady] = useState(false);
//   const [rateLimited, setRateLimited] = useState(false);
//   const [stats, setStats] = useState({
//     totalHours: 0,
//     availableDays: 0,
//     bookedSessions: 0,
//     upcomingExceptions: 0,
//   });
//   const [openSnackbar, setOpenSnackbar] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState('');
//   const [snackbarSeverity, setSnackbarSeverity] = useState('info');

//   const [slotForm, setSlotForm] = useState({
//     day: 'Monday',
//     startTime: '09:00',
//     endTime: '10:00',
//     isRecurring: true,
//     isBooked: false,
//   });

//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

//   // Refs for request tracking
//   const abortControllerRef = useRef(null);
//   const requestInProgressRef = useRef(false);

//   // Check if APIs are available
//   useEffect(() => {
//     console.log('therapistsApi:', therapistsApi);
//     console.log('therapistsApi.getAvailability available:', typeof therapistsApi?.getAvailability === 'function');
//     console.log('therapistsApi.updateAvailability available:', typeof therapistsApi?.updateAvailability === 'function');

//     if (therapistsApi?.getAvailability && therapistsApi?.updateAvailability) {
//       setApiReady(true);
//     }
//   }, []);

//   // Fetch availability from database on component mount
//   useEffect(() => {
//     if (apiReady) {
//       fetchAvailabilityFromDB();
//     }
//   }, [apiReady]);

//   const fetchAvailabilityFromDB = async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       if (!user?.id) {
//         console.log('No user ID available');
//         setLoading(false);
//         return;
//       }

//       console.log('Fetching availability for user:', user.id);
//       const response = await therapistsApi.getAvailability(user.id);
//       console.log('Fetched availability from DB:', response.data);
      
//       let availabilityData = [];
      
//       if (response.data && response.data.availability) {
//         availabilityData = response.data.availability;
//       } else if (Array.isArray(response.data)) {
//         availabilityData = response.data;
//       }
      
//       console.log('Setting availability data:', availabilityData);
//       setAvailability(availabilityData);
      
//       if (availabilityData.length === 0) {
//         setSuccess('No availability set yet. Add your first time slot!');
//         setTimeout(() => setSuccess(''), 3000);
//       }
//     } catch (error) {
//       console.error('Error fetching availability from DB:', error);
//       setError('Failed to load availability from database');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Debug availability data
//   useEffect(() => {
//     console.log('Current availability state:', availability);
//     calculateStats();
//   }, [availability]);

//   const calculateStats = () => {
//     let totalMinutes = 0;
//     availability.forEach(day => {
//       day.slots.forEach(slot => {
//         if (!slot.isBooked) {
//           const start = slot.startTime.split(':').map(Number);
//           const end = slot.endTime.split(':').map(Number);
//           const minutes = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
//           totalMinutes += minutes;
//         }
//       });
//     });

//     setStats({
//       totalHours: Math.round(totalMinutes / 60 * 10) / 10,
//       availableDays: availability.length,
//       bookedSessions: availability.reduce((acc, day) => 
//         acc + day.slots.filter(slot => slot.isBooked).length, 0),
//       upcomingExceptions: exceptions.length,
//     });
//   };

//   const showSnackbar = (message, severity = 'info') => {
//     setSnackbarMessage(message);
//     setSnackbarSeverity(severity);
//     setOpenSnackbar(true);
//   };

//   const handleTabChange = (event, newValue) => {
//     setTabValue(newValue);
//   };

//   const getDayAvailability = (day) => {
//     const dayData = availability.find(d => d.day === day);
//     return dayData || { slots: [] };
//   };

//   const getDateForDay = (day) => {
//     const date = new Date(selectedDate);
//     const dayIndex = daysOfWeek.indexOf(day);
//     // Get the current week's date for this day
//     const currentDay = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
//     // Adjust so Monday is 1, Sunday is 7
//     const adjustedCurrentDay = currentDay === 0 ? 7 : currentDay;
//     const adjustedTargetDay = dayIndex + 1;
//     const diff = adjustedTargetDay - adjustedCurrentDay;
//     date.setDate(date.getDate() + diff);
//     return date;
//   };

//   const handleAddSlot = () => {
//     setEditingSlot(null);
//     setSlotForm({
//       day: 'Monday',
//       startTime: '09:00',
//       endTime: '10:00',
//       isRecurring: true,
//       isBooked: false,
//     });
//     setOpenDialog(true);
//   };

//   const handleEditSlot = (day, slot) => {
//     setEditingSlot({ day, slot });
//     setSlotForm({
//       day: day.day,
//       startTime: slot.startTime,
//       endTime: slot.endTime,
//       isRecurring: true,
//       isBooked: slot.isBooked,
//     });
//     setOpenDialog(true);
//   };

//   const handleDeleteSlot = async (day, slotToDelete) => {
//     try {
//       const updatedAvailability = availability.map(d => {
//         if (d.day === day.day) {
//           return {
//             ...d,
//             slots: d.slots.filter(slot => 
//               slot.startTime !== slotToDelete.startTime
//             ),
//           };
//         }
//         return d;
//       }).filter(d => d.slots.length > 0);

//       setAvailability(updatedAvailability);
//       await saveAvailabilityToDB(updatedAvailability);
      
//       showSnackbar('Time slot deleted successfully', 'success');
//     } catch (error) {
//       console.error('Error deleting slot:', error);
//       showSnackbar('Failed to delete time slot', 'error');
//     }
//   };

//   const handleSaveSlot = async () => {
//     try {
//       if (slotForm.startTime >= slotForm.endTime) {
//         showSnackbar('End time must be after start time', 'error');
//         return;
//       }

//       let updatedAvailability = [...availability];
//       const dayIndex = updatedAvailability.findIndex(d => d.day === slotForm.day);

//       if (editingSlot) {
//         // Edit existing slot
//         if (dayIndex >= 0) {
//           const slotIndex = updatedAvailability[dayIndex].slots.findIndex(
//             s => s.startTime === editingSlot.slot.startTime
//           );
//           if (slotIndex >= 0) {
//             updatedAvailability[dayIndex].slots[slotIndex] = {
//               startTime: slotForm.startTime,
//               endTime: slotForm.endTime,
//               isBooked: slotForm.isBooked,
//             };
//           }
//         }
//       } else {
//         // Add new slot
//         if (dayIndex >= 0) {
//           // Add to existing day
//           updatedAvailability[dayIndex].slots.push({
//             startTime: slotForm.startTime,
//             endTime: slotForm.endTime,
//             isBooked: false,
//           });
//           // Sort slots by time
//           updatedAvailability[dayIndex].slots.sort((a, b) => 
//             a.startTime.localeCompare(b.startTime)
//           );
//         } else {
//           // Create new day
//           updatedAvailability.push({
//             day: slotForm.day,
//             slots: [{
//               startTime: slotForm.startTime,
//               endTime: slotForm.endTime,
//               isBooked: false,
//             }],
//           });
//           // Sort days
//           updatedAvailability.sort((a, b) => 
//             daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day)
//           );
//         }
//       }

//       console.log('Saving availability to DB:', updatedAvailability);
//       await saveAvailabilityToDB(updatedAvailability);
      
//       setAvailability(updatedAvailability);
//       setOpenDialog(false);
//       showSnackbar(
//         editingSlot ? 'Time slot updated successfully' : 'Time slot added successfully',
//         'success'
//       );
//     } catch (error) {
//       console.error('Error saving slot:', error);
//       showSnackbar('Failed to save time slot', 'error');
//     }
//   };

//   const saveAvailabilityToDB = async (updatedAvailability) => {
//     try {
//       setSaving(true);
      
//       if (!therapistsApi?.updateAvailability) {
//         throw new Error('Update availability API not available');
//       }

//       // Save to database
//       const response = await therapistsApi.updateAvailability(updatedAvailability);
//       console.log('Save response:', response.data);
      
//       showSnackbar('Changes saved to database', 'success');
      
//     } catch (error) {
//       console.error('Error saving availability to DB:', error);
//       throw error;
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleRetry = () => {
//     setRateLimited(false);
//     setError('');
//     fetchAvailabilityFromDB();
//   };

//   const formatTime = (time) => {
//     return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
//       hour: '2-digit', 
//       minute: '2-digit' 
//     });
//   };

//   const handlePrevWeek = () => {
//     const newDate = new Date(selectedDate);
//     newDate.setDate(newDate.getDate() - 7);
//     setSelectedDate(newDate);
//   };

//   const handleNextWeek = () => {
//     const newDate = new Date(selectedDate);
//     newDate.setDate(newDate.getDate() + 7);
//     setSelectedDate(newDate);
//   };

//   const handleToday = () => {
//     setSelectedDate(new Date());
//   };

//   const handleRefresh = () => {
//     fetchAvailabilityFromDB();
//   };

//   if (loading) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   return (
//     <Box>
//       {/* Header */}
//       <Paper sx={{ p: 3, mb: 3 }}>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//           <Typography variant="h4">Manage Availability</Typography>
//           <Box sx={{ display: 'flex', gap: 1 }}>
//             <Button
//               variant="outlined"
//               startIcon={<RefreshIcon />}
//               onClick={handleRefresh}
//             >
//               Refresh
//             </Button>
//             <Button
//               variant="contained"
//               startIcon={<AddIcon />}
//               onClick={handleAddSlot}
//             >
//               Add Time Slot
//             </Button>
//           </Box>
//         </Box>

//         {/* Stats Cards */}
//         <Grid container spacing={2} sx={{ mt: 1 }}>
//           <Grid item xs={6} sm={3}>
//             <Card variant="outlined">
//               <CardContent>
//                 <Typography color="text.secondary" gutterBottom>
//                   Weekly Hours
//                 </Typography>
//                 <Typography variant="h4">{stats.totalHours}</Typography>
//               </CardContent>
//             </Card>
//           </Grid>
//           <Grid item xs={6} sm={3}>
//             <Card variant="outlined">
//               <CardContent>
//                 <Typography color="text.secondary" gutterBottom>
//                   Available Days
//                 </Typography>
//                 <Typography variant="h4">{stats.availableDays}</Typography>
//               </CardContent>
//             </Card>
//           </Grid>
//           <Grid item xs={6} sm={3}>
//             <Card variant="outlined">
//               <CardContent>
//                 <Typography color="text.secondary" gutterBottom>
//                   Booked Slots
//                 </Typography>
//                 <Typography variant="h4" color="warning.main">
//                   {stats.bookedSessions}
//                 </Typography>
//               </CardContent>
//             </Card>
//           </Grid>
//           <Grid item xs={6} sm={3}>
//             <Card variant="outlined">
//               <CardContent>
//                 <Typography color="text.secondary" gutterBottom>
//                   Exceptions
//                 </Typography>
//                 <Typography variant="h4">{stats.upcomingExceptions}</Typography>
//               </CardContent>
//             </Card>
//           </Grid>
//         </Grid>

//         {/* Status Messages */}
//         {error && (
//           <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
//             {error}
//           </Alert>
//         )}
//         {success && (
//           <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
//             {success}
//           </Alert>
//         )}
//         {saving && (
//           <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
//             <CircularProgress size={20} sx={{ mr: 1 }} />
//             <Typography variant="body2" color="text.secondary">
//               Saving to database...
//             </Typography>
//           </Box>
//         )}
//       </Paper>

//       {/* Tabs */}
//       <Paper sx={{ width: '100%' }}>
//         <Tabs
//           value={tabValue}
//           onChange={handleTabChange}
//           variant={isMobile ? 'scrollable' : 'fullWidth'}
//           scrollButtons={isMobile ? 'auto' : false}
//           sx={{ borderBottom: 1, borderColor: 'divider' }}
//         >
//           <Tab icon={<CalendarTodayIcon />} label="Weekly Schedule" />
//           <Tab icon={<EventAvailableIcon />} label="Exceptions" />
//           <Tab icon={<InfoIcon />} label="Overview" />
//         </Tabs>

//         {/* Weekly Schedule Tab */}
//         <TabPanel value={tabValue} index={0}>
//           {/* Week Navigation */}
//           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//             <Button startIcon={<ArrowBackIcon />} onClick={handlePrevWeek}>
//               Previous Week
//             </Button>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//               <Typography variant="h6">
//                 Week of {selectedDate.toLocaleDateString()}
//               </Typography>
//               <Button variant="outlined" startIcon={<TodayIcon />} onClick={handleToday}>
//                 Today
//               </Button>
//             </Box>
//             <Button endIcon={<ArrowForwardIcon />} onClick={handleNextWeek}>
//               Next Week
//             </Button>
//           </Box>

//           {/* Weekly Schedule Grid */}
//           {availability.length === 0 ? (
//             <Paper sx={{ p: 4, textAlign: 'center' }}>
//               <Typography variant="h6" color="text.secondary" gutterBottom>
//                 No availability set
//               </Typography>
//               <Typography variant="body2" color="text.secondary" paragraph>
//                 Click the "Add Time Slot" button to set your available hours.
//               </Typography>
//               <Button
//                 variant="contained"
//                 startIcon={<AddIcon />}
//                 onClick={handleAddSlot}
//               >
//                 Add Your First Time Slot
//               </Button>
//             </Paper>
//           ) : (
//             <Grid container spacing={2}>
//               {daysOfWeek.map((day) => {
//                 const dayAvailability = getDayAvailability(day);
//                 const date = getDateForDay(day);
                
//                 return (
//                   <Grid item xs={12} md={6} lg={4} key={day}>
//                     <Card>
//                       <CardContent>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                           <Typography variant="h6">
//                             {day}
//                           </Typography>
//                           <Chip
//                             size="small"
//                             label={date.toLocaleDateString()}
//                             variant="outlined"
//                           />
//                         </Box>

//                         {dayAvailability.slots.length === 0 ? (
//                           <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
//                             No slots available
//                           </Typography>
//                         ) : (
//                           <List dense>
//                             {dayAvailability.slots.map((slot, index) => (
//                               <ListItem
//                                 key={index}
//                                 secondaryAction={
//                                   <Box>
//                                     <IconButton
//                                       edge="end"
//                                       size="small"
//                                       onClick={() => handleEditSlot(dayAvailability, slot)}
//                                       sx={{ mr: 1 }}
//                                     >
//                                       <EditIcon fontSize="small" />
//                                     </IconButton>
//                                     <IconButton
//                                       edge="end"
//                                       size="small"
//                                       color="error"
//                                       onClick={() => handleDeleteSlot(dayAvailability, slot)}
//                                     >
//                                       <DeleteIcon fontSize="small" />
//                                     </IconButton>
//                                   </Box>
//                                 }
//                               >
//                                 <ListItemIcon>
//                                   <AccessTimeIcon fontSize="small" color={slot.isBooked ? 'disabled' : 'primary'} />
//                                 </ListItemIcon>
//                                 <ListItemText
//                                   primary={`${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`}
//                                   secondary={slot.isBooked ? 'Booked' : 'Available'}
//                                   primaryTypographyProps={{
//                                     color: slot.isBooked ? 'text.disabled' : 'text.primary',
//                                   }}
//                                 />
//                                 {slot.isBooked && (
//                                   <Chip
//                                     size="small"
//                                     label="Booked"
//                                     color="warning"
//                                     sx={{ ml: 1 }}
//                                   />
//                                 )}
//                               </ListItem>
//                             ))}
//                           </List>
//                         )}

//                         <Button
//                           fullWidth
//                           variant="outlined"
//                           startIcon={<AddIcon />}
//                           onClick={() => {
//                             setSelectedDay(day);
//                             handleAddSlot();
//                           }}
//                           sx={{ mt: 1 }}
//                         >
//                           Add Slot
//                         </Button>
//                       </CardContent>
//                     </Card>
//                   </Grid>
//                 );
//               })}
//             </Grid>
//           )}
//         </TabPanel>

//         {/* Exceptions Tab */}
//         <TabPanel value={tabValue} index={1}>
//           <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
//             <Typography variant="h6">Schedule Exceptions</Typography>
//             <Button
//               variant="contained"
//               startIcon={<AddIcon />}
//               onClick={() => {}}
//             >
//               Add Exception
//             </Button>
//           </Box>

//           {exceptions.length === 0 ? (
//             <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
//               No exceptions scheduled
//             </Typography>
//           ) : (
//             <Grid container spacing={2}>
//               {exceptions.map((exception) => (
//                 <Grid item xs={12} md={6} key={exception.id}>
//                   <Card>
//                     <CardContent>
//                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
//                         <Box>
//                           <Typography variant="subtitle1">
//                             {exception.type === 'unavailable' ? 'Unavailable' : 'Extra Hours'}
//                           </Typography>
//                           <Typography variant="body2" color="text.secondary">
//                             {exception.date.toLocaleDateString()} • {exception.startTime} - {exception.endTime}
//                           </Typography>
//                           {exception.reason && (
//                             <Typography variant="body2" sx={{ mt: 1 }}>
//                               Reason: {exception.reason}
//                             </Typography>
//                           )}
//                         </Box>
//                         <Chip
//                           size="small"
//                           label={exception.type === 'unavailable' ? 'Unavailable' : 'Extra'}
//                           color={exception.type === 'unavailable' ? 'error' : 'success'}
//                         />
//                       </Box>
//                     </CardContent>
//                   </Card>
//                 </Grid>
//               ))}
//             </Grid>
//           )}
//         </TabPanel>

//         {/* Overview Tab */}
//         <TabPanel value={tabValue} index={2}>
//           <Typography variant="h6" gutterBottom>
//             Availability Overview
//           </Typography>
          
//           <Grid container spacing={3}>
//             <Grid item xs={12} md={6}>
//               <Card>
//                 <CardContent>
//                   <Typography variant="subtitle1" gutterBottom>
//                     Weekly Summary
//                   </Typography>
//                   <List>
//                     {daysOfWeek.map((day) => {
//                       const dayAvailability = getDayAvailability(day);
//                       const totalSlots = dayAvailability.slots.length;
//                       const bookedSlots = dayAvailability.slots.filter(s => s.isBooked).length;
                      
//                       return (
//                         <ListItem key={day}>
//                           <ListItemText
//                             primary={day}
//                             secondary={`${totalSlots} slots, ${bookedSlots} booked`}
//                           />
//                           <Chip
//                             size="small"
//                             label={totalSlots > 0 ? 'Available' : 'Not Available'}
//                             color={totalSlots > 0 ? 'success' : 'default'}
//                           />
//                         </ListItem>
//                       );
//                     })}
//                   </List>
//                 </CardContent>
//               </Card>
//             </Grid>

//             <Grid item xs={12} md={6}>
//               <Card>
//                 <CardContent>
//                   <Typography variant="subtitle1" gutterBottom>
//                     Tips for Managing Availability
//                   </Typography>
//                   <List>
//                     <ListItem>
//                       <ListItemIcon>
//                         <CheckCircleIcon color="success" />
//                       </ListItemIcon>
//                       <ListItemText primary="Set regular weekly hours for recurring availability" />
//                     </ListItem>
//                     <ListItem>
//                       <ListItemIcon>
//                         <CheckCircleIcon color="success" />
//                       </ListItemIcon>
//                       <ListItemText primary="Use exceptions for holidays or time off" />
//                     </ListItem>
//                     <ListItem>
//                       <ListItemIcon>
//                         <CheckCircleIcon color="success" />
//                       </ListItemIcon>
//                       <ListItemText primary="Add extra hours during high-demand periods" />
//                     </ListItem>
//                     <ListItem>
//                       <ListItemIcon>
//                         <WarningIcon color="warning" />
//                       </ListItemIcon>
//                       <ListItemText primary="Booked slots cannot be modified" />
//                     </ListItem>
//                   </List>
//                 </CardContent>
//               </Card>
//             </Grid>
//           </Grid>
//         </TabPanel>
//       </Paper>

//       {/* Add/Edit Slot Dialog */}
//       <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
//         <DialogTitle>
//           {editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
//         </DialogTitle>
//         <DialogContent>
//           <Box sx={{ mt: 2 }}>
//             <FormControl fullWidth sx={{ mb: 2 }}>
//               <InputLabel>Day</InputLabel>
//               <Select
//                 value={slotForm.day}
//                 onChange={(e) => setSlotForm({ ...slotForm, day: e.target.value })}
//                 label="Day"
//               >
//                 {daysOfWeek.map((day) => (
//                   <MenuItem key={day} value={day}>{day}</MenuItem>
//                 ))}
//               </Select>
//             </FormControl>

//             <Grid container spacing={2} sx={{ mb: 2 }}>
//               <Grid item xs={6}>
//                 <TextField
//                   fullWidth
//                   label="Start Time"
//                   type="time"
//                   value={slotForm.startTime}
//                   onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
//                   InputLabelProps={{ shrink: true }}
//                 />
//               </Grid>
//               <Grid item xs={6}>
//                 <TextField
//                   fullWidth
//                   label="End Time"
//                   type="time"
//                   value={slotForm.endTime}
//                   onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
//                   InputLabelProps={{ shrink: true }}
//                 />
//               </Grid>
//             </Grid>

//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={slotForm.isRecurring}
//                   onChange={(e) => setSlotForm({ ...slotForm, isRecurring: e.target.checked })}
//                 />
//               }
//               label="Recurring weekly"
//             />

//             {editingSlot && (
//               <FormControlLabel
//                 control={
//                   <Switch
//                     checked={slotForm.isBooked}
//                     onChange={(e) => setSlotForm({ ...slotForm, isBooked: e.target.checked })}
//                     disabled
//                   />
//                 }
//                 label="Currently Booked"
//                 sx={{ ml: 2 }}
//               />
//             )}
//           </Box>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
//           <Button onClick={handleSaveSlot} variant="contained" disabled={saving}>
//             {saving ? <CircularProgress size={24} /> : 'Save'}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Snackbar for notifications */}
//       <Snackbar
//         open={openSnackbar}
//         autoHideDuration={6000}
//         onClose={() => setOpenSnackbar(false)}
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
//       >
//         <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity}>
//           {snackbarMessage}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// };

// export default Availability;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  Stack,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';
import { therapists as therapistsApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TodayIcon from '@mui/icons-material/Today';
import RefreshIcon from '@mui/icons-material/Refresh';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`availability-tabpanel-${index}`}
      aria-labelledby={`availability-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const Availability = () => {
  const [tabValue, setTabValue] = useState(0);
  const [availability, setAvailability] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [apiReady, setApiReady] = useState(false);
  const [stats, setStats] = useState({
    totalHours: 0,
    availableDays: 0,
    bookedSessions: 0,
    upcomingExceptions: 0,
  });
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  const [slotForm, setSlotForm] = useState({
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    isRecurring: true,
    isBooked: false,
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Check if APIs are available
  useEffect(() => {
    console.log('therapistsApi:', therapistsApi);
    console.log('therapistsApi.getAvailability available:', typeof therapistsApi?.getAvailability === 'function');
    console.log('therapistsApi.updateAvailability available:', typeof therapistsApi?.updateAvailability === 'function');

    if (therapistsApi?.getAvailability && therapistsApi?.updateAvailability) {
      setApiReady(true);
    }
  }, []);

  // Check authentication and role
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'therapist') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // Fetch availability from database on component mount
  useEffect(() => {
    if (apiReady && user) {
      fetchAvailabilityFromDB();
    }
  }, [apiReady, user]);

  // Debug availability data
  useEffect(() => {
    console.log('Current availability state:', availability);
    calculateStats();
  }, [availability]);

  const fetchAvailabilityFromDB = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user?.id) {
        console.log('No user ID available');
        setLoading(false);
        return;
      }

      console.log('Fetching availability for user:', user.id);
      const response = await therapistsApi.getAvailability(user.id);
      console.log('Fetched availability from DB:', response.data);
      
      let availabilityData = [];
      
      if (response.data && response.data.availability) {
        availabilityData = response.data.availability;
      } else if (Array.isArray(response.data)) {
        availabilityData = response.data;
      }
      
      console.log('Setting availability data:', availabilityData);
      setAvailability(availabilityData);
      
      if (availabilityData.length === 0) {
        setSuccess('No availability set yet. Add your first time slot!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error fetching availability from DB:', error);
      setError('Failed to load availability from database');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    let totalMinutes = 0;
    availability.forEach(day => {
      day.slots.forEach(slot => {
        if (!slot.isBooked) {
          const start = slot.startTime.split(':').map(Number);
          const end = slot.endTime.split(':').map(Number);
          const minutes = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
          totalMinutes += minutes;
        }
      });
    });

    setStats({
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      availableDays: availability.length,
      bookedSessions: availability.reduce((acc, day) => 
        acc + day.slots.filter(slot => slot.isBooked).length, 0),
      upcomingExceptions: exceptions.length,
    });
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getDayAvailability = (day) => {
    const dayData = availability.find(d => d.day === day);
    return dayData || { slots: [] };
  };

  const getDateForDay = (day) => {
    const date = new Date(selectedDate);
    const dayIndex = daysOfWeek.indexOf(day);
    const currentDay = date.getDay();
    const adjustedCurrentDay = currentDay === 0 ? 7 : currentDay;
    const adjustedTargetDay = dayIndex + 1;
    const diff = adjustedTargetDay - adjustedCurrentDay;
    date.setDate(date.getDate() + diff);
    return date;
  };

  const handleAddSlot = () => {
    setEditingSlot(null);
    setSlotForm({
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      isRecurring: true,
      isBooked: false,
    });
    setOpenDialog(true);
  };

  const handleEditSlot = (day, slot) => {
    setEditingSlot({ day, slot });
    setSlotForm({
      day: day.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isRecurring: true,
      isBooked: slot.isBooked,
    });
    setOpenDialog(true);
  };

  const handleDeleteSlot = async (day, slotToDelete) => {
    try {
      const updatedAvailability = availability.map(d => {
        if (d.day === day.day) {
          return {
            ...d,
            slots: d.slots.filter(slot => 
              slot.startTime !== slotToDelete.startTime
            ),
          };
        }
        return d;
      }).filter(d => d.slots.length > 0);

      setAvailability(updatedAvailability);
      await saveAvailabilityToDB(updatedAvailability);
      
      showSnackbar('Time slot deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting slot:', error);
      showSnackbar('Failed to delete time slot', 'error');
    }
  };

  const handleSaveSlot = async () => {
    try {
      if (slotForm.startTime >= slotForm.endTime) {
        showSnackbar('End time must be after start time', 'error');
        return;
      }

      let updatedAvailability = [...availability];
      const dayIndex = updatedAvailability.findIndex(d => d.day === slotForm.day);

      if (editingSlot) {
        if (dayIndex >= 0) {
          const slotIndex = updatedAvailability[dayIndex].slots.findIndex(
            s => s.startTime === editingSlot.slot.startTime
          );
          if (slotIndex >= 0) {
            updatedAvailability[dayIndex].slots[slotIndex] = {
              startTime: slotForm.startTime,
              endTime: slotForm.endTime,
              isBooked: slotForm.isBooked,
            };
          }
        }
      } else {
        if (dayIndex >= 0) {
          updatedAvailability[dayIndex].slots.push({
            startTime: slotForm.startTime,
            endTime: slotForm.endTime,
            isBooked: false,
          });
          updatedAvailability[dayIndex].slots.sort((a, b) => 
            a.startTime.localeCompare(b.startTime)
          );
        } else {
          updatedAvailability.push({
            day: slotForm.day,
            slots: [{
              startTime: slotForm.startTime,
              endTime: slotForm.endTime,
              isBooked: false,
            }],
          });
          updatedAvailability.sort((a, b) => 
            daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day)
          );
        }
      }

      console.log('Saving availability to DB:', updatedAvailability);
      await saveAvailabilityToDB(updatedAvailability);
      
      setAvailability(updatedAvailability);
      setOpenDialog(false);
      showSnackbar(
        editingSlot ? 'Time slot updated successfully' : 'Time slot added successfully',
        'success'
      );
    } catch (error) {
      console.error('Error saving slot:', error);
      showSnackbar('Failed to save time slot', 'error');
    }
  };

  const saveAvailabilityToDB = async (updatedAvailability) => {
    try {
      setSaving(true);
      setError('');
      
      if (!therapistsApi?.updateAvailability) {
        throw new Error('Update availability API not available');
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Saving availability to DB:', updatedAvailability);
      console.log('User:', user);
      
      const response = await therapistsApi.updateAvailability(updatedAvailability);
      console.log('Save response:', response.data);
      
      showSnackbar('Availability saved to database successfully', 'success');
      
    } catch (error) {
      console.error('Error saving availability to DB:', error);
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        showSnackbar(`Server error: ${error.response.data.message || 'Unknown error'}`, 'error');
      } else if (error.request) {
        console.error('No response received:', error.request);
        showSnackbar('Network error - no response from server', 'error');
      } else {
        showSnackbar(error.message || 'Failed to save to database', 'error');
      }
      
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    fetchAvailabilityFromDB();
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  if (loading) {
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Manage Availability</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddSlot}
            >
              Add Time Slot
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Weekly Hours
                </Typography>
                <Typography variant="h4">{stats.totalHours}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Available Days
                </Typography>
                <Typography variant="h4">{stats.availableDays}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Booked Slots
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.bookedSessions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Exceptions
                </Typography>
                <Typography variant="h4">{stats.upcomingExceptions}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Status Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        {saving && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Saving to database...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<CalendarTodayIcon />} label="Weekly Schedule" />
          <Tab icon={<EventAvailableIcon />} label="Exceptions" />
          <Tab icon={<InfoIcon />} label="Overview" />
        </Tabs>

        {/* Weekly Schedule Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* Week Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={handlePrevWeek}>
              Previous Week
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">
                Week of {selectedDate.toLocaleDateString()}
              </Typography>
              <Button variant="outlined" startIcon={<TodayIcon />} onClick={handleToday}>
                Today
              </Button>
            </Box>
            <Button endIcon={<ArrowForwardIcon />} onClick={handleNextWeek}>
              Next Week
            </Button>
          </Box>

          {/* Weekly Schedule Grid */}
          {availability.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No availability set
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Click the "Add Time Slot" button to set your available hours.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddSlot}
              >
                Add Your First Time Slot
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {daysOfWeek.map((day) => {
                const dayAvailability = getDayAvailability(day);
                const date = getDateForDay(day);
                
                return (
                  <Grid item xs={12} md={6} lg={4} key={day}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">
                            {day}
                          </Typography>
                          <Chip
                            size="small"
                            label={date.toLocaleDateString()}
                            variant="outlined"
                          />
                        </Box>

                        {dayAvailability.slots.length === 0 ? (
                          <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                            No slots available
                          </Typography>
                        ) : (
                          <List dense>
                            {dayAvailability.slots.map((slot, index) => (
                              <ListItem
                                key={index}
                                secondaryAction={
                                  <Box>
                                    <IconButton
                                      edge="end"
                                      size="small"
                                      onClick={() => handleEditSlot(dayAvailability, slot)}
                                      sx={{ mr: 1 }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      edge="end"
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteSlot(dayAvailability, slot)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                }
                              >
                                <ListItemIcon>
                                  <AccessTimeIcon fontSize="small" color={slot.isBooked ? 'disabled' : 'primary'} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={`${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`}
                                  secondary={slot.isBooked ? 'Booked' : 'Available'}
                                  primaryTypographyProps={{
                                    color: slot.isBooked ? 'text.disabled' : 'text.primary',
                                  }}
                                />
                                {slot.isBooked && (
                                  <Chip
                                    size="small"
                                    label="Booked"
                                    color="warning"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </ListItem>
                            ))}
                          </List>
                        )}

                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setSelectedDay(day);
                            handleAddSlot();
                          }}
                          sx={{ mt: 1 }}
                        >
                          Add Slot
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </TabPanel>

        {/* Exceptions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Schedule Exceptions</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {}}
            >
              Add Exception
            </Button>
          </Box>

          {exceptions.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No exceptions scheduled
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {exceptions.map((exception) => (
                <Grid item xs={12} md={6} key={exception.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box>
                          <Typography variant="subtitle1">
                            {exception.type === 'unavailable' ? 'Unavailable' : 'Extra Hours'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {exception.date.toLocaleDateString()} • {exception.startTime} - {exception.endTime}
                          </Typography>
                          {exception.reason && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Reason: {exception.reason}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          size="small"
                          label={exception.type === 'unavailable' ? 'Unavailable' : 'Extra'}
                          color={exception.type === 'unavailable' ? 'error' : 'success'}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Availability Overview
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Weekly Summary
                  </Typography>
                  <List>
                    {daysOfWeek.map((day) => {
                      const dayAvailability = getDayAvailability(day);
                      const totalSlots = dayAvailability.slots.length;
                      const bookedSlots = dayAvailability.slots.filter(s => s.isBooked).length;
                      
                      return (
                        <ListItem key={day}>
                          <ListItemText
                            primary={day}
                            secondary={`${totalSlots} slots, ${bookedSlots} booked`}
                          />
                          <Chip
                            size="small"
                            label={totalSlots > 0 ? 'Available' : 'Not Available'}
                            color={totalSlots > 0 ? 'success' : 'default'}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Tips for Managing Availability
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Set regular weekly hours for recurring availability" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Use exceptions for holidays or time off" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Add extra hours during high-demand periods" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary="Booked slots cannot be modified" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Add/Edit Slot Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Day</InputLabel>
              <Select
                value={slotForm.day}
                onChange={(e) => setSlotForm({ ...slotForm, day: e.target.value })}
                label="Day"
              >
                {daysOfWeek.map((day) => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="time"
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="time"
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={slotForm.isRecurring}
                  onChange={(e) => setSlotForm({ ...slotForm, isRecurring: e.target.checked })}
                />
              }
              label="Recurring weekly"
            />

            {editingSlot && (
              <FormControlLabel
                control={
                  <Switch
                    checked={slotForm.isBooked}
                    onChange={(e) => setSlotForm({ ...slotForm, isBooked: e.target.checked })}
                    disabled
                  />
                }
                label="Currently Booked"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveSlot} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Availability;