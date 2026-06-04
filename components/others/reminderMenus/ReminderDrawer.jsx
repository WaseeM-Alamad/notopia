import React, { memo, useCallback, useEffect, useState } from "react";
import { Drawer } from "vaul";
import { useAppContext } from "@/context/AppContext";
import { useGlobalContext } from "@/context/GlobalContext";
import { format } from "date-fns";
import PickTimeModal from "./PickTimeModal";
import { AnimatePresence } from "framer-motion";

const ReminderDrawer = ({
  open,
  setOpen,
  selectedBG,
  selectedColor,
  localNote,
  setLocalNote,
  noteActions,
}) => {
  const { isExpanded } = useGlobalContext();
  const isMobile = isExpanded.threshold === "before";
  const { isContextMenuOpenRef } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(open);
  const [isPickTime, setIsPickTime] = useState(false);

  const currentHour = new Date().getHours();

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
    if (!isOpen) {
      setIsPickTime(false);
    }
    requestAnimationFrame(() => {
      !isOpen && setIsOpen(open);
    });
  }, [open]);

  useEffect(() => {
    isContextMenuOpenRef.current = isOpen;
    return () => (isContextMenuOpenRef.current = false);
  }, [isOpen]);

  const menuItems = [
    {
      title: currentHour < 18 ? "Later today" : "",
      time: "6:00 PM",
      function: () => {
        const date = new Date();
        date.setHours(18, 0, 0, 0);
        const reminder = {
          date,
          rep: "DNR",
          enabled: true,
        };
        noteActions({
          type: "SET_REMINDER",
          note: localNote,
          reminder,
          setLocalNote,
        });
      },
    },
    {
      title: "Tomorrow",
      time: "8:00 AM",
      function: () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(8, 0, 0, 0);
        const reminder = {
          date,
          rep: "DNR",
          enabled: true,
        };
        noteActions({
          type: "SET_REMINDER",
          note: localNote,
          reminder,
          setLocalNote,
        });
      },
    },
    {
      title: "Next week",
      time: `${format(new Date(), "EEE")}, 8:00 AM`,
      function: () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        date.setHours(8, 0, 0, 0);
        const reminder = {
          date,
          rep: "DNR",
          enabled: true,
        };
        noteActions({
          type: "SET_REMINDER",
          note: localNote,
          reminder,
          setLocalNote,
        });
      },
    },
    {
      title: "Pick date & time",
      function: () => setIsPickTime(true),
      icon: "clock-menu-icon",
    },
  ];

  if (!isOpen) return null;

  return (
    <>
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
              <div className="drawer-body">
                <div className="menu-drawer-title" style={{ fontSize: "1rem" }}>
                  Remind me later
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
                        className={`clock-menu-icon-2 menu-btn n-menu-btn not-draggable drawer-menu-btn`}
                        onClick={() => {
                          setOpen(false);
                          item.function();
                        }}
                      >
                        <span>{item.title}</span>
                        <span>{item.time}</span>
                      </div>
                    );
                  })}{" "}
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      <AnimatePresence>
        {isPickTime && (
          <PickTimeModal isOpen={isPickTime} setIsOpen={setIsPickTime} note={localNote} />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(ReminderDrawer);
