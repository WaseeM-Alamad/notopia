import { useLabelsContext } from "@/context/LabelsContext";
import React, { memo } from "react";

const LabelFilterItem = ({ labelUUID, onClick }) => {
  const { labelsRef } = useLabelsContext();

  const labelData = labelsRef.current.get(labelUUID);
  const color = labelData?.color;

  return (
    <div
      onClick={() => onClick(labelUUID)}
      className={`filter-label-container ${labelData?.color}`}
    >
      <div className="filter-label-icon" />
      <div
        style={{
          color: "var(--text2)",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: "0",
          width: "100%",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {labelData?.label}
      </div>
    </div>
  );
};

export default memo(LabelFilterItem);
