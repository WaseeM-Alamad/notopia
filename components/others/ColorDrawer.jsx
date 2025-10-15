import React, { memo, useCallback, useEffect, useState } from "react";
import { Drawer } from "vaul";
import DrawerCarousel from "./DrawerCarousel";
import { useAppContext } from "@/context/AppContext";

const ColorMenu = ({
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
    if (open) {
      const nav = document.querySelector("nav");
      const floatingBtn = floatingBtnRef?.current;
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      if (nav) nav.style.paddingRight = `${scrollbarWidth}px`;
      if (floatingBtn) floatingBtn.style.paddingRight = `${scrollbarWidth}px`;
    }
  }, [open]);

  const onAnimationEnd = () => {
    setTimeout(() => {
      const nav = document.querySelector("nav");
      const floatingBtn = floatingBtnRef?.current;
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "";
      if (nav) nav.style.paddingRight = "0px";
      if (floatingBtn) floatingBtn.style.paddingRight = "0px";
    }, 100);
  };

  return (
    <Drawer.Root
      onDrag={() => {
        if (!isDragging) setIsDragging(true);
      }}
      onRelease={() => setIsDragging(false)}
      onAnimationEnd={onAnimationEnd}
      open={open}
      onOpenChange={setOpen}
    >
      <Drawer.Portal>
        <Drawer.Overlay
          onTouchEnd={() => setOpen(false)}
          onClick={handleContentClick}
          onMouseMove={handleContentClick}
          className="drawer-overlay"
        />
        <Drawer.Content
          onClick={handleContentClick}
          onMouseMove={handleContentClick}
          className="drawer-content"
        >
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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default memo(ColorMenu);
