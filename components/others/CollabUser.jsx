import React, { memo } from "react";

const CollabUser = ({ displayName, username, image, isOwner = false }) => {
  return (
    <div className="collab-user">
      <div
        className="collab-user-img"
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      />
      <div style={{ fontSize: "0.9rem" }}>
        <div style={{ fontWeight: "600" }}>
          {displayName}{" "}
          {isOwner && (
            <span
              style={{
                fontStyle: "italic",
                fontSize: "0.8rem",
                fontWeight: "400",
              }}
            >
              (Owner)
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            letterSpacing: ".02rem",
            color: "rgb(83, 83, 83)",
          }}
        >
          {username}
        </div>
      </div>
    </div>
  );
};

export default memo(CollabUser);
