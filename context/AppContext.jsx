'use client'

import React, { createContext, useState, useContext } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadTrigger, setLoadTrigger] = useState(false);

  return (
    <AppContext.Provider value={{ isLoading, setIsLoading, loadTrigger, setLoadTrigger }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)

