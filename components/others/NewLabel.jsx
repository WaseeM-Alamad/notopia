import React, { memo, useRef } from "react";
import PlusIcon from "../icons/PlusIcon";
import { useAppContext } from "@/context/AppContext";
import { v4 as uuid } from "uuid";

const NewLabel = ({ triggerReRender }) => {
  const { createLabel, labelsRef } = useAppContext();

  const handleCreateLabel = () => {
    const newUUID = uuid();
    let newLabel = "New label";
    [...labelsRef.current].map(([uuid, labelData]) => {
      const existingLabel = labelData.label.toLowerCase();

      if (
        existingLabel.replace(/\d+/g, "").trim().toLowerCase() === "new label"
      ) {
        const num = existingLabel.match(/\d+/)?.[0];
        if (num !== undefined) {
          newLabel = `New label ${parseInt(num, 10) + 1}`;
        } else {
          newLabel = `New label 2`;
        }
      }
    });

    const createdAt = new Date();
    createLabel(newUUID, newLabel, createdAt);
    triggerReRender((prev) => !prev);
  };

  return (
    <div onClick={handleCreateLabel} className="new-label">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.2rem",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          //   outline: "solid",
          width: "calc(100% - 50px)",
          fontWeight: "500",
          height: "calc(100% - 50px)",
        }}
      >
        <PlusIcon />
        <div>New label</div>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 124">
        <rect
          className="dashed-border"
          x="4"
          y="4"
          width="232"
          height="116"
          rx="20"
          ry="20"
          fill="none"
          stroke="#7B7B7B"
          strokeWidth="4"
          strokeDasharray="20,10"
        >
          {/* Define the animation in CSS */}
          <style>
            {`
          @keyframes dash {
            to {
              stroke-dashoffset: -30;
            }
          }
        `}
          </style>
        </rect>
      </svg>
    </div>
  );
};

export default memo(NewLabel);
