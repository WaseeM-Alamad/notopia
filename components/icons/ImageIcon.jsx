import React, { memo } from "react";

const ImageIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M8 12.72L11 9L15 14H3L6 10L8 12.72Z"
        fill="#212121"
        fillOpacity="0.9"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 0H16C17.1 0 18 0.9 18 2V16C18 17.1 17.1 18 16 18H2C0.9 18 0 17.1 0 16V2C0 0.9 0.9 0 2 0ZM16 15.5683C15.8976 15.7481 15.7481 15.8976 15.5683 16H2.43171C2.2519 15.8976 2.1024 15.7481 2 15.5683V2.43171C2.1024 2.2519 2.2519 2.1024 2.43171 2H15.5683C15.7481 2.1024 15.8976 2.2519 16 2.43171V15.5683Z"
        fill="#212121"
        fillOpacity="0.9"
      />
    </svg>
  );
};

export default memo(ImageIcon);
