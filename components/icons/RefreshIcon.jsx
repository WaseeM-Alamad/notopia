import React, { memo } from "react";

const RefreshIcon = ({ style }) => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 7.875H10.1201L13.75 4.24707C12.5287 3.02651 10.8571 2.25 8.99414 2.25C5.26255 2.25012 2.24023 5.27069 2.24023 9C2.24023 12.7293 5.26255 15.7499 8.99414 15.75C11.9378 15.75 14.4258 13.8712 15.3545 11.25H17.6963C16.7 15.1312 13.1874 18 8.99414 18C4.01865 17.9999 0 13.9724 0 9C0 4.02757 4.01865 0.000118364 8.99414 0C11.4819 0 13.7278 1.0124 15.3545 2.64355L18 0V7.875Z"
        className="refresh-icon"
      />
    </svg>
  );
};

export default memo(RefreshIcon);
