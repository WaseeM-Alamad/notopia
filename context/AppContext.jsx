"use client";

import { useSession } from "next-auth/react";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";
import { fetchLabelsAction, createLabelAction, updateLabelColorAction, updateLabelAction } from "@/utils/actions";

const AppContext = createContext();

export function AppProvider({ children }) {
  const labelsRef = useRef(new Map());

  const getLabels = async () => {
    const fetchedLables = await fetchLabelsAction();
    if (!fetchedLables.success) return;
    labelsRef.current = new Map(
      fetchedLables.data.map((mapLabel) => [mapLabel.uuid, mapLabel])
    );
  };

  useEffect(() => {
    getLabels();
  }, []);

  const createLabel = async (uuid, label, createdAt) => {
    labelsRef.current.set(uuid, {
      uuid: uuid,
      label: label,
      createdAt: createdAt,
      color: "rgba(255, 255, 255, 1)",
    });
    window.dispatchEvent(new Event("loadingStart"));
    await createLabelAction(uuid, label);
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const updateLabelColor = async (uuid, newColor) => {
    const newLabel = { ...labelsRef.current.get(uuid), color: newColor };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelColorAction({uuid: uuid, color: newColor});
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const updateLabel = async (uuid, updatedLabel) => {
    const newLabel = { ...labelsRef.current.get(uuid), label: updatedLabel };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({uuid: uuid, label: updatedLabel});
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
        updateLabelColor,
        labelsRef,
        updateLabel,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
