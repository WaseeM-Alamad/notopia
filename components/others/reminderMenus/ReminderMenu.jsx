import { copyNoteAction, undoAction } from "@/utils/actions";
import { Popper } from "@mui/material";
import { motion } from "framer-motion";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { v4 as generateUUID } from "uuid";
import ManageLabelsMenu from "../ManageLabelsMenu";
import { useAppContext } from "@/context/AppContext";
import RemindMeLater from "./RemindMeLater";
import PickTime from "./PickTime";

const ReminderMenu = ({
  note,
  isOpen,
  setIsOpen,
  anchorEl,
  transformOrigin = "top left",
}) => {
  const { isContextMenuOpenRef } = useAppContext();
  const [isClient, setIsClient] = useState();
  const [isPickSection, setIsPickSection] = useState(false);
  const currentHour = new Date().getHours();

  const menuRef = useRef(null);

  const menuItems = [
    {
      title: currentHour < 18 ? "Later today" : "",
      time: "6:00 PM",
      function: () => {},
    },
    {
      title: "Tomorrow",
      time: "8:00 AM",
      function: () => {},
    },
    {
      title: "Next week",
      time: "Mon, 8:00 AM",
      function: () => {},
    },
    {
      title: "Pick date & time",
      function: () => setIsPickSection(true),
      icon: "clock-menu-icon",
    },
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    isContextMenuOpenRef.current = true;
    return () => (isContextMenuOpenRef.current = false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const menuEl = menuRef.current;
      const anchor = anchorEl?.contains ? anchorEl : null;
      const btnRef = anchorEl?.btnRef ?? null;

      if (
        isOpen &&
        !menuEl?.contains(e.target) &&
        !(anchor && anchor.contains(e.target)) &&
        btnRef !== e.target
      ) {
        setIsOpen(false);
      }
    };

    const handleResize = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleRightClick = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("contextmenu", handleRightClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("contextmenu", handleRightClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, anchorEl]);

  const containerClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  if (!isClient) return;
  return (
    <>
      <Popper
        open={isOpen}
        anchorEl={anchorEl}
        style={{ zIndex: "999" }}
        placement="bottom-start"
        modifiers={[
          {
            name: "preventOverflow",
            options: {
              boundariesElement: "viewport",
            },
          },
        ]}
      >
        {isOpen && (
          <motion.div
            onClick={containerClick}
            initial={{
              opacity: 0,
              transform: "scale(.97)",
              willChange: "none",
              pointerEvents: "auto",
            }}
            animate={{
              opacity: 1,
              transform: "scale(1)",
              pointerEvents: "auto",
            }}
            exit={{
              opacity: 0,
              transform: "scale(.97)",
              pointerEvents: "none",
            }}
            transition={{
              transform: {
                type: "spring",
                stiffness: 1100,
                damping: 50,
                mass: 1,
              },
              opacity: { duration: 0.15 },
            }}
            style={{
              transformOrigin: transformOrigin,
              width: "fit-content",
              minWidth: "14.0625rem",
              maxWidth: "unset",
              maxHeight: "26.96125rem",
              position: "relative",
              overflow: "visible"
            }}
            ref={menuRef}
            className="menu menu-border not-draggable"
          >
            {!isPickSection ? (
              <RemindMeLater setIsOpen={setIsOpen} menuItems={menuItems} />
            ) : (
              <PickTime setIsPickSection={setIsPickSection} setIsOpen={setIsOpen} />
            )}
          </motion.div>
        )}
      </Popper>
    </>
  );
};

export default memo(ReminderMenu);
