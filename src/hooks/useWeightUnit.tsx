import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type WeightUnit = 'kg' | 'lbs';

interface WeightUnitContextType {
  unit: WeightUnit;
  setUnit: (unit: WeightUnit) => void;
  convertWeight: (weightInLbs: number) => number;
  convertToLbs: (weightInUserUnit: number) => number;
  formatWeight: (weightInLbs: number) => string;
}

const WeightUnitContext = createContext<WeightUnitContextType | undefined>(undefined);

const LBS_TO_KG = 0.453592;
const KG_TO_LBS = 2.20462;

export function WeightUnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<WeightUnit>(() => {
    const saved = localStorage.getItem('weightUnit');
    return (saved as WeightUnit) || 'lbs';
  });

  const setUnit = (newUnit: WeightUnit) => {
    setUnitState(newUnit);
    localStorage.setItem('weightUnit', newUnit);
  };

  // Convert from lbs (stored in DB) to user's preferred unit for display
  const convertWeight = (weightInLbs: number): number => {
    if (unit === 'kg') {
      return Math.round(weightInLbs * LBS_TO_KG * 10) / 10;
    }
    return weightInLbs;
  };

  // Convert from user's preferred unit to lbs for storage
  const convertToLbs = (weightInUserUnit: number): number => {
    if (unit === 'kg') {
      return Math.round(weightInUserUnit * KG_TO_LBS * 10) / 10;
    }
    return weightInUserUnit;
  };

  const formatWeight = (weightInLbs: number): string => {
    const converted = convertWeight(weightInLbs);
    return `${converted}${unit}`;
  };

  return (
    <WeightUnitContext.Provider value={{ unit, setUnit, convertWeight, convertToLbs, formatWeight }}>
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
