'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface SaveActionContextType {
  onSave: (() => void) | null;
  setOnSave: (callback: (() => void) | null) => void;
  triggerSave: () => void;
}

const SaveActionContext = createContext<SaveActionContextType | null>(null);

export function SaveActionProvider({ children }: { children: React.ReactNode }) {
  const [onSave, setOnSaveCallback] = useState<(() => void) | null>(null);

  const setOnSave = useCallback((callback: (() => void) | null) => {
    setOnSaveCallback(() => callback);
  }, []);

  const triggerSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
  }, [onSave]);

  return (
    <SaveActionContext.Provider value={{ onSave, setOnSave, triggerSave }}>
      {children}
    </SaveActionContext.Provider>
  );
}

export function useSaveAction() {
  const context = useContext(SaveActionContext);
  if (context === null) {
    return { onSave: null, setOnSave: () => {}, triggerSave: () => {} };
  }
  return context;
}

