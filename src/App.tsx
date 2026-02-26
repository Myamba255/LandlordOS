import { useAuthStore } from './store/authStore';
import AuthPage from './components/AuthPage';
import AppLayout from './components/AppLayout';

export default function App() {
  const { token } = useAuthStore();

  if (!token) {
    return <AuthPage />;
  }

  return <AppLayout children={null} />;
}
