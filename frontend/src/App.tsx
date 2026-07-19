import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';
import './index.css';
import axios from 'axios';

function App() {
  useEffect(() => {
    const fetchTheme = () => {
      axios.get('/api/admin/hospital-settings/public')
        .then(res => {
          if (res.data.success && res.data.data) {
            const theme = res.data.data.theme || 'dark';
            const html = document.documentElement;
            if (theme === 'light') {
              if (!html.classList.contains('light-theme')) {
                html.classList.add('light-theme');
              }
            } else {
              if (html.classList.contains('light-theme')) {
                html.classList.remove('light-theme');
              }
            }
          }
        })
        .catch(err => console.error('Failed to load theme:', err));
    };

    // Fetch theme immediately
    fetchTheme();

    // Poll every 5 seconds for real-time changes
    const interval = setInterval(fetchTheme, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
