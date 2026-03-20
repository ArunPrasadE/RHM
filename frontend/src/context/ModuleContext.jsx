import { createContext, useContext, useState, useEffect } from 'react';

const ModuleContext = createContext();

export const MODULES = {
  RENTAL: 'rental',
  PADDY: 'paddy',
  COCONUT: 'coconut'
};

export const MODULE_INFO = {
  [MODULES.RENTAL]: {
    name: 'Rental Houses',
    nameTamil: 'வாடகை வீடுகள்',
    description: 'Manage rental houses, tenants, payments and expenses',
    icon: 'house',
    color: 'blue',
    path: '/rental'
  },
  [MODULES.PADDY]: {
    name: 'Paddy Fields',
    nameTamil: 'நெல் வயல்கள்',
    description: 'Manage paddy fields, workers, expenses and income',
    icon: 'paddy',
    color: 'green',
    path: '/paddy'
  },
  [MODULES.COCONUT]: {
    name: 'Coconut Groves',
    nameTamil: 'தென்னந்தோப்புகள்',
    description: 'Manage coconut groves, workers, expenses and income',
    icon: 'coconut',
    color: 'amber',
    path: '/coconut'
  }
};

export function ModuleProvider({ children }) {
  const [currentModule, setCurrentModule] = useState(() => {
    const saved = localStorage.getItem('currentModule');
    return saved && Object.values(MODULES).includes(saved) ? saved : null;
  });

  useEffect(() => {
    if (currentModule) {
      localStorage.setItem('currentModule', currentModule);
    }
  }, [currentModule]);

  const switchModule = (module) => {
    if (Object.values(MODULES).includes(module)) {
      setCurrentModule(module);
    }
  };

  const clearModule = () => {
    setCurrentModule(null);
    localStorage.removeItem('currentModule');
  };

  const getModuleInfo = (module) => {
    return MODULE_INFO[module] || null;
  };

  return (
    <ModuleContext.Provider value={{
      currentModule,
      switchModule,
      clearModule,
      getModuleInfo,
      MODULES,
      MODULE_INFO
    }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModule must be used within a ModuleProvider');
  }
  return context;
}
