import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { useAuthStore } from './store/authStore';

// Initialize global auth context before rendering main UI
useAuthStore.getState().init().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Register PWA Service Worker for offline support and background pushes
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('👷 [PWA] Service Worker registered successfully with scope:', registration.scope);
          
          // Request browser notifications permission
          if ('Notification' in window) {
            Notification.requestPermission().then((permission) => {
              console.log(`👷 [PWA] Notifications permission status: ${permission}`);
            });
          }
        })
        .catch((error) => {
          console.warn('👷 [PWA] Service Worker registration failed:', error);
        });
    });
  }
});
