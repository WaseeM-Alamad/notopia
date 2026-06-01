import React, { memo } from "react";

const ColorFilterItem = ({ color, onClick }) => {
  return (
    <div
      onClick={() => onClick(color)}
      data-tooltip={color}
      className={`filter-color-container ${color}`}
    />
  );
};

export default memo(ColorFilterItem);
