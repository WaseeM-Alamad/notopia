import React, { memo, useCallback, useEffect, useState } from "react";
import { Drawer } from "vaul";
import DrawerCarousel from "./DrawerCarousel";
import { useAppContext } from "@/context/AppContext";

const ColorDrawer = ({
  open,
  setOpen,
  selectedBG,
  selectedColor,
  handleColorClick,
  handleBackground,
}) => {
  const { isContextMenuOpenRef, lockScroll } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(open);
  const colors = [
    "Default",
    "Coral",
    "Peach",
    "Sand",
    "Mint",
    "Seafoam",
    "Fog",
    "Storm",
    "Lavender",
    "Blossom",
    "Clay",
    "Wisteria",
  ];

  const backgrounds = [
    "DefaultBG",
    "Groceries",
    "Food",
    "Music",
    "Recipes",
    "Notes",
    "Places",
    "Travel",
    "Video",
    "Celebration",
  ];

  const handleContentClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleResize = () => {
    const width = window.innerWidth;
    if (width < 605) return;
    setOpen(false);
  };

  useEffect(() => {
    !isOpen && (isContextMenuOpenRef.current = true);
    return () => (isContextMenuOpenRef.current = false);
  }, []);

  useEffect(() => {
    if (open) {
      document.activeElement?.blur();
      window.addEventListener("resize", handleResize);
    } else {
      window.removeEventListener("resize", handleResize);
    }

    return () => window.removeEventListener("resize", handleResize);
  }, [open]);

  useEffect(() => {
    requestAnimationFrame(() => {
      !isOpen && setIsOpen(open);
    });
  }, [open]);

  if (!isOpen) return null;

  return (
    <Drawer.Root
      onDrag={() => {
        if (!isDragging) setIsDragging(true);
      }}
      onRelease={() => setIsDragging(false)}
      open={open}
      onAnimationEnd={() => setIsOpen(false)}
      onOpenChange={(val) => setOpen(val)}
    >
      <Drawer.Portal>
        <Drawer.Overlay
          onClick={handleContentClick}
          onMouseMove={handleContentClick}
          onTouchEnd={() => setOpen(false)}
          className="drawer-overlay"
        />
        <Drawer.Content
          onClick={handleContentClick}
          onMouseMove={handleContentClick}
          className={`drawer-content-wrapper ${selectedColor ? selectedColor : ""} ${selectedBG ? "drawer-bg-" + selectedBG : ""}`}
        >
          <div
            className={`drawer-content ${selectedColor ? selectedColor : ""} ${selectedBG ? "drawer-bg-" + selectedBG : ""}`}
          >
            <Drawer.Description />
            <Drawer.Title></Drawer.Title>
            <div className="drawer-handle" />

            <div className="drawer-body">
              <div className="drawer-top" />
              <DrawerCarousel
                items={colors}
                type="colors"
                title="Color"
                isDrawerDragging={isDragging}
                selectedColor={selectedColor}
                handleColorClick={handleColorClick}
                handleBackground={handleBackground}
              />
              <DrawerCarousel
                items={backgrounds}
                type="backgrounds"
                title="Background"
                isDrawerDragging={isDragging}
                selectedBG={selectedBG}
                handleColorClick={handleColorClick}
                handleBackground={handleBackground}
              />
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default memo(ColorDrawer);
