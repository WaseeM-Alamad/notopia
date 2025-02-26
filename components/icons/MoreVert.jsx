import React, { memo } from "react";

const MoreVert = ({ style }) => {
  return (
    <svg
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      width="5"
      height="15"
      viewBox="0 0 5 19"
      fill="none"
    >
      <path
        d="M5 2.5C5 3.88074 3.88074 5 2.5 5C1.11926 5 0 3.88074 0 2.5C0 1.11926 1.11926 0 2.5 0C3.88074 0 5 1.11926 5 2.5Z"
        className="fill"
        fillOpacity="0.9"
      />
      <path
        d="M5 16.5C5 17.8807 3.88074 19 2.5 19C1.11926 19 0 17.8807 0 16.5C0 15.1193 1.11926 14 2.5 14C3.88074 14 5 15.1193 5 16.5Z"
        className="fill"
        fillOpacity="0.9"
      />
      <path
        d="M2.5 12C3.88074 12 5 10.8807 5 9.5C5 8.11926 3.88074 7 2.5 7C1.11926 7 0 8.11926 0 9.5C0 10.8807 1.11926 12 2.5 12Z"
        className="fill"
        fillOpacity="0.9"
      />
    </svg>
  );
};

export default memo(MoreVert);
