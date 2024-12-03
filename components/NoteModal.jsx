'use client';
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom"; // Import createPortal correctly

const NoteModal = ({ divPosition, divSize, trigger, setTrigger, setOpacity }) => {
    const [triggerAnimation, setTriggerAnimation] = useState(false);
    const [mounted, setMounted] = useState(false);
    const outerRef = useRef(null);
    const innerRef = useRef(null);
  
    useEffect(() => {
      setMounted(true);
      
      if (trigger) {
        setTimeout(() => {
          setTriggerAnimation(true);
        }, 30);
      }
      
      return () => setMounted(false);
    }, [trigger]);
  
    if (!mounted) return null;
  
    // Use createPortal instead of ReactDom.createPortal
    return createPortal(
        <>
        <div
          onClick={(e) => {
            if (!innerRef.current?.contains(e.target))
              setTimeout(() => {
                setOpacity(true);
              }, 150);
  
            if (!innerRef.current?.contains(e.target)) {
              setTriggerAnimation(false);
              setTimeout(() => {
                setTrigger(false);
              }, 240);
            }
          }}
          ref={outerRef}
          style={{
            display: trigger ? "" : "none",
            position: "fixed",
            backgroundColor: triggerAnimation
              ? "rgba(0,0,0,0.5)"
              : "rgba(0,0,0,0)",
            width: "100%",
            height: "100%",
            top: "0",
            left: "0",
            zIndex: "10000",
            transition: "background-color 0.3s ease",
          }}
        >
          <div
            ref={innerRef}
            style={{
              userSelect: "none",
              border: "solid 1px rgba(0,0,0,0.2)",
              borderRadius: "6px",
              backgroundColor: "lightCoral",
              opacity: "1",
              padding: "10px",
              transition: "all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)",
              width: triggerAnimation ? "600px" : `${divSize.width - 21}px`,
              height: triggerAnimation ? "185px" : `${divSize.height - 21}px`,
              whiteSpace: "nowrap",
              maxWidth: "600px",
              position: "fixed", // Fixed positioning relative to the viewport
              left: triggerAnimation ? "50%" : `${divPosition.x}px`, // Set the x position based on the tracked div
              top: triggerAnimation ? "30%" : `${divPosition.y}px`, // Set the y position based on the tracked div
              transform: triggerAnimation && "translate(-50%, -30%)",
            }}
          >
            <p>
              The div's position relative to the window is:
              <br />
              <br /> x: {divPosition.x}px, y: {divPosition.y}px,
            </p>
          </div>
        </div>
      </>,
      document.getElementById("portal")
    );
  };
  
export default NoteModal;