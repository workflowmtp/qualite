'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { ToastProvider } from '@/components/Toast';
import { ModalProvider } from '@/components/Modal';
import LoginScreen from '@/components/LoginScreen';
import RegisterScreen from '@/components/RegisterScreen';
import ForgotPasswordScreen from '@/components/ForgotPasswordScreen';
import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import PageContent from '@/components/PageContent';

type AuthPage = 'login' | 'register' | 'forgot-password';

export default function Home() {
  const { currentUser, theme } = useStore();
  const [authPage, setAuthPage] = useState<AuthPage>('login');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  const renderAuthPage = () => {
    switch (authPage) {
      case 'register':
        return <RegisterScreen onNavigate={setAuthPage} />;
      case 'forgot-password':
        return <ForgotPasswordScreen onNavigate={setAuthPage} />;
      default:
        return <LoginScreen onNavigate={setAuthPage} />;
    }
  };

  return (
    <ToastProvider>
      <ModalProvider>
        {!currentUser ? (
          renderAuthPage()
        ) : (
          <>
            <Topbar />
            <Sidebar />
            <main
              className="main-content"
              style={{
                marginLeft: 'var(--sidebar-width)',
                marginTop: 'var(--topbar-height)',
                height: 'calc(100vh - var(--topbar-height))',
                overflowY: 'auto',
                padding: 24,
                background: 'var(--bg-primary)',
              }}
            >
              <PageContent />
            </main>
          </>
        )}
      </ModalProvider>
    </ToastProvider>
  );
}
