"use client";

import { useSession } from "next-auth/react";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  fetchLabelsAction,
  createLabelAction,
  updateLabelAction,
  deleteLabelAction,
  editLabelCountAction,
} from "@/utils/actions";
import { createClient } from "@supabase/supabase-js";

const AppContext = createContext();

export function AppProvider({ children }) {
  const { data: session, status } = useSession();
  const [labelsReady, setLabelsReady] = useState(false);
  const userID = session?.user?.id;

  const labelsRef = useRef(new Map());
  const labelLookUPRef = useRef(new Map());
  const ignoreKeysRef = useRef(null);

  const getLabels = async () => {
    const fetchedLables = await fetchLabelsAction();
    if (!fetchedLables.success || !fetchedLables) return;
    labelsRef.current = new Map(
      fetchedLables.data.map((mapLabel) => {
        labelLookUPRef.current.set(mapLabel.label.toLowerCase(), true);
        return [mapLabel.uuid, mapLabel];
      })
    );
    setLabelsReady(true);
  };

  useEffect(() => {
    window.addEventListener("loadLabels", getLabels);
    return () => window.removeEventListener("loadLabels", getLabels);
  }, []);

  const createLabel = async (uuid, label, createdAt) => {
    labelLookUPRef.current.set(label.toLowerCase(), true);
    labelsRef.current.set(uuid, {
      uuid: uuid,
      label: label,
      createdAt: createdAt,
      color: "Default",
    });
    window.dispatchEvent(new Event("loadingStart"));
    await createLabelAction(uuid, label);
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const createLabelForNotes = async (data) => {
    const updatedLabels = new Map(labelsRef.current);
    labelLookUPRef.current.set(data.label.toLowerCase(), true);
    updatedLabels.set(data.labelUUID, {
      uuid: data.labelUUID,
      label: data.label,
      noteCount: data.count,
      createdAt: new Date(),
      color: "Default",
    });

    labelsRef.current = updatedLabels;
  };

  const updateLabelColor = async (uuid, newColor) => {
    const newLabel = { ...labelsRef.current.get(uuid), color: newColor };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({ type: "color", uuid: uuid, color: newColor });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const updateLabel = async (uuid, updatedLabel, oldLabel) => {
    labelLookUPRef.current.delete(oldLabel.toLowerCase().trim());
    labelLookUPRef.current.set(updatedLabel.toLowerCase().trim(), true);
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

  const deleteLabelImage = async (data) => {
    if (data.action === "delete") {
      const newLabel = { ...labelsRef.current.get(data.uuid), image: null };
      const labels = new Map(labelsRef.current).set(data.uuid, newLabel);
      labelsRef.current = labels;
      window.dispatchEvent(new Event("loadingStart"));
      await updateLabelAction({ type: "delete_image", uuid: data.uuid });
      window.dispatchEvent(new Event("loadingEnd"));
    } else if (data.action === "remove") {
      const newLabel = { ...labelsRef.current.get(data.uuid), image: null };
      const labels = new Map(labelsRef.current).set(data.uuid, newLabel);
      labelsRef.current = labels;
    } else if (data.action === "restore") {
      const newLabel = {
        ...labelsRef.current.get(data.uuid),
        image: data.image,
      };
      const labels = new Map(labelsRef.current).set(data.uuid, newLabel);
      labelsRef.current = labels;
    }
  };

  const handleLabelNoteCount = async (uuid, type = "increment") => {
    const currentLabel = labelsRef.current.get(uuid);
    const newLabel = {
      ...currentLabel,
      noteCount:
        type === "decrement"
          ? currentLabel?.noteCount
            ? currentLabel.noteCount - 1
            : 0
          : (currentLabel?.noteCount || 0) + 1,
    };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({
      type: "note_count",
      uuid: uuid,
      operation: type,
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const batchNoteCount = (labelsUUIDs, operation = "dec") => {
    const updatedLabels = new Map(labelsRef.current);

    const calcCount = (noteCount) => {
      switch (operation) {
        case "dec": {
          return Math.max(0, noteCount - 1);
        }
        case "inc": {
          return Math.max(0, noteCount + 1);
        }
      }
    };

    labelsUUIDs.forEach((labelUUID) => {
      const label = updatedLabels.get(labelUUID);
      updatedLabels.set(labelUUID, {
        ...label,
        noteCount: calcCount(label.noteCount),
      });
    });

    labelsRef.current = updatedLabels;
  };

  const handleLabelsTop = async (data) => {
    const updatedLabels = new Map(labelsRef.current);
    const targetedLabel = updatedLabels.get(data.uuid);
    const noteCount = targetedLabel.noteCount;

    if (data.case === "shared") {
      const countOp = Math.max(
        0,
        data.operation === "dec"
          ? noteCount - data.count
          : noteCount + data.count
      );

      updatedLabels.set(data.uuid, {
        ...targetedLabel,
        noteCount: countOp,
      });
    } else {
      const countOp = Math.max(0, noteCount + data.count);

      updatedLabels.set(data.uuid, {
        ...targetedLabel,
        noteCount: countOp,
      });
    }

    labelsRef.current = updatedLabels;

    window.dispatchEvent(new Event("loadingStart"));
    await editLabelCountAction({
      operation: data.operation,
      case: data.case,
      notesUUIDs: data.notesUUIDs,
      labelUUID: data.uuid,
      count: data.count,
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const removeLabel = (uuid, label) => {
    labelsRef.current.delete(uuid);
    labelLookUPRef.current.delete(label.toLowerCase().trim());
  };


  const handlePin = async (uuid) => {
    const currentLabel = labelsRef.current.get(uuid);
    const value = !currentLabel.isPinned;
    const newLabel = {
      ...currentLabel,
      isPinned: value,
    };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({
      type: "label_pin",
      uuid: uuid,
      value: value,
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  return (
    <AppContext.Provider
      value={{
        labelsReady,
        createLabel,
        createLabelForNotes,
        removeLabel,
        updateLabelColor,
        labelsRef,
        updateLabel,
        updateLabelImage,
        deleteLabelImage,
        handleLabelNoteCount,
        labelLookUPRef,
        batchNoteCount,
        handleLabelsTop,
        ignoreKeysRef,
        handlePin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
