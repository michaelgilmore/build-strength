import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type WeightUnit = 'kg' | 'lbs';

interface WeightUnitContextType {
  unit: WeightUnit;
  setUnit: (unit: WeightUnit) => void;
  convertWeight: (weightInKg: number) => number;
  formatWeight: (weightInKg: number) => string;
}

const WeightUnitContext = createContext<WeightUnitContextType | undefined>(undefined);

const KG_TO_LBS = 2.20462;

export function WeightUnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<WeightUnit>(() => {
    const saved = localStorage.getItem('weightUnit');
    return (saved as WeightUnit) || 'kg';
  });

  const setUnit = (newUnit: WeightUnit) => {
    setUnitState(newUnit);
    localStorage.setItem('weightUnit', newUnit);
  };

  const convertWeight = (weightInKg: number): number => {
    if (unit === 'lbs') {
      return Math.round(weightInKg * KG_TO_LBS * 10) / 10;
    }
    return weightInKg;
  };

  const formatWeight = (weightInKg: number): string => {
    const converted = convertWeight(weightInKg);
    return `${converted}${unit}`;
  };

  return (
    <WeightUnitContext.Provider value={{ unit, setUnit, convertWeight, formatWeight }}>
      {children}
    </WeightUnitContext.Provider>
  );
}

export function useWeightUnit() {
  const context = useContext(WeightUnitContext);
  if (context === undefined) {
    throw new Error('useWeightUnit must be used within a WeightUnitProvider');
  }
  return context;
}
