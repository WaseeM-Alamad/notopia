import React, { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useLabelsContext } from "@/context/LabelsContext";
import { useGlobalContext } from "@/context/GlobalContext";

const SetLabelModal = ({
  showCloseBtn = false,
  isOpen,
  setIsOpen,
  labelObj,
}) => {
  const {
    hideTooltip,
    showTooltip,
    skipLabelObjRefresh,
    isActionModalOpenRef,
  } = useAppContext();
  const { lockScroll } = useGlobalContext();
  const [isMounted, setIsMounted] = useState(false);
  const [label, setLabel] = useState(labelObj?.label);
  const [error, setError] = useState("");
  const { updateLabel, labelsRef } = useLabelsContext();
  const initialLabel = labelObj?.label;
  const noChange = initialLabel.trim() === label.trim();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    lockScroll(isOpen);

    return () => lockScroll(false);
  }, [isOpen]);

  const checkExistence = () => {
    for (const labelData of labelsRef.current.values()) {
      if (
        label.toLowerCase().trim() === labelData.label.toLowerCase().trim() &&
        labelData.uuid !== labelObj.uuid
      ) {
        return true;
      }
    }
    return false;
  };

  const updateHash = () => {
    skipLabelObjRefresh.current = true;
    const encodedLabel = encodeURIComponent(label.trim());
    window.location.hash = `label/${encodedLabel}`;
    window.dispatchEvent(new Event("refreshPinnedLabels"));
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    isActionModalOpenRef.current = true;
    return () => (isActionModalOpenRef.current = false);
  }, []);

  if (!isMounted) return;

  return createPortal(
    <>
      <motion.div
        className="overlay"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
          pointerEvents: "none",
          display: "none",
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 50,
          mass: 1,
        }}
        onClick={() => setIsOpen(false)}
      />
      <motion.div
        className="action-modal"
        initial={{
          transform: "translate(-50%, -40%) scale(0.97)",
          opacity: 0,
        }}
        animate={{
          transform: "translate(-50%, -40%) scale(1)",
          opacity: 1,
        }}
        exit={{
          transform: "translate(-50%, -40%) scale(0.97)",
          opacity: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 40,
          mass: 1.05,
        }}
        style={{
          padding: "1.3rem 1.3rem",
          maxWidth: "400px",
        }}
      >
        {showCloseBtn && (
          <div
            style={{ top: ".5rem", right: "0.7rem" }}
            onMouseEnter={(e) => showTooltip(e, "Close")}
            onMouseLeave={hideTooltip}
            className="clear-icon btn small-btn"
          />
        )}
        <div
          className="action-title"
          style={{
            marginBottom: ".7rem",
            userSelect: "none",
            textAlign: "left",
          }}
        >
          Edit label
        </div>
        <div
          className="action-msg"
          style={{
            textAlign: "left",
            marginBottom: "1.5rem",
            marginTop: ".9rem",
          }}
        >
          Update your unique label. Changes will be applied to all notes with
          this label
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const isEmptyLabel = !label.trim();
            const alreadyExists = checkExistence();

            if (!noChange && !alreadyExists && !isEmptyLabel) {
              updateLabel(labelObj.uuid, label.trim());
              updateHash();
              setIsOpen(false);
            }
            if (alreadyExists) {
              setError("Label already exists");
            } else if (isEmptyLabel) {
              setError("Label can't be empty");
            }
          }}
        >
          <div style={{ position: "relative", marginBottom: ".5rem" }}>
            <input
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setError("");
              }}
              maxLength={50}
              placeholder="Enter label"
              className="form-input"
              style={{
                minHeight: "2.5rem",
                backgroundColor: "var(--input-bg)",
                border: "1px solid var(--border)",
                marginBottom: "0",
                color: "var(--text)",
                paddingRight: "2.7rem",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: "50%",
                right: ".9rem",
                transform: "translateY(-50%)",
                fontSize: ".8rem",
                color: "var(--text2)",
                marginRight: "0.4rem",
                marginLeft: ".4rem",
                userSelect: "none",
              }}
            >
              {50 - label.length}
            </div>
          </div>
          <AnimatePresence>
            {error.trim() && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{
                  opacity: { duration: 0.16, ease: "easeInOut", type: "tween" },
                  default: {
                    type: "spring",
                    stiffness: 800,
                    damping: 40,
                    mass: 1.05,
                  },
                }}
                style={{
                  right: ".9rem",
                  fontSize: ".8rem",
                  color: "var(--error)",
                  marginRight: "0.4rem",
                  marginLeft: ".4rem",
                  userSelect: "none",
                  width: "fit-content",
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          <div
            className="action-btns-container"
            style={{ textAlign: "right", marginTop: "1.1rem" }}
          >
            <button
              type="button"
              className="action-modal-bottom-btn action-cancel"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
            <button
              className="action-modal-bottom-btn"
              disabled={label.length === 0 || noChange || error.trim()}
              type="submit"
            >
              Update
            </button>
          </div>
        </form>
      </motion.div>
    </>,
    document.getElementById("modal-portal"),
  );
};

export default memo(SetLabelModal);
