import React from "react";

const CollabFilterItem = ({ data, onClick }) => {
  const displayName = data.displayName;
  const image = data.image;
  const username = data.username;

  return (
    <div onClick={() => onClick(username)} className="filter-collab-item">
      <img
        draggable="false"
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          objectFit: "cover",
          border: "1px solid var(--border)",
        }}
        src={image}
      />
      <div
        style={{
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: "0",
          width: "100%",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {displayName}
      </div>
    </div>
  );
};

export default CollabFilterItem;
