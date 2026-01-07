import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import Cropper from "react-easy-crop";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { getCroppedAvatar } from "@/utils/getCroppedAvatar";
import HorizontalLoader from "../Tools/HorizontalLoader";

const setAvatarModal = ({ setIsOpen, imgUrlRef }) => {
  const { closeToolTip, hideTooltip, showTooltip, saveNewAvatar } =
    useAppContext();
  const [isMounted, setIsMounted] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    return () => (imgUrlRef.current = null);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        !isLoading && setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const onCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  if (!isMounted) return;

  return createPortal(
    <motion.div
      ref={containerRef}
      className="modal-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: {
          type: "tween",
          duration: 0.15,
          ease: "linear",
        },
      }}
      style={{ backdropFilter: "blur(3px)" }}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          !isLoading && setIsOpen(false);
        }
      }}
    >
      <motion.div
        ref={modalRef}
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
          position: "relative",
          display: "flex",
          flexDirection: "column",
          padding: "1.1rem 0",
          maxWidth: "32rem",
          maxHeight: "40rem",
          width: isLoading ? "300px" : "90%",
          height: isLoading ? "230px" : "50%",
          borderRadius: isLoading && "2rem",
          pointerEvents: isLoading ? "none" : "auto",
          transition: "all 0.3s ease-in-out",
        }}
      >
        <div
          style={{
            top: ".65rem",
            right: "1rem",
            display: isLoading ? "none" : "",
          }}
          onClick={() => {
            closeToolTip();
            !isLoading && setIsOpen(false);
          }}
          onMouseEnter={(e) => showTooltip(e, "Close")}
          onMouseLeave={hideTooltip}
          className="clear-icon btn small-btn"
        />
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            pointerEvents: isLoading ? "auto" : "none",
          }}
        >
          {isLoading && (
            <div
              style={{
                display: "flex",
                boxSizing: "border-box",
                height: "100%",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: "1rem",
              }}
            >
              <div style={{ fontWeight: "600", fontSize: "1.3rem" }}>
                Uploading photo
              </div>
              <HorizontalLoader color="var(--text)" size={0.8} />
            </div>
          )}
        </div>
        <div style={{ height: "100%" }}>
          <div
            style={{
              marginLeft: "0.3rem",
              fontWeight: "600",
              fontSize: "18px",
              paddingLeft: "1.3rem",
              overflow: "hidden",
              minWidth: "0",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              paddingRight: "4rem",
              height: "2.4rem",
              opacity: isLoading ? "0" : "1",
            }}
          >
            Profile Photo
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "calc(100% - 42px)",
              overflowY: isLoading ? "none" : "auto",
              opacity: isLoading ? "0" : "1",
              padding: "0 1.3rem",
              transition: "all 0.2s ease",
            }}
          >
            <div className="avatar-crop-wrapper">
              <Cropper
                image={imgUrlRef.current}
                aspect={1}
                cropShape="round"
                showGrid={true}
                crop={crop}
                zoom={zoom}
                minZoom={1}
                maxZoom={4}
                restrictPosition={true}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: "1.7rem",
                padding: "0 1rem",
              }}
            >
              <div
                style={{
                  marginBottom: "0.3rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".5rem",
                }}
              >
                <div className="zoom-icon" />
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Zoom
                </label>
              </div>
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={setZoom}
                styles={{
                  rail: { backgroundColor: "var(--slider-rail)", height: 6 },
                  handle: {
                    borderColor: "var(--primary)",
                    backgroundColor: "var(--slider-handle)",
                    opacity: "1",
                    width: 17,
                    height: 17,
                    boxShadow: "0 2px 4px rgba(0,0,0,0)",
                    marginLeft: ".3rem",
                  },
                  track: { backgroundColor: "var(--primary)", height: 6 },
                }}
              />
            </div>

            <div
              style={{
                marginTop: "auto",
                textAlign: "right",
                paddingTop: "1rem",
                paddingBottom: "0.4rem",
              }}
            >
              <button
                className="action-modal-bottom-btn action-cancel"
                onClick={() => {
                  !isLoading && setIsOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                className="action-modal-bottom-btn"
                onClick={() =>
                  saveNewAvatar({
                    croppedAreaPixels,
                    imgUrlRef,
                    setIsLoading,
                    setIsOpen,
                  })
                }
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.getElementById("modal-portal")
  );
};

export default memo(setAvatarModal);
