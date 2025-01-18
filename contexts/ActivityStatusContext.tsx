import React, { createContext, useContext, useState } from 'react';

type ActivityStatusContextType = {
  isActive: boolean;
  setIsActive: (value: boolean) => void;
};

const ActivityStatusContext = createContext<ActivityStatusContextType | undefined>(undefined);

export function ActivityStatusProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  return (
    <ActivityStatusContext.Provider value={{ isActive, setIsActive }}>
      {children}
    </ActivityStatusContext.Provider>
  );
}

export function useActivityStatus() {
  const context = useContext(ActivityStatusContext);
  if (context === undefined) {
    throw new Error('useActivityStatus must be used within an ActivityStatusProvider');
  }
  return context;
} 