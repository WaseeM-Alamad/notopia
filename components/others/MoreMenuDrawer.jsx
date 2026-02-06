import React, { memo, useCallback, useEffect, useState } from "react";
import { Drawer } from "vaul";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";
import { useAppContext } from "@/context/AppContext";

const MoreMenuDrawer = ({
  open,
  setOpen,
  selectedBG,
  selectedColor,
  menuItems,
  updatedAt,
  hasTopPadding = false,
}) => {
  const { isContextMenuOpenRef } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(open);
  const formattedEditedDate =
    isOpen && updatedAt ? getNoteFormattedDate(updatedAt) : null;

  const handleContentClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleResize = () => {
    const width = window.innerWidth;
    if (width < 605) return;
    setOpen(false);
  };

  useEffect(() => {
    const handler = () => {
      setIsOpen(false);
    };

    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
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

  useEffect(() => {
    isContextMenuOpenRef.current = isOpen;
    return () => (isContextMenuOpenRef.current = false);
  }, [isOpen]);

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
            <div className="drawer-top" />
            <div
              style={{ paddingTop: hasTopPadding && "1rem" }}
              className="drawer-body"
            >
              {updatedAt && (
                <div className="menu-drawer-date">
                  {"Edited " + formattedEditedDate}{" "}
                </div>
              )}
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
