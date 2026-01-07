import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import Cropper from "react-easy-crop";

const url =
  "https://i.pinimg.com/1200x/69/79/2f/69792f45e99e530d9ec7ca137a6bc6b6.jpg";

const setAvatarModal = ({ setIsOpen }) => {
  const {
    closeToolTip,
    hideTooltip,
    showTooltip,
    floatingBtnRef,
    isActionModalOpenRef,
  } = useAppContext();
  const [isMounted, setIsMounted] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    <div
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
      onClick={(e) => {
        if (e.target === containerRef.current) {
          // setIsOpen(false);
        }
      }}
    >
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
          maxWidth: "90%",
          width: "840px",
          height: "90%",
        }}
      >
        <div
          style={{ top: ".5rem", right: "0.7rem" }}
          onClick={() => {
            setIsOpen(false);
            closeToolTip();
          }}
          onMouseEnter={(e) => showTooltip(e, "Close")}
          onMouseLeave={hideTooltip}
          className="clear-icon btn small-btn"
        />
        <div className="avatar-crop-wrapper">
          <Cropper
            image={url}
            // objectFit="vertical-cover"
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
          />
        </div>
        <div style={{ height: "20%" }}>sda</div>
      </motion.div>
    </div>,
    document.getElementById("modal-portal")
  );
};

export default memo(setAvatarModal);
