import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 420, padding: 'var(--space-2xl)' }}>
        <ShieldAlert size={64} color="var(--accent-danger)" style={{ marginBottom: 'var(--space-lg)' }} />
        <h1 style={{ fontSize: 'var(--font-2xl)', marginBottom: 'var(--space-sm)' }}>Access Denied</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          Your role <strong>({user?.role})</strong> does not have permission to access this page.
        </p>
        <Button variant="primary" onClick={() => navigate('/', { replace: true })}>Go to Dashboard</Button>
      </div>
    </div>
  );
};
export default Unauthorized;
