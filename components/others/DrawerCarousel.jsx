import React, { memo, useRef, useState } from "react";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import { AnimatePresence, motion } from "framer-motion";

const DrawerCarousel = ({
  items,
  type,
  title = "",
  isDrawerDragging,
  handleColorClick,
  handleBackground,
  selectedColor = () => {},
  selectedBG = () => {},
}) => {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const velocityRef = useRef(0);
  const [lastX, setLastX] = useState(0);
  const [lastTime, setLastTime] = useState(0);
  const animationRef = useRef(null);
  const cancelClickRef = useRef(null);

  const classes = (item) => {
    return type === "colors"
      ? `drawer-carousel-item ${item} ${item === "Default" ? "default-color-icon menu-item-default" : ""} ${selectedColor === item ? "drawer-item-selected drawer-selected-bg" : ""}`
      : `drawer-carousel-item menu-bg-${item} ${item === "DefaultBG" ? "menu-item-default" : ""} ${selectedBG === item ? "drawer-item-selected" : ""} drawer-bg`;
  };

  const handleMouseDown = (e) => {
    if (isDrawerDragging) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    setLastX(e.pageX);
    setLastTime(Date.now());
    velocityRef.current = 0;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isDrawerDragging) return;
    e.preventDefault();

    cancelClickRef.current = true;

    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;

    const now = Date.now();
    const timeDelta = now - lastTime;
    if (timeDelta > 0) {
      const distance = e.pageX - lastX;
      velocityRef.current = distance / timeDelta;
    }
    setLastX(e.pageX);
    setLastTime(now);
  };

  const applyMomentum = () => {
    if (Math.abs(velocityRef.current) > 0.05) {
      scrollRef.current.scrollLeft -= velocityRef.current * 16;
      velocityRef.current *= 0.92;
      animationRef.current = requestAnimationFrame(applyMomentum);
    }
  };

  const handleMouseUp = () => {
    if (isDrawerDragging) return;
    setIsDragging(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cancelClickRef.current = false;
      });
    });

    if (Math.abs(velocityRef.current) > 0.05) {
      applyMomentum();
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);

      if (Math.abs(velocityRef.current) > 0.05) {
        applyMomentum();
      }
    }
  };

  const handleItemClick = (item) => {
    if (cancelClickRef.current) {
      cancelClickRef.current = false;
      return;
    }
    if (type === "colors") {
      handleColorClick(item);
    } else {
      handleBackground(item);
    }
  };

  return (
    <div className="carousel-container">
      <div className="drawer-title">{title}</div>
      <div
        ref={scrollRef}
        className="carousel-scroll-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {items.map((item, index) => (
          <button
            key={index}
            className={classes(item)}
            onClick={() => handleItemClick(item)}
          >
            {type === "backgrounds" && item === selectedBG && (
              <AnimatePresence>
                {item === selectedBG && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{
                      scale: 0,
                      opacity: 0,
                      transition: { duration: 0.2 },
                    }}
                    className="selected-check-wrapper"
                  >
                    <DoneRoundedIcon
                      sx={{
                        color: "white",
                        margin: "auto",
                        fontSize: "22px",
                      }}
                      className="not-draggable"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default memo(DrawerCarousel);
