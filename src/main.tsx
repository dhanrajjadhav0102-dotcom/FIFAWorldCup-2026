import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppContext';
import { initFirebase } from './services/firebase';

async function bootstrap() {
  let config = null;

  // Fetch the automatic Firebase Hosting configuration variables if they are exposed
  try {
    const response = await fetch('/__/firebase/init.json');
    if (response.ok) {
      config = await response.json();
      console.log("Firebase Hosting auto-configuration detected.", config);
    }
  } catch {
    // Normal fallback when running in local development mode
    console.log("Using compiled environment variables for Firebase configuration.");
  }

  // Initialize Firebase dynamic configuration options
  if (config) {
    initFirebase(config);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <AppDataProvider>
          <App />
        </AppDataProvider>
      </AuthProvider>
    </StrictMode>
  );
}

bootstrap();
