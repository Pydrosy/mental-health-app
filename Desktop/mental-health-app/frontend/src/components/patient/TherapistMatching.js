import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Button,
  Chip,
  Rating,
  TextField,
  InputAdornment,
  IconButton,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Badge,
  Alert,
  CircularProgress,
  Skeleton,
  Pagination,
  Drawer,
  useMediaQuery,
  useTheme,
  Fab,
  Zoom,
  Tooltip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  FormGroup,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { therapists as therapistsApi, matching as matchingApi } from '../../services/api';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LanguageIcon from '@mui/icons-material/Language';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import VerifiedIcon from '@mui/icons-material/Verified';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import InfoIcon from '@mui/icons-material/Info';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

// Constants
const specializations = [
  'cognitive-behavioral', 'psychodynamic', 'humanistic', 'mindfulness',
  'trauma-focused', 'emdr', 'dialectical-behavioral', 'acceptance-commitment',
  'family-therapy', 'group-therapy', 'couples-counseling', 'child-psychology',
  'adolescent-psychology', 'addiction-counseling', 'eating-disorders',
  'anxiety', 'depression', 'ptsd', 'ocd', 'bipolar',
];

const languages = [
  'English', 'Spanish', 'Mandarin', 'French', 'German', 'Arabic',
  'Hindi', 'Portuguese', 'Russian', 'Japanese',
];

const insuranceProviders = [
  'Aetna', 'Blue Cross', 'Cigna', 'UnitedHealth', 'Medicare', 'Medicaid', 'Kaiser', 'Optum',
];

const sortOptions = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'rating_asc', label: 'Lowest Rated' },
  { value: 'experience_desc', label: 'Most Experienced' },
  { value: 'experience_asc', label: 'Least Experienced' },
  { value: 'rate_asc', label: 'Price: Low to High' },
  { value: 'rate_desc', label: 'Price: High to Low' },
];

