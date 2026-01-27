import React, { memo } from "react";

const TypeFilterItem = ({ isImages, onClick }) => {
  const iconClass = isImages ? "image" : "";
  const title = isImages ? "Images" : "";

  return (
    <div onClick={() => onClick("Images")} className="filter-type-container">
      <div className={`filter-${iconClass}-icon`} />
      <div
        style={{
          color: "var(--bw)",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: "0",
          width: "100%",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {title}
      </div>
    </div>
  );
};

export default memo(TypeFilterItem);
