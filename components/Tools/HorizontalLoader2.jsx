import React from "react";

const HorizontalLoader2 = ({ size, style }) => {
  return (
    <div
      className="loading-dots"
      style={{ transform: `scale(${size})`, ...style }}
    >
      <div className="loading-dots--dot"></div>
      <div className="loading-dots--dot"></div>
      <div className="loading-dots--dot"></div>
    </div>
  );
};

export default HorizontalLoader2;
