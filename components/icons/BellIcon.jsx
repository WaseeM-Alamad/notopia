import React, { memo } from "react";

const BellIcon = ({ size = 25, color = "#535353" }) => {
  return (
    <svg
      style={{ zIndex: "10" }}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 26 32"
      fill="#212121"
    >
      <path
      style={{transition: "fill 0.2s ease"}}
        d="M22.75 23.5625V13.8125C22.75 8.82375 20.1012 4.6475 15.4375 3.5425V2.4375C15.4375 1.08875 14.3488 0 13 0C11.6512 0 10.5625 1.08875 10.5625 2.4375V3.5425C5.915 4.6475 3.25 8.8075 3.25 13.8125V23.5625H0V26.8125H26V23.5625H22.75ZM19.5 23.5625H6.5V13.8125C6.5 9.7825 8.95375 6.5 13 6.5C17.0462 6.5 19.5 9.7825 19.5 13.8125V23.5625ZM13 31.6875C14.7875 31.6875 16.25 30.225 16.25 28.4375H9.75C9.75 30.225 11.2125 31.6875 13 31.6875Z"
        fill={color}
      />
    </svg>
  );
};

export default memo (BellIcon);
