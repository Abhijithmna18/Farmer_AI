import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAssistantHistory } from '../services/assistantService';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { format } from 'date-fns';

const InteractionHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await getAssistantHistory(user.id);
        if (response.success) {
          setHistory(Array.isArray(response.data) ? response.data : []);
        } else {
          setError('Failed to load interaction history');
        }
      } catch (err) {
        console.error('Error fetching interaction history:', err);
        setError('Error loading interaction history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchHistory();
    }
  }, [user]);

  const getInteractionType = (type) => {
    const types = {
      chat: 'Chat',
      insight: 'Insight',
      recommendation: 'Recommendation',
      task: 'Task',
    };
    return types[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      chat: 'primary',
      insight: 'success',
      recommendation: 'info',
      task: 'warning',
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {history.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No interaction history found. Start by asking the assistant something!
        </Alert>
      ) : (
        <List>
          {history.map((item, index) => (
            <React.Fragment key={item._id || index}>
              <ListItem 
                alignItems="flex-start" 
                sx={{ 
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  p: 2,
                  mb: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: 'primary.main'
                  }
                }}
              >
                <Box width="100%" display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box>
                    <Chip 
                      label={getInteractionType(item.type)} 
                      size="small" 
                      color={getTypeColor(item.type)}
                      sx={{ mr: 1 }}
                    />
                    {item.language && (
                      <Chip 
                        label={item.language.toUpperCase()} 
                        size="small" 
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {item.createdAt ? format(new Date(item.createdAt), 'PPpp') : 'Unknown date'}
                  </Typography>
                </Box>
                
                <Box width="100%" mt={1}>
                  <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                    You asked:
                  </Typography>
                  <Typography variant="body1" paragraph sx={{ ml: 1, mb: 2, fontStyle: 'italic' }}>
                    {item.query || 'No query content'}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Assistant replied:
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 1, whiteSpace: 'pre-line' }}>
                    {item.reply || 'No reply content'}
                  </Typography>
                  
                  {item.metadata && Object.keys(item.metadata).length > 0 && (
                    <Box mt={2} p={1} bgcolor="action.hover" borderRadius={1}>
                      <Typography variant="caption" color="text.secondary">
                        Additional data: {JSON.stringify(item.metadata, null, 2)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default InteractionHistory;
