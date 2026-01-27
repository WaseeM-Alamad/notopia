import React, { memo } from "react";

const TypeFilterItem = ({ onClick, isImages, isLists }) => {
  const iconClass = isImages ? "image" : isLists ? "lists" : "";
  const title = isImages ? "Images" : isLists ? "Lists" : "";

  return (
    <div onClick={() => onClick(title)} className="filter-type-container">
      <div className={`filter-type-icon filter-${iconClass}-icon`} />
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
