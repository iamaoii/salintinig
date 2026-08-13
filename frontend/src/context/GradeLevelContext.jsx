import { createContext, useContext, useState, useEffect } from 'react';
import { getToken } from '../lib/auth.js';

const GradeLevelContext = createContext(null);

export function GradeLevelProvider({ children }) {
  const [isFic, setIsFic] = useState(false);
  const [ficGradeLevel, setFicGradeLevel] = useState(null);
  const [isGradeLevelMode, setIsGradeLevelMode] = useState(false);

  useEffect(() => {
    async function checkFicStatus() {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          setIsFic(data.user.isFacultyInCharge === true);
          setFicGradeLevel(data.user.ficGradeLevel || null);
        }
      } catch (e) {
        console.warn('GradeLevelContext fetch notice:', e);
      }
    }
    checkFicStatus();
  }, []);

  const enterGradeLevelMode = () => {
    if (isFic && ficGradeLevel) setIsGradeLevelMode(true);
  };

  const exitGradeLevelMode = () => {
    setIsGradeLevelMode(false);
  };

  return (
    <GradeLevelContext.Provider
      value={{ isFic, ficGradeLevel, isGradeLevelMode, enterGradeLevelMode, exitGradeLevelMode }}
    >
      {children}
    </GradeLevelContext.Provider>
  );
}

export function useGradeLevel() {
  const ctx = useContext(GradeLevelContext);
  if (!ctx) throw new Error('useGradeLevel must be used within GradeLevelProvider');
  return ctx;
}
