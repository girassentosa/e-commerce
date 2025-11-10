'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminHeaderContextType {
  icon: LucideIcon | null;
  title: string;
  setHeader: (icon: LucideIcon | null, title: string) => void;
}

const AdminHeaderContext = createContext<AdminHeaderContextType | undefined>(undefined);

export function AdminHeaderProvider({ children }: { children: ReactNode }) {
  const [icon, setIcon] = useState<LucideIcon | null>(null);
  const [title, setTitle] = useState<string>('Admin Panel');

  const setHeader = (newIcon: LucideIcon | null, newTitle: string) => {
    setIcon(newIcon);
    setTitle(newTitle);
  };

  return (
    <AdminHeaderContext.Provider value={{ icon, title, setHeader }}>
      {children}
    </AdminHeaderContext.Provider>
  );
}

export function useAdminHeader() {
  const context = useContext(AdminHeaderContext);
  if (context === undefined) {
    throw new Error('useAdminHeader must be used within AdminHeaderProvider');
  }
  return context;
}

