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
  const { floatingBtnRef } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);
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

  useEffect(() => {
    const handler = () => {
      const width = window.innerWidth;
      if (width < 605) return;
      setOpen(false);
    };

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (open) {
      const nav = document.querySelector("nav");
      const topMenu = document.querySelector("#top-menu");
      const floatingBtn = floatingBtnRef?.current;
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (topMenu) topMenu.style.paddingRight = `${scrollbarWidth}px`;
      if (nav) nav.style.paddingRight = `${scrollbarWidth}px`;
      if (floatingBtn) floatingBtn.style.paddingRight = `${scrollbarWidth}px`;
    }
  }, [open]);

  const onClose = () => {
    const nav = document.querySelector("nav");
    const floatingBtn = floatingBtnRef?.current;
    const topMenu = document.querySelector("#top-menu");
    document.body.removeAttribute("data-scroll-locked");
    if (topMenu) topMenu.style.removeProperty("padding-right");
    if (floatingBtn) floatingBtn.style.removeProperty("padding-right");
    if (nav) nav.style.removeProperty("padding-right");
  };

  return (
    <Drawer.Root
      onDrag={() => {
        if (!isDragging) setIsDragging(true);
      }}
      onRelease={() => setIsDragging(false)}
      onClose={onClose}
      open={open}
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
          className={`drawer-content ${selectedColor}`}
        >
          <div className={`drawer-content-color ${selectedColor}`}>
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