const TherapistMatching = () => {
  const [therapists, setTherapists] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    specializations: [],
    languages: [],
    insurance: [],
    minRating: 0,
    maxRate: 500,
    experience: [0, 30],
    acceptsInsurance: false,
    availableToday: false,
    virtualOnly: true,
  });
  const [sortBy, setSortBy] = useState('recommended');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [recommendationSource, setRecommendationSource] = useState('gnn');
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [comparing, setComparing] = useState([]);
  const [matchScores, setMatchScores] = useState({});
  const [apiReady, setApiReady] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Check if APIs are available
  useEffect(() => {
    console.log('therapistsApi:', therapistsApi);
    console.log('therapistsApi.getAll available:', typeof therapistsApi?.getAll === 'function');
    
    if (therapistsApi?.getAll) {
      setApiReady(true);
    } else {
      setError('API services not properly configured. Please check your connection.');
    }
  }, []);

  useEffect(() => {
    if (apiReady) {
      fetchTherapists();
      if (user) {
        loadFavorites();
        // Only fetch recommendations for patients
        if (user.role === 'patient') {
          fetchRecommendations();
        }
      }
    }
  }, [apiReady, page, filters, sortBy, searchTerm, user]);

  const fetchTherapists = async () => {
    setLoading(true);
    setError('');
    try {
      if (!therapistsApi?.getAll) {
        throw new Error('Therapists API not available');
      }

      const params = {
        page,
        limit: 12,
        search: searchTerm || undefined,
        specializations: filters.specializations.join(','),
        languages: filters.languages.join(','),
        insurance: filters.insurance.join(','),
        minRating: filters.minRating || undefined,
        maxRate: filters.maxRate || undefined,
        minExperience: filters.experience[0],
        maxExperience: filters.experience[1],
        acceptsInsurance: filters.acceptsInsurance || undefined,
        availableToday: filters.availableToday || undefined,
        sortBy,
      };

      const response = await therapistsApi.getAll(params);
      
      if (response.data && response.data.therapists) {
        setTherapists(response.data.therapists);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        setTherapists([]);
      }
    } catch (error) {
      console.error('Error fetching therapists:', error);
      setError(error.message || 'Failed to load therapists');
      setTherapists([]);
      
      // Set mock data for development
      setMockTherapists();
    } finally {
      setLoading(false);
    }
  };

  const setMockTherapists = () => {
    const mockData = [
      {
        _id: '1',
        profile: { firstName: 'Sarah', lastName: 'Johnson', bio: 'Licensed therapist specializing in CBT' },
        therapistDetails: {
          specializations: ['cognitive-behavioral', 'anxiety', 'depression'],
          yearsExperience: 12,
          languages: ['English', 'Spanish'],
          sessionRate: 150,
          averageRating: 4.8,
          totalReviews: 45,
          acceptsInsurance: true,
          isVerified: true,
        }
      },
      {
        _id: '2',
        profile: { firstName: 'Michael', lastName: 'Chen', bio: 'Trauma specialist with EMDR certification' },
        therapistDetails: {
          specializations: ['trauma-focused', 'emdr', 'ptsd'],
          yearsExperience: 8,
          languages: ['English', 'Mandarin'],
          sessionRate: 175,
          averageRating: 4.9,
          totalReviews: 32,
          acceptsInsurance: true,
          isVerified: true,
        }
      },
      {
        _id: '3',
        profile: { firstName: 'Emily', lastName: 'Rodriguez', bio: 'Mindfulness-based therapist' },
        therapistDetails: {
          specializations: ['mindfulness', 'stress', 'anxiety'],
          yearsExperience: 5,
          languages: ['English', 'Spanish'],
          sessionRate: 120,
          averageRating: 4.7,
          totalReviews: 28,
          acceptsInsurance: false,
          isVerified: false,
        }
      },
    ];
    setTherapists(mockData);
    setTotalPages(1);
  };

  const fetchRecommendations = async () => {
    try {
      if (!matchingApi?.getRecommendations) {
        console.warn('Matching API not available');
        return;
      }

      // Only fetch recommendations for patients
      if (user?.role !== 'patient') {
        console.log('Skipping recommendations for non-patient user');
        return;
      }

      const response = await matchingApi.getRecommendations({ limit: 20 });
      
      if (response.data && response.data.recommendations) {
        setRecommendations(response.data.recommendations);
        setRecommendationSource(response.data.source || 'gnn');
        
        const scores = {};
        response.data.recommendations.forEach(rec => {
          if (rec.therapist && rec.therapist.id) {
            scores[rec.therapist.id] = rec.match_score;
          }
        });
        setMatchScores(scores);
      }
    } catch (error) {
      // Handle 403 specifically
      if (error.response?.status === 403) {
        console.log('Recommendations not available for this user role');
        // Don't show error for non-patients
      } else {
        console.error('Error fetching recommendations:', error);
      }
    }
  };

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('favoriteTherapists');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = (therapistId) => {
    const newFavorites = favorites.includes(therapistId)
      ? favorites.filter(id => id !== therapistId)
      : [...favorites, therapistId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favoriteTherapists', JSON.stringify(newFavorites));
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      specializations: [],
      languages: [],
      insurance: [],
      minRating: 0,
      maxRate: 500,
      experience: [0, 30],
      acceptsInsurance: false,
      availableToday: false,
      virtualOnly: true,
    });
    setSearchTerm('');
    setSortBy('recommended');
    setPage(1);
  };

  const handleCompare = (therapistId) => {
    if (comparing.includes(therapistId)) {
      setComparing(comparing.filter(id => id !== therapistId));
    } else if (comparing.length < 3) {
      setComparing([...comparing, therapistId]);
    }
  };

  const getMatchScore = (therapistId) => {
    return matchScores[therapistId] || null;
  };

  const renderSkeleton = () => (
    <Grid container spacing={3}>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <Grid item xs={12} sm={6} md={4} key={n}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          <Skeleton variant="text" sx={{ mt: 1 }} />
          <Skeleton variant="text" width="60%" />
        </Grid>
      ))}
    </Grid>
  );

  const renderTherapistCard = (therapist, score = null) => {
    if (!therapist || !therapist._id) return null;
    
    const isFavorite = favorites.includes(therapist._id);
    const matchScore = score || getMatchScore(therapist._id);

    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
            cursor: 'pointer',
          },
        }}
        onClick={() => {
          setSelectedTherapist(therapist);
          setDetailsDialog(true);
        }}
      >
        {matchScore && (
          <Badge
            badgeContent={`${matchScore}% Match`}
            color="primary"
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
              '& .MuiBadge-badge': {
                fontSize: '0.8rem',
                padding: '0 8px',
                height: 24,
                minWidth: 70,
              },
            }}
          />
        )}

        <IconButton
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1,
            bgcolor: 'rgba(255,255,255,0.9)',
            '&:hover': { bgcolor: 'white' },
          }}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(therapist._id);
          }}
        >
          {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
        </IconButton>

        <Box
          sx={{
            height: 140,
            bgcolor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Avatar
            sx={{
              width: 100,
              height: 100,
              border: '4px solid white',
              boxShadow: 2,
            }}
          >
            {therapist.profile?.firstName?.[0]}
            {therapist.profile?.lastName?.[0]}
          </Avatar>
          {therapist.therapistDetails?.isVerified && (
            <VerifiedIcon
              color="primary"
              sx={{
                position: 'absolute',
                bottom: 20,
                right: 'calc(50% - 40px)',
                bgcolor: 'white',
                borderRadius: '50%',
                fontSize: 20,
              }}
            />
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom align="center">
            Dr. {therapist.profile?.firstName} {therapist.profile?.lastName}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <Rating value={therapist.therapistDetails?.averageRating || 0} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">
              ({therapist.therapistDetails?.totalReviews || 0})
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 2 }}>
            {therapist.therapistDetails?.specializations?.slice(0, 3).map((spec) => (
              <Chip key={spec} label={spec} size="small" variant="outlined" />
            ))}
          </Box>

          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EventAvailableIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {therapist.therapistDetails?.yearsExperience || 0} yrs
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AttachMoneyIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  ${therapist.therapistDetails?.sessionRate || 0}/hr
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LanguageIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {therapist.therapistDetails?.languages?.length || 1} languages
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocalHospitalIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {therapist.therapistDetails?.acceptsInsurance ? 'Insurance' : 'Private Pay'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button
            size="small"
            startIcon={<InfoIcon />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTherapist(therapist);
              setDetailsDialog(true);
            }}
          >
            Profile
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<BookOnlineIcon />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/book-session/${therapist._id}`);
            }}
          >
            Book
          </Button>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleCompare(therapist._id);
            }}
            color={comparing.includes(therapist._id) ? 'primary' : 'default'}
          >
            <Badge
              color="primary"
              variant="dot"
              invisible={!comparing.includes(therapist._id)}
            >
              <ShareIcon />
            </Badge>
          </IconButton>
        </CardActions>
      </Card>
    );
  };

  // If API is not ready and no mock data, show loading
  if (!apiReady && therapists.length === 0 && !error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Find Your Therapist
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Discover and connect with licensed therapists tailored to your needs
        </Typography>

        {/* Search Bar */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name, specialization, or condition..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setFilterDrawerOpen(true)}>
                  <Badge
                    color="primary"
                    variant="dot"
                    invisible={Object.values(filters).every(f => 
                      Array.isArray(f) ? f.length === 0 : 
                      typeof f === 'number' ? f === 0 : 
                      typeof f === 'boolean' ? !f : true
                    )}
                  >
                    <FilterListIcon />
                  </Badge>
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Quick Filters */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            label="Accepting Insurance"
            onClick={() => handleFilterChange('acceptsInsurance', !filters.acceptsInsurance)}
            color={filters.acceptsInsurance ? 'primary' : 'default'}
            variant={filters.acceptsInsurance ? 'filled' : 'outlined'}
          />
          <Chip
            label="Available Today"
            onClick={() => handleFilterChange('availableToday', !filters.availableToday)}
            color={filters.availableToday ? 'primary' : 'default'}
            variant={filters.availableToday ? 'filled' : 'outlined'}
          />
          <Chip
            label="Virtual Only"
            onClick={() => handleFilterChange('virtualOnly', !filters.virtualOnly)}
            color={filters.virtualOnly ? 'primary' : 'default'}
            variant={filters.virtualOnly ? 'filled' : 'outlined'}
          />
        </Box>

        {/* Sort and View Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              {sortOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, val) => val && setViewMode(val)}
            size="small"
          >
            <ToggleButton value="grid">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Filters Drawer */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{
            sx: { width: isMobile ? '100%' : 400, p: 3 },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Specializations Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Specializations
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                multiple
                value={filters.specializations}
                onChange={(e) => handleFilterChange('specializations', e.target.value)}
                input={<OutlinedInput label="Specializations" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {specializations.map((spec) => (
                  <MenuItem key={spec} value={spec}>
                    <Checkbox checked={filters.specializations.indexOf(spec) > -1} />
                    <ListItemText primary={spec} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Languages Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Languages
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                multiple
                value={filters.languages}
                onChange={(e) => handleFilterChange('languages', e.target.value)}
                input={<OutlinedInput label="Languages" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang} value={lang}>
                    <Checkbox checked={filters.languages.indexOf(lang) > -1} />
                    <ListItemText primary={lang} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Insurance Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Insurance Accepted
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                multiple
                value={filters.insurance}
                onChange={(e) => handleFilterChange('insurance', e.target.value)}
                input={<OutlinedInput label="Insurance" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {insuranceProviders.map((ins) => (
                  <MenuItem key={ins} value={ins}>
                    <Checkbox checked={filters.insurance.indexOf(ins) > -1} />
                    <ListItemText primary={ins} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Rating Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Minimum Rating: {filters.minRating} stars
            </Typography>
            <Slider
              value={filters.minRating}
              onChange={(e, val) => handleFilterChange('minRating', val)}
              min={0}
              max={5}
              step={0.5}
              marks={[
                { value: 0, label: '0' },
                { value: 5, label: '5' },
              ]}
            />
          </Box>

          {/* Price Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Max Rate: ${filters.maxRate}
            </Typography>
            <Slider
              value={filters.maxRate}
              onChange={(e, val) => handleFilterChange('maxRate', val)}
              min={0}
              max={500}
              step={25}
              marks={[
                { value: 0, label: '$0' },
                { value: 250, label: '$250' },
                { value: 500, label: '$500' },
              ]}
            />
          </Box>

          {/* Experience Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Experience: {filters.experience[0]} - {filters.experience[1]} years
            </Typography>
            <Slider
              value={filters.experience}
              onChange={(e, val) => handleFilterChange('experience', val)}
              min={0}
              max={30}
              valueLabelDisplay="auto"
            />
          </Box>

          {/* Toggle Filters */}
          <Box sx={{ mb: 3 }}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.acceptsInsurance}
                    onChange={(e) => handleFilterChange('acceptsInsurance', e.target.checked)}
                  />
                }
                label="Accepts Insurance"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.availableToday}
                    onChange={(e) => handleFilterChange('availableToday', e.target.checked)}
                  />
                }
                label="Available Today"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.virtualOnly}
                    onChange={(e) => handleFilterChange('virtualOnly', e.target.checked)}
                  />
                }
                label="Virtual Sessions Only"
              />
            </FormGroup>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleClearFilters}
            sx={{ mb: 2 }}
          >
            Clear All Filters
          </Button>
        </Drawer>

        {/* Therapist Grid */}
        <Grid item xs={12}>
          {loading ? (
            renderSkeleton()
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : therapists.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No therapists found
              </Typography>
              <Button variant="outlined" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </Box>
          ) : (
            <>
              {/* Recommendations Section - Only show for patients */}
              {user?.role === 'patient' && recommendations.length > 0 && page === 1 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PsychologyIcon color="primary" />
                    Recommended for You
                    {recommendationSource === 'gnn' && (
                      <Chip
                        label="AI Powered"
                        size="small"
                        color="primary"
                        icon={<PsychologyIcon />}
                      />
                    )}
                  </Typography>
                  <Grid container spacing={3}>
                    {recommendations.slice(0, 3).map((rec) => (
                      <Grid item xs={12} sm={6} md={4} key={rec.therapist.id}>
                        {renderTherapistCard(rec.therapist, rec.match_score)}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <Typography variant="h5" gutterBottom>
                All Therapists ({therapists.length})
              </Typography>
              
              {viewMode === 'grid' ? (
                <Grid container spacing={3}>
                  {therapists.map((therapist) => (
                    <Grid item xs={12} sm={6} md={4} key={therapist._id}>
                      {renderTherapistCard(therapist)}
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box>
                  {/* List view implementation */}
                  <Typography>List view coming soon...</Typography>
                </Box>
              )}

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, val) => setPage(val)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>

      {/* Compare FAB */}
      {comparing.length > 0 && (
        <Zoom in>
          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 20, right: 20 }}
            onClick={() => {/* Navigate to compare page */}}
          >
            <Badge badgeContent={comparing.length} color="error">
              <ShareIcon />
            </Badge>
          </Fab>
        </Zoom>
      )}

      {/* Scroll to Top */}
      <Zoom in={page > 1}>
        <Fab
          size="small"
          color="secondary"
          sx={{ position: 'fixed', bottom: 20, left: 20 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUpwardIcon />
        </Fab>
      </Zoom>
    </Box>
  );
};

export default TherapistMatching;