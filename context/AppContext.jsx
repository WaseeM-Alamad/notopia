"use client";

import { useSession } from "next-auth/react";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { fetchLabelsAction, createLabelAction } from "@/utils/actions";

const AppContext = createContext();

export function AppProvider({ children }) {
  const labelsRef = useRef(new Map());

  const getLabels = async () => {
    const fetchedLables = await fetchLabelsAction();
    if (!fetchedLables.success) return;
    labelsRef.current = new Map(
      fetchedLables.data.map((mapLabel) => [mapLabel.uuid, mapLabel.label])
    );
  };

  useEffect(() => {
    getLabels();
  }, []);

  const createLabel = async (uuid, label) => {
    labelsRef.current.set(uuid, label);
    window.dispatchEvent(new Event("loadingStart"));
    await createLabelAction(uuid, label);
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const removeLabel = (uuid) => {
    labelsRef.current.delete(uuid);
  };

  return (
    <AppContext.Provider
      value={{
        createLabel,
        removeLabel,
        labelsRef,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
