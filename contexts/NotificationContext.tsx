'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { SuccessNotification } from '@/components/ui/SuccessNotification';
import { ErrorNotification } from '@/components/ui/ErrorNotification';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface NotificationState {
  type: 'success' | 'error' | null;
  title: string;
  message: string;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'danger';
}

interface NotificationContextType {
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
    confirmVariant?: 'default' | 'danger'
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<NotificationState>({
    type: null,
    title: '',
    message: '',
  });

  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  const showSuccess = useCallback((title: string, message: string) => {
    setNotification({ type: 'success', title, message });
  }, []);

  const showError = useCallback((title: string, message: string) => {
    setNotification({ type: 'error', title, message });
  }, []);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
    confirmVariant?: 'default' | 'danger'
  ) => {
    setConfirm({
      isOpen: true,
      title,
      message,
      onConfirm,
      onCancel: onCancel || (() => setConfirm(prev => ({ ...prev, isOpen: false }))),
      confirmText,
      cancelText,
      confirmVariant,
    });
  }, []);

  const handleCloseNotification = useCallback(() => {
    setNotification({ type: null, title: '', message: '' });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirm.onConfirm) {
      confirm.onConfirm();
    }
    setConfirm(prev => ({ ...prev, isOpen: false }));
  }, [confirm]);

  const handleCancel = useCallback(() => {
    if (confirm.onCancel) {
      confirm.onCancel();
    }
    setConfirm(prev => ({ ...prev, isOpen: false }));
  }, [confirm]);

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showConfirm }}>
      {children}
      {notification.type === 'success' && (
        <SuccessNotification
          title={notification.title}
          message={notification.message}
          onClose={handleCloseNotification}
        />
      )}
      {notification.type === 'error' && (
        <ErrorNotification
          title={notification.title}
          message={notification.message}
          onClose={handleCloseNotification}
        />
      )}
      {confirm.isOpen && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText={confirm.confirmText}
          cancelText={confirm.cancelText}
          confirmVariant={confirm.confirmVariant}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

