import { useAppContext } from "@/context/AppContext";
import React, { memo } from "react";

const ColorFilterItem = ({ color, onClick }) => {
  const { showTooltip, hideTooltip } = useAppContext();

  return (
    <div
      onClick={() => onClick(color)}
      onMouseEnter={(e) => showTooltip(e, color)}
      onMouseLeave={hideTooltip}
      onFocus={(e) => showTooltip(e, color)}
      onBlur={hideTooltip}
      className={`filter-color-container ${color}`}
    />
  );
};

export default memo(ColorFilterItem);
