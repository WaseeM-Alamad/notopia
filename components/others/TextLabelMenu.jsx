import { useAppContext } from "@/context/AppContext";
import { Popper } from "@mui/material";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { v4 as generateUUID } from "uuid";

const TextLabelMenu = ({ anchor, setAnchor, labelSearch, setLabelSearch }) => {
  const { labelsRef } = useAppContext();
  const [isClient, setIsClient] = useState();
  const allLabelsMatchSearch = [...labelsRef.current].every(
    ([uuid, labelData]) =>
      labelData.label.toLowerCase() !== labelSearch.toLowerCase()
  );

  useEffect(() => {
    setIsClient(true);
    const handler = () => {
      setAnchor(null);
    };

    window.addEventListener("resize", handler);
    window.addEventListener("contextmenu", handler);
    window.addEventListener("mousedown", handler);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("contextmenu", handler);
      window.removeEventListener("mousedown", handler);
    };
  }, []);

  const handleCreateLabel = () => {
    const newUUID = generateUUID();
    const label = labelSearch;
    const createdAt = new Date();
    createLabel(newUUID, label, createdAt);
    setLabelSearch("");
    addLabel(newUUID);
  };

  if (!isClient) return;

  return createPortal(
    <Popper
      open={true}
      anchorEl={anchor}
      style={{ zIndex: "999" }}
      placement="bottom-start"
      modifiers={[
        {
          name: "preventOverflow",
          options: {
            boundariesElement: "window",
          },
        },
        {
          name: "offset",
          options: {
            offset: [0, 36], // [skidding, distance], 6px down
          },
        },
      ]}
    >
      <motion.div
        initial={{ opacity: 0, transform: "scale(0.97)" }}
        animate={{ opacity: 1, transform: "scale(1)" }}
        exit={{ opacity: 0, transform: "scale(0.97)" }}
        transition={{
          transform: {
            type: "spring",
            stiffness: 1100,
            damping: 50,
            mass: 1,
          },
          opacity: { duration: 0.15 },
        }}
        // ref={menuRef}
        // onClick={containerClick}
        style={{
          transformOrigin: "top left",
          paddingBottom: "0",
          zIndex: "311",
          borderRadius: "0.4rem",
          //   pointerEvents: !isOpen && "none",
        }}
        className="menu not-draggable menu-border"
      >
        <div style={{ width: "14.0625rem" }}>
          {/* <div className="label-note">Label note</div>
          <div
            style={{
              padding: "0.55rem 0.8rem 0.8rem 0.8rem",
              fontSize: "0.9rem",
              position: "relative",
              boxSizing: "border-box",
            }}
          >
            <div className="search-icon" />
            <input
              ref={labelinputRef}
              onKeyDown={handleInputKeyDown}
              onChange={handleLabelInputChange}
              className="label-input"
              type="text"
              maxLength="50"
              placeholder="Enter label name"
            />
          </div> */}
          <div
            className="label-items-container"
            style={{ paddingBottom: "6px" }}
          >
            {/* style={{paddingBottom: "0.55rem"}} */}
            {[...labelsRef.current]
              .reverse()
              .map(([uuid, labelData], index) => {
                if (
                  !labelData.label
                    .toLowerCase()
                    .includes(labelSearch.toLowerCase())
                )
                  return;
                return (
                  <div
                    key={index}
                    // onClick={() => addLabel(uuid)}
                    className="checkbox-wrapper"
                    style={{
                      wordBreak: "break-all",
                    }}
                    tabIndex="1"
                  >
                    <div className={`checkbox-unchecked`} />
                    <div
                      dir="auto"
                      style={{ width: "100%", paddingLeft: "0.5rem" }}
                    >
                      {labelData.label}
                    </div>
                  </div>
                );
              })}
          </div>
          {labelSearch && allLabelsMatchSearch && (
            <div tabIndex="1" onClick={() => {}} className="create-label">
              <div
                className="create-icon"
                // style={{ position: "absolute", bottom: "1px" }}
              />
              <div className="create-label-box">
                Create
                <span
                  dir="auto"
                  style={{
                    color: "#00000",
                    fontWeight: "bold",
                    wordBreak: "break-all",
                  }}
                >
                  {` "${labelSearch}"`}
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </Popper>,
    document.getElementById("menu")
  );
};

export default TextLabelMenu;
