import React, { memo } from "react";

const CheckMark = ({ size = "15", style, color = "Default" }) => {
  return (
    <svg
      style={{ ...style, borderRadius: "50%" }}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 55 55"
      className={color}
      fill="none"
    >
      <circle cx="25.5" cy="25.5" r="25.5" className="checkmark-circle" />
      <path
        style={{ transition: "all 0.3s ease" }}
        d="M40.6563 17.8321L38.1679 15.3437C37.7084 14.8854 36.9668 14.8854 36.5085 15.3437L21.5883 30.2639L14.4915 23.1157C14.0332 22.6574 13.2916 22.6574 12.8321 23.1157L10.3437 25.6042C9.88543 26.0636 9.88543 26.8052 10.3437 27.2635L20.7499 37.7397C21.2082 38.198 21.951 38.198 22.4093 37.7397L40.6563 19.4915C41.1146 19.0344 41.1146 18.2904 40.6563 17.8321Z"
        fill="var(--c)"
      />
    </svg>
  );
};

export default memo(CheckMark);
