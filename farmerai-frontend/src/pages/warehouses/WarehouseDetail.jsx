import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Button, 
  Container, 
  Grid, 
  Typography, 
  Paper, 
  Chip, 
  Divider, 
  Rating, 
  TextField, 
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { 
  LocationOn as LocationOnIcon, 
  CalendarToday as CalendarTodayIcon,
  AttachMoney as AttachMoneyIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  DateRange as DateRangeIcon,
  Storage as StorageIcon,
  EventAvailable as EventAvailableIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, differenceInDays, format, isBefore, isAfter, isSameDay } from 'date-fns';
import { loadScript } from '@razorpay/checkout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API Service
import apiClient from '../../services/apiClient';

// Components
import ImageGallery from '../../components/warehouse/ImageGallery';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStartDate, setSelectedStartDate] = useState(addDays(new Date(), 1));
  const [selectedEndDate, setSelectedEndDate] = useState(addDays(new Date(), 2));
  const [quantity, setQuantity] = useState(1);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isDateRangeValid, setIsDateRangeValid] = useState(true);
  const [dateRangeError, setDateRangeError] = useState('');
  
  // Get user from Redux store
  const { user } = useSelector((state) => state.auth);
  
  // Load warehouse data
  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/warehouses/${id}`);
        setWarehouse(response.data);
        
        // Fetch unavailable dates
        await checkAvailability();
      } catch (err) {
        console.error('Error fetching warehouse:', err);
        setError('Failed to load warehouse details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWarehouse();
  }, [id]);
  
  // Check date range validity
  useEffect(() => {
    if (selectedStartDate && selectedEndDate) {
      const days = differenceInDays(selectedEndDate, selectedStartDate);
      
      if (days < 1) {
        setIsDateRangeValid(false);
        setDateRangeError('End date must be after start date');
      } else if (days > 90) {
        setIsDateRangeValid(false);
        setDateRangeError('Maximum booking duration is 90 days');
      } else {
        // Check if any date in the range is unavailable
        const isRangeUnavailable = unavailableDates.some(date => 
          isAfter(date, selectedStartDate) && isBefore(date, selectedEndDate)
        );
        
        if (isRangeUnavailable) {
          setIsDateRangeValid(false);
          setDateRangeError('Selected dates are not available');
        } else {
          setIsDateRangeValid(true);
          setDateRangeError('');
        }
      }
    }
  }, [selectedStartDate, selectedEndDate, unavailableDates]);
  
  // Check warehouse availability
  const checkAvailability = async () => {
    try {
      setIsCheckingAvailability(true);
      const response = await apiClient.get(`/v2/warehouses/${id}/availability`);
      
      // Convert date strings to Date objects
      const unavailable = response.data.availability
        .filter(slot => !slot.available)
        .map(slot => new Date(slot.date));
      
      setUnavailableDates(unavailable);
    } catch (err) {
      console.error('Error checking availability:', err);
      toast.error('Failed to check availability. Please try again.');
    } finally {
      setIsCheckingAvailability(false);
    }
  };
  
  // Handle date change
  const handleStartDateChange = (date) => {
    setSelectedStartDate(date);
    
    // If end date is before new start date, adjust end date
    if (selectedEndDate && isBefore(selectedEndDate, date)) {
      setSelectedEndDate(addDays(date, 1));
    }
  };
  
  // Calculate total price
  const calculateTotal = () => {
    if (!warehouse || !selectedStartDate || !selectedEndDate) return 0;
    
    const days = differenceInDays(selectedEndDate, selectedStartDate) || 1;
    return warehouse.pricePerDay * days * quantity;
  };
  
  // Handle book now click
  const handleBookNow = () => {
    if (!user) {
      // Redirect to login with return URL
      navigate('/login', { state: { from: `/warehouses/${id}` } });
      return;
    }
    
    setShowBookingDialog(true);
  };
  
  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!isDateRangeValid || !user) return;
    
    setBookingInProgress(true);
    
    try {
      // Calculate duration
      const duration = differenceInDays(selectedEndDate, selectedStartDate) || 1;
      
      // Create booking using the correct API endpoint
      const bookingPayload = {
        warehouseId: id,
        produce: {
          type: 'general', // You can add a field for this
          quantity: quantity,
          unit: 'sqft'
        },
        storageRequirements: {
          storageType: 'general',
          temperature: {},
          humidity: {}
        },
        bookingDates: {
          startDate: selectedStartDate.toISOString(),
          endDate: selectedEndDate.toISOString()
        },
        notes: ''
      };
      
      const response = await apiClient.post('/warehouse-bookings/book', bookingPayload);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to create booking');
      }
      
      const { booking, razorpayOrder } = response.data.data;
      
      // Load Razorpay script
      const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay. Please check your internet connection.');
      }
      
      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: booking.pricing.totalAmount * 100, // Convert to paise
        currency: 'INR',
        name: 'FarmerAI Warehouse Booking',
        description: `Booking for ${warehouse.name}`,
        order_id: razorpayOrder.id,
        handler: async function(response) {
          try {
            // Verify payment
            await apiClient.post('/warehouse-bookings/verify-payment', {
              bookingId: booking._id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });
            
            // Show success message
            toast.success('Payment successful! Booking confirmed.');
            
            // Redirect to bookings page
            setTimeout(() => {
              navigate('/my-bookings');
            }, 2000);
          } catch (err) {
            console.error('Payment verification failed:', err);
            toast.error('Payment verification failed. Please contact support.');
            // Still redirect to bookings to see the pending booking
            setTimeout(() => {
              navigate('/my-bookings');
            }, 3000);
          }
        },
        prefill: {
          name: `${user.firstName} ${user.lastName || ''}`.trim(),
          email: user.email,
          contact: user.phone || ''
        },
        theme: {
          color: '#4CAF50'
        },
        modal: {
          ondismiss: function() {
            toast.info('Payment cancelled. Your booking is saved and you can complete payment later.');
            setTimeout(() => {
              navigate('/my-bookings');
            }, 2000);
          }
        }
      };
      
      // Close booking dialog before opening Razorpay
      setShowBookingDialog(false);
      
      // Open Razorpay payment modal
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setTimeout(() => {
          navigate('/my-bookings');
        }, 3000);
      });
      rzp.open();
      
    } catch (err) {
      console.error('Booking failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create booking. Please try again.';
      toast.error(errorMessage);
      setShowBookingDialog(false);
    } finally {
      setBookingInProgress(false);
    }
  };
  
  // Render loading state
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }
  
  // Render error state
  if (error || !warehouse) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back to Warehouses
        </Button>
        <Alert severity="error">
          {error || 'Warehouse not found'}
        </Alert>
      </Container>
    );
  }
  
  // Calculate total days and price
  const totalDays = differenceInDays(selectedEndDate, selectedStartDate) || 1;
  const totalPrice = calculateTotal();
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back button */}
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back to Warehouses
      </Button>
      
      {/* Main content */}
      <Grid container spacing={4}>
        {/* Left column - Images */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <ImageGallery images={warehouse.images || []} />
          </Paper>
          
          {/* Warehouse details */}
          <Paper elevation={3} sx={{ p: 3, mt: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              About this warehouse
            </Typography>
            
            <Typography variant="body1" paragraph>
              {warehouse.description || 'No description available.'}
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Amenities
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {warehouse.amenities?.length > 0 ? (
                warehouse.amenities.map((amenity, index) => (
                  <Chip 
                    key={index} 
                    label={amenity} 
                    icon={<CheckCircleIcon fontSize="small" />}
                    variant="outlined"
                    size="small"
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No amenities listed
                </Typography>
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Location
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationOnIcon color="primary" sx={{ mr: 1 }} />
              <Typography>
                {warehouse.location.address}, {warehouse.location.city}, {warehouse.location.state} - {warehouse.location.pincode}
              </Typography>
            </Box>
            
            {/* Map placeholder - You can integrate with Google Maps or similar */}
            <Box 
              sx={{ 
                height: 200, 
                bgcolor: 'grey.200', 
                mt: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: 1
              }}
            >
              <Typography color="text.secondary">Map View</Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Right column - Booking form */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              ₹{warehouse.pricePerDay?.toLocaleString()} <Typography component="span" color="text.secondary">/ day</Typography>
            </Typography>
            
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                <StorageIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Capacity: {warehouse.capacity?.toLocaleString()} sq.ft.
              </Typography>
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                <EventAvailableIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Status: <span style={{ color: warehouse.status === 'available' ? 'green' : 'red' }}>
                  {warehouse.status === 'available' ? 'Available' : 'Booked'}
                </span>
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                  <DateRangeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Select Dates
                </Typography>
                
                <DatePicker
                  label="Start Date"
                  value={selectedStartDate}
                  onChange={handleStartDateChange}
                  minDate={addDays(new Date(), 1)}
                  shouldDisableDate={(date) => {
                    // Disable past dates and unavailable dates
                    return isBefore(date, new Date()) || 
                      unavailableDates.some(d => isSameDay(d, date));
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      size="small" 
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarTodayIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                
                <DatePicker
                  label="End Date"
                  value={selectedEndDate}
                  onChange={(date) => setSelectedEndDate(date)}
                  minDate={selectedStartDate || addDays(new Date(), 2)}
                  shouldDisableDate={(date) => {
                    // Disable dates before start date and unavailable dates
                    return (selectedStartDate && isBefore(date, selectedStartDate)) ||
                      unavailableDates.some(d => isSameDay(d, date));
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      size="small"
                      error={!!dateRangeError}
                      helperText={dateRangeError}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarTodayIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                
                <TextField
                  label="Quantity (sq.ft.)"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  fullWidth
                  size="small"
                  sx={{ mt: 2 }}
                  inputProps={{ min: 1, max: warehouse.availableSpace || 10000 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">sq.ft.</InputAdornment>,
                  }}
                />
              </Box>
            </LocalizationProvider>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Price breakdown */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  ₹{warehouse.pricePerDay?.toLocaleString()} x {totalDays} {totalDays > 1 ? 'days' : 'day'}
                </Typography>
                <Typography variant="body2">
                  ₹{(warehouse.pricePerDay * totalDays).toLocaleString()}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Quantity
                </Typography>
                <Typography variant="body2">
                  {quantity} sq.ft.
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Total
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  ₹{totalPrice.toLocaleString()}
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleBookNow}
              disabled={!isDateRangeValid || warehouse.status !== 'available' || bookingInProgress}
              startIcon={bookingInProgress ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
            >
              {bookingInProgress ? 'Processing...' : 'Book Now'}
            </Button>
            
            {warehouse.status !== 'available' && (
              <Typography variant="body2" color="error" sx={{ mt: 1, textAlign: 'center' }}>
                This warehouse is currently not available for booking.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Booking Confirmation Dialog */}
      <Dialog 
        open={showBookingDialog} 
        onClose={() => !bookingInProgress && setShowBookingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You're about to book <strong>{warehouse.name}</strong> from{' '}
            <strong>{format(selectedStartDate, 'MMM d, yyyy')}</strong> to{' '}
            <strong>{format(selectedEndDate, 'MMM d, yyyy')}</strong>.
            
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Booking Summary:</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Duration:</Typography>
                <Typography variant="body2">{totalDays} {totalDays > 1 ? 'days' : 'day'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Rate:</Typography>
                <Typography variant="body2">₹{warehouse.pricePerDay?.toLocaleString()} / day</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Quantity:</Typography>
                <Typography variant="body2">{quantity} sq.ft.</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">Total Amount:</Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  ₹{totalPrice.toLocaleString()}
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              You'll be redirected to a secure payment page to complete your booking.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowBookingDialog(false)} 
            disabled={bookingInProgress}
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmBooking} 
            variant="contained" 
            color="primary" 
            disabled={bookingInProgress}
            startIcon={bookingInProgress ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
          >
            {bookingInProgress ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Toast container */}
      <ToastContainer position="bottom-right" autoClose={5000} />
    </Container>
  );
};

export default WarehouseDetail;
