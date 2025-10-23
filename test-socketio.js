// Test Socket.IO connection
const { io } = require('socket.io-client');

// Connect to the server
const socket = io('http://localhost:5002', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});

socket.on('sensorDataUpdate', (data) => {
  console.log('Received sensor data update:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.log('Connection error:', error);
});