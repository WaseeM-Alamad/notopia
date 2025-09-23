import { useAppContext } from "@/context/AppContext";
import React from "react";

const NoteLabels = ({ note, noteActions }) => {
  const { labelsRef, closeToolTip, showTooltip, hideTooltip } = useAppContext();

  const handleLabelClick = (e, label) => {
    e.stopPropagation();
    const encodedLabel = encodeURIComponent(label);
    window.location.hash = `label/${encodedLabel.toLowerCase()}`;
  };

  const removeLabel = async (labelUUID) => {
    noteActions({
      type: "REMOVE_LABEL",
      note: note,
      labelUUID: labelUUID,
    });
  };

  return (
    <>
      {note?.labels
        .sort((a, b) => {
          const labelsMap = labelsRef.current;
          const labelA = labelsMap.get(a)?.label || "";
          const labelB = labelsMap.get(b)?.label || "";
          return labelA.localeCompare(labelB);
        })
        .map((labelUUID, index) => {
          if (index + 1 >= 3 && note?.labels.length > 3) return;
          const label = labelsRef.current.get(labelUUID)?.label;
          return (
            <div
              onClick={(e) => handleLabelClick(e, label)}
              key={labelUUID}
              className={["label-wrapper", !note?.isTrash && "label-wrapper-h"]
                .filter(Boolean)
                .join(" ")}
            >
              <label className="note-label">{label}</label>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  closeToolTip();
                  removeLabel(labelUUID);
                }}
                onMouseEnter={(e) => showTooltip(e, "Remove label")}
                onMouseLeave={hideTooltip}
                className="remove-label"
              />
            </div>
          );
        })}
      {note?.labels.length > 3 && (
        <div className="more-labels">
          <label className="more-labels-label">
            +{note?.labels.length - 2}
          </label>
        </div>
      )}
    </>
  );
};

export default NoteLabels;
