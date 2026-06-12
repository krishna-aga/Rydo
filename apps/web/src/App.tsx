import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore.js';
import Login from './pages/Login/index.js';
import Home from './pages/Home/index.js';

export default function App() {
  const { token, user, checkMe } = useAuthStore();

  // Check authentication session
  useEffect(() => {
    checkMe();
  }, []);

  if (!token || !user) {
    return <Login />;
  }

  return <Home />;
}
