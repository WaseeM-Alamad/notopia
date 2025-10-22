import React, { memo, useCallback, useEffect, useState } from "react";
import { Drawer } from "vaul";
import DrawerCarousel from "./DrawerCarousel";
import { useAppContext } from "@/context/AppContext";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";

const MoreMenuDrawer = ({
  open,
  setOpen,
  selectedBG,
  selectedColor,
  menuItems,
  updatedAt,
}) => {
  const { floatingBtnRef } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(open);
  const formattedEditedDate = isOpen ? getNoteFormattedDate(updatedAt) : null;

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
            <div className="drawer-top" />
            <div style={{ padding: "0 0rem" }} className="drawer-body">
              <div className="menu-drawer-date">
                {"Edited " + formattedEditedDate}{" "}
              </div>
              <div>
                {" "}
                {menuItems.map((item, index) => {
                  if (!item?.title?.trim()) {
                    return;
                  }
                  return (
                    <div
                      key={index}
                      className={`${
                        item.icon || ""
                      } menu-btn n-menu-btn not-draggable drawer-menu-btn`}
                      onClick={() => {
                        setOpen(false);
                        item.function();
                      }}
                    >
                      {item.title}
                    </div>
                  );
                })}{" "}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default memo(MoreMenuDrawer);
