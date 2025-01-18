import { createContext, useContext, useState, ReactNode } from 'react';

interface ActivityStatusContextType {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

const ActivityStatusContext = createContext<ActivityStatusContextType | undefined>(undefined);

export function ActivityStatusProvider({ children }: { children: ReactNode }) {
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