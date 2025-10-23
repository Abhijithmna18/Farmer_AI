import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Chip, 
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Download, 
  SmartToy, 
  Agriculture, 
  History, 
  FileDownload,
  Share,
  Print,
  CropFree,
  TrendingUp,
  CalendarToday
} from '@mui/icons-material';
import { format } from 'date-fns';
import InteractionHistory from '../components/InteractionHistory';
import { useAuth } from '../context/AuthContext';
import { getAssistantHistory } from '../services/assistantService';
import { getRecommendations } from '../services/assistantService';

const InteractionHistoryPage = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [interactionHistory, setInteractionHistory] = useState([]);
  const [cropRecommendations, setCropRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [cropDetailsOpen, setCropDetailsOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyResponse, recommendationsResponse] = await Promise.all([
        getAssistantHistory(user.id),
        getRecommendations('Loamy', 'post-monsoon', 'Kerala') // Default values
      ]);

      if (historyResponse.success) {
        setInteractionHistory(historyResponse.data || []);
      }

      if (recommendationsResponse.recommendations) {
        setCropRecommendations(recommendationsResponse.recommendations);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCropDetails = (crop) => {
    setSelectedCrop(crop);
    setCropDetailsOpen(true);
  };

  const exportToPDF = () => {
    // Implementation for PDF export
    const data = interactionHistory.map(item => ({
      Date: format(new Date(item.createdAt), 'PPpp'),
      Query: item.query,
      Reply: item.reply,
      Type: item.type,
      Language: item.language
    }));
    
    // Simple text export for now
    const content = data.map(item => 
      `Date: ${item.Date}\nQuery: ${item.Query}\nReply: ${item.Reply}\nType: ${item.Type}\nLanguage: ${item.Language}\n\n`
    ).join('---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interaction-history.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCropData = () => {
    const cropData = cropRecommendations.map(crop => ({
      Crop: crop.crop || crop.label,
      Variety: crop.variety || 'N/A',
      Reason: crop.reason || 'N/A',
      ExpectedYield: crop.expectedYield || 'N/A',
      ProfitEstimation: crop.profitEstimation || 'N/A'
    }));
    
    const content = cropData.map(crop => 
      `Crop: ${crop.Crop}\nVariety: ${crop.Variety}\nReason: ${crop.Reason}\nExpected Yield: ${crop.ExpectedYield}\nProfit Estimation: ${crop.ProfitEstimation}\n\n`
    ).join('---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crop-recommendations.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="text.secondary">
            Please sign in to view your interaction history
          </Typography>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          <SmartToy sx={{ mr: 2, verticalAlign: 'middle' }} />
          Smart Assistant Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Review your farming interactions, crop recommendations, and download detailed reports
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab 
            icon={<History />} 
            label="Interaction History" 
            iconPosition="start"
          />
          <Tab 
            icon={<Agriculture />} 
            label="Crop Recommendations" 
            iconPosition="start"
          />
          <Tab 
            icon={<TrendingUp />} 
            label="Analytics" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {tabValue === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Your Assistant Interactions</Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={exportToPDF}
                sx={{ mr: 1 }}
              >
                Export History
              </Button>
            </Box>
          </Box>
          <InteractionHistory />
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Crop Recommendations</Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={exportCropData}
                sx={{ mr: 1 }}
              >
                Export Crop Data
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            {cropRecommendations.map((crop, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" component="h3">
                        {crop.crop || crop.label}
                      </Typography>
                      <Chip 
                        label={`#${index + 1}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      <strong>Variety:</strong> {crop.variety || 'N/A'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      <strong>Reason:</strong> {crop.reason || 'N/A'}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="body2">
                        <strong>Yield:</strong> {crop.expectedYield || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Profit:</strong> {crop.profitEstimation || 'N/A'}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box display="flex" justifyContent="space-between">
                      <Button
                        size="small"
                        startIcon={<CropFree />}
                        onClick={() => handleCropDetails(crop)}
                      >
                        View Details
                      </Button>
                      <Tooltip title="Add to Calendar">
                        <IconButton size="small">
                          <CalendarToday />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>Analytics & Insights</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {interactionHistory.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Interactions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="secondary" gutterBottom>
                    {cropRecommendations.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crop Recommendations
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="success.main" gutterBottom>
                    {new Set(interactionHistory.map(i => i.type)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Interaction Types
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Crop Details Dialog */}
      <Dialog 
        open={cropDetailsOpen} 
        onClose={() => setCropDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Agriculture sx={{ mr: 1 }} />
            {selectedCrop?.crop || selectedCrop?.label} - Detailed Information
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCrop && (
            <Box>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Box mb={2}>
                <Typography variant="body2"><strong>Variety:</strong> {selectedCrop.variety || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Expected Yield:</strong> {selectedCrop.expectedYield || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Profit Estimation:</strong> {selectedCrop.profitEstimation || 'N/A'}</Typography>
              </Box>
              
              <Typography variant="h6" gutterBottom>Recommendation Details</Typography>
              <Typography variant="body2" paragraph>
                {selectedCrop.reason || 'No detailed information available.'}
              </Typography>
              
              <Typography variant="h6" gutterBottom>Growing Conditions</Typography>
              <Typography variant="body2" paragraph>
                This crop is recommended based on your soil type, season, and location. 
                For specific growing instructions, consult with local agricultural experts.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCropDetailsOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Download />}>
            Download Details
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InteractionHistoryPage;
