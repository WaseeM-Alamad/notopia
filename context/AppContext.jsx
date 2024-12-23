"use client";

import { useSession } from "next-auth/react";
import React, { createContext, useState, useContext, useEffect, useRef } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const slotProps = {
    popper: {
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, -11],
          },
        },
      ],
    },
    tooltip: {
      sx: {
        height: "fit-content",
        margin: "0",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        fontFamily: "Roboto",
        fontWeight: "400",
        fontSize: "0.76rem",
        padding: "5px 8px 5px 8px",
      },
    },
  };

  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  })
  const [user, setUser] = useState(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      setUser(session.user);
    }
  }, [session]);

  return (
    <AppContext.Provider
      value={{
        slotProps,
        user,
        session,
        status,
        modalPosition,
        setModalPosition,
        modalOpen,
        setModalOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
