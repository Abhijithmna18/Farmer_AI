// Simple authentication debug component
import React from 'react';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

const AuthDebug = () => {
  const { user, loading } = useAuth();
  
  const debugInfo = {
    'Auth Context User': user ? 'Present' : 'Null',
    'Auth Context Loading': loading,
    'Firebase Current User': auth.currentUser ? 'Present' : 'Null',
    'localStorage Token': localStorage.getItem('token') ? 'Present' : 'Null',
    'sessionStorage Token': sessionStorage.getItem('token') ? 'Present' : 'Null',
    'localStorage Email': localStorage.getItem('email') || 'Not set',
    'localStorage Role': localStorage.getItem('role') || 'Not set',
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid #ccc', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>🔍 Auth Debug Info</h4>
      {Object.entries(debugInfo).map(([key, value]) => (
        <div key={key} style={{ margin: '2px 0' }}>
          <strong>{key}:</strong> {String(value)}
        </div>
      ))}
      <button 
        onClick={() => {
          console.log('🔍 Full auth debug:', {
            user,
            loading,
            firebaseUser: auth.currentUser,
            localStorage: {
              token: localStorage.getItem('token'),
              email: localStorage.getItem('email'),
              role: localStorage.getItem('role')
            },
            sessionStorage: {
              token: sessionStorage.getItem('token')
            }
          });
        }}
        style={{ 
          marginTop: '10px', 
          padding: '5px 10px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Log to Console
      </button>
    </div>
  );
};

export default AuthDebug;
