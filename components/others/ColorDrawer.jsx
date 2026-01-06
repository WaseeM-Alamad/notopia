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
  const { floatingBtnRef, isContextMenuOpenRef } = useAppContext();
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
    isContextMenuOpenRef.current = true;
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
    if (isOpen) {
      const nav = document.querySelector("nav");
      const topMenu = document.querySelector("#top-menu");
      const floatingBtn = floatingBtnRef?.current;
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (topMenu) topMenu.style.paddingRight = `${scrollbarWidth}px`;
      if (nav) nav.style.paddingRight = `${scrollbarWidth}px`;
      if (floatingBtn) floatingBtn.style.paddingRight = `${scrollbarWidth}px`;
    }
  }, [isOpen]);

  const onClose = () => {
    const nav = document.querySelector("nav");
    const floatingBtn = floatingBtnRef?.current;
    const topMenu = document.querySelector("#top-menu");
    document.body.removeAttribute("data-scroll-locked");
    if (topMenu) topMenu.style.removeProperty("padding-right");
    if (floatingBtn) floatingBtn.style.removeProperty("padding-right");
    if (nav) nav.style.removeProperty("padding-right");
  };

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
      onClose={onClose}
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
