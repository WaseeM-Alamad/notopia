"use client";

import { useSession } from "next-auth/react";
import React, { createContext, useContext, useEffect, useRef } from "react";
import {
  fetchLabelsAction,
  createLabelAction,
  updateLabelAction,
} from "@/utils/actions";
import { createClient } from "@supabase/supabase-js";

const AppContext = createContext();

export function AppProvider({ children }) {
  const { data: session } = useSession();
  const userID = session?.user?.id;

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
    await updateLabelAction({ type: "color", uuid: uuid, color: newColor });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const updateLabel = async (uuid, updatedLabel) => {
    const newLabel = { ...labelsRef.current.get(uuid), label: updatedLabel };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({ type: "title", uuid: uuid, label: updatedLabel });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const updateLabelImage = async (uuid, imageFile) => {
    const starter =
      "https://fopkycgspstkfctmhyyq.supabase.co/storage/v1/object/public/notopia";
    const imageURL = `${starter}/${userID}/labels/${uuid}`;
    const localImageURL = URL.createObjectURL(imageFile);
    const newLabel = { ...labelsRef.current.get(uuid), image: localImageURL };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({ type: "image", uuid: uuid, imageURL: imageURL });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
      const bucketName = "notopia";

      const filePath = `${userID}/labels/${uuid}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, imageFile, {
          cacheControl: "0",
          upsert: true,
        });

      if (error) {
        console.error("Error uploading file:", error);
      }
    } catch (error) {
      console.log("couldn't upload images", error);
    } finally {
      window.dispatchEvent(new Event("loadingEnd"));
    }
  };


  const deleteLabelImage = async (uuid)=> {
    const newLabel = {...labelsRef.current.get(uuid), image: null};
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({ type: "delete_image", uuid: uuid});
    window.dispatchEvent(new Event("loadingEnd"));
  }

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
        updateLabelImage,
        deleteLabelImage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
