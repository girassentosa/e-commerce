'use client';

import React, { createContext, useContext, useState } from 'react';

interface FavoriteEditModeContextType {
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
}

const FavoriteEditModeContext = createContext<FavoriteEditModeContextType | null>(null);

export function FavoriteEditModeProvider({ children }: { children: React.ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <FavoriteEditModeContext.Provider value={{ isEditMode, setIsEditMode }}>
      {children}
    </FavoriteEditModeContext.Provider>
  );
}

export function useFavoriteEditMode() {
  const context = useContext(FavoriteEditModeContext);
  // Return default value if context not available (for use outside favorite page)
  if (context === null) {
    return { isEditMode: false, setIsEditMode: () => {} };
  }
  return context;
}

