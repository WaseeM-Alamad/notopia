import React, { useEffect, useRef, useState } from "react";
import "@/assets/styles/modal.css";
import { createPortal } from "react-dom";

const NoteModal = ({
  trigger,
  setTrigger,
  trigger2,
  setTrigger2,
  notePos,
  noteVals,
}) => {
  const modalRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set isClient to true once the component is mounted on the client side
    setIsClient(true);
  }, []);

  const handleClose = (e) => {
    if (!modalRef.current.contains(e.target)) {
      setTrigger2(false);
      setTimeout(() => {
        setTrigger(false);
      }, 250);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setTrigger2(trigger);
    }, 10);
  }, [trigger]);

  useEffect(() => {
    if (trigger2) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`; // Add padding
  } else {
    document.body.style.overflow = "auto";
    document.body.style.paddingRight = ""; // Remove padding
  }
    return () => (document.body.style.overflow = "auto"); // Cleanup
  }, [trigger2]);

  if (!isClient) {
    return null; // Return nothing on the server side
  }

  return createPortal(
    <>
      <div
        onClick={handleClose}
        style={{
          display: trigger ? "" : "none",
          backgroundColor: trigger2 && "rgba(0,0,0,0.5)",
        }}
        className="modal-container"
      >
        <div
          ref={modalRef}
          style={{
            top: trigger2 ? "30%" : `${notePos.top}px`,
            left: trigger2 ? "50%" : `${notePos.left}px`,
            width: trigger2 ? "600px" : `${notePos.width}px`,
            height: trigger2 ? "185px" : `${notePos.height}px`,
            transform: trigger2 && "translate(-50%, -30%)",
            borderRadius: "0.7rem",
            backgroundColor: noteVals.color,
            transition:
              "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.25s linear",
          }}
          className="modal"
        ></div>
      </div>
    </>,
    document.getElementById("modal-portal")
  );
};

export default NoteModal;
