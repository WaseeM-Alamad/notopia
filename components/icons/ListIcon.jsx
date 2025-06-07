import React, { memo } from "react";

const ListIcon = () => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 11H16C16.5523 11 17 11.4477 17 12V16C17 16.5523 16.5523 17 16 17H2C1.44772 17 1 16.5523 1 16V12C1 11.4477 1.44772 11 2 11ZM2 1H16C16.5523 1 17 1.44772 17 2V6C17 6.55228 16.5523 7 16 7H2C1.44772 7 1 6.55228 1 6V2C1 1.44772 1.44772 1 2 1Z"
        className="layout-icon"
        strokeWidth="2"
      />
    </svg>
  );
};

export default memo(ListIcon);
