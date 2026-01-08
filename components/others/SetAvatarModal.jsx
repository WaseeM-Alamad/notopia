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
  const [isPreview, setIsPreview] = useState(false);
  const [finalBlob, setFinalBlob] = useState(null);
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
        style={{ backdropFilter: "blur(3px)", zIndex: "200" }}
        onClick={() => !isLoading && setIsOpen(false)}
      />
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
          display: "flex",
          flexDirection: "column",
          padding: "1.1rem 0",
          paddingBottom: "0.5rem",
          maxWidth: "28rem",
          width: isLoading ? "300px" : "90%",
          height: isLoading ? "230px" : isPreview ? "370px" : "28.5rem",
          borderRadius: isLoading && "2rem",
          pointerEvents: isLoading ? "none" : "auto",
          zIndex: "201",
          userSelect: "none",
          transition: "all 0.2s ease",
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

        {/* loading */}
        <div
          style={{
            position: "absolute",
            top: "0",
            width: "100%",
            height: "100%",
            pointerEvents: isLoading ? "auto" : "none",
            opacity: isLoading ? "1" : "0",
            transition: "opacity 0.2s ease",
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
              }}
            >
              <div style={{ fontWeight: "600", fontSize: "1.3rem" }}>
                Uploading photo
              </div>
              <HorizontalLoader color="var(--text)" size={0.8} />
            </div>
          )}
        </div>
        {/* loading end */}

        {/* preview */}
        <div
          style={{
            boxSizing: "border-box",
            position: "absolute",
            top: "0",
            width: "100%",
            height: "100%",
            pointerEvents: isPreview ? "auto" : "none",
            opacity: isPreview ? "1" : "0",
            transition: "opacity 0.2s ease",
          }}
        >
          {isPreview && (
            <div
              style={{
                display: "flex",
                boxSizing: "border-box",
                height: "100%",
                flexDirection: "column",
                alignItems: "center",
                // justifyContent: "center",
                paddingTop: "3.5rem",
                // paddingBottom: "1rem",
              }}
            >
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "1.1rem",
                  marginBottom: "0.3rem",
                }}
              >
                Your new profile photo
              </div>
              <div
                style={{
                  color: "var(--text3)",
                  fontSize: "0.9rem",
                  marginBottom: "2rem",
                }}
              >
                This is how your profile photo will look!
              </div>
              <div>
                <img
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid var(--border)",
                  }}
                  width={124}
                  height={124}
                  src={URL.createObjectURL(finalBlob)}
                />
              </div>
              <div
                style={{
                  marginTop: "auto",
                  textAlign: "right",
                  width: "100%",
                  paddingRight: "1.3rem",
                  boxSizing: "border-box",
                  paddingTop: "1rem",
                  paddingBottom: "1.1rem",
                }}
              >
                <button
                  className="action-modal-bottom-btn action-cancel"
                  onClick={() => {
                    setIsPreview(false);
                  }}
                >
                  Back
                </button>
                <button
                  className="action-modal-bottom-btn"
                  onClick={() => {
                    setIsPreview(false);
                    saveNewAvatar({
                      avatarBlob: finalBlob,
                      setIsLoading,
                      setIsOpen,
                    });
                  }}
                >
                  Upload
                </button>
              </div>
            </div>
          )}
        </div>
        {/* prewview end */}

        {/* crop image */}
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
              opacity: isLoading || isPreview ? "0" : "1",
              pointerEvents: isLoading || isPreview ? "none" : "auto",
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
                // minZoom={1}
                // maxZoom={4}
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
                onClick={async () => {
                  const avatarBlob = await getCroppedAvatar(
                    imgUrlRef.current,
                    croppedAreaPixels,
                    400
                  );

                  setFinalBlob(avatarBlob);
                  setIsPreview(true);
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        {/* crop image end */}
      </motion.div>
    </>,
    document.getElementById("modal-portal")
  );
};

export default memo(setAvatarModal);
