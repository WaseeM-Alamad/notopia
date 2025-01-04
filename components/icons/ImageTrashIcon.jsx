import React from "react";

const ImageTrashIcon = ({ size }) => {
  return (
    <svg
      className="delete-icon"
      style={{ margin: "auto" }}
      xmlns="http://www.w3.org/2000/svg"
      height={size}
      width={size}
      viewBox="0 0 48 48"
      fill="#FFFFFF"
    >
      <path d="m12 38c0 2.21 1.79 4 4 4h16c2.21 0 4-1.79 4-4v-24h-24v24zm26-30h-7l-2-2h-10l-2 2h-7v4h28v-4z" />
      <path d="m0 0h48v48h-48z" fill="none" />
    </svg>
  );
};

export default ImageTrashIcon;
