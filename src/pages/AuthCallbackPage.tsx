import React, { useEffect } from 'react';

interface AuthCallbackPageProps {
  onSuccess: (token: string, user: any) => void;
}

export default function AuthCallbackPage({ onSuccess }: AuthCallbackPageProps) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const user   = params.get('user');

    const baseUrl = process.env.PUBLIC_URL || '/';

    if (token && user) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(user));
        onSuccess(token, parsedUser);
        window.history.replaceState({}, '', baseUrl);
      } catch {
        window.location.href = baseUrl;
      }
    } else {
      window.location.href = baseUrl;
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f4f0fc',
    }}>
      <p style={{ color: '#8b72be', fontSize: '16px', fontWeight: 700 }}>
        ⏱ Вхід через Google...
      </p>
    </div>
  );
}