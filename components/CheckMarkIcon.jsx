import { Tooltip } from "@mui/material";
import React from "react";

const CheckMarkIcon = ({ style, color, onClick, checkRef, checkSelect }) => {
  return (
    <Tooltip
    PopperProps={{
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, 0],
          },
        },
      ],
    }}
    slotProps={{
      tooltip: {
        sx: {
          height: "fit-content",
          margin: "0",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          fontFamily: "Roboto",
          fontWeight: "400",
          fontSize: "0.76rem",
          padding: "5px 8px 5px 8px"
          
          
        },
      },
    }}
      title={checkSelect ? "Deselect note" : "Select note"}
    >
      <div ref={checkRef} onClick={onClick} style={style}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="12" fill="black" />
          <path
            style={{ transition: "stroke 0.2s ease-in" }}
            d="M7 12.5L10.5 16L17.5 9"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="square"
          />
        </svg>
      </div>
    </Tooltip>
  );
};

export default CheckMarkIcon;
