import { Popper } from "@mui/material";
import { motion } from "framer-motion";
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useAppContext } from "@/context/AppContext";
import RemindMeLater from "./RemindMeLater";
import PickTime from "./PickTime";
import { format } from "date-fns";

const ReminderMenu = ({
  note,
  isOpen,
  setIsOpen,
  anchorEl,
  transformOrigin = "top left",
  noteActions,
  setLocalNote = null,
}) => {
  const hasReminder = note?.reminder;
  const { isContextMenuOpenRef } = useAppContext();
  const [isClient, setIsClient] = useState();
  const [isPickSection, setIsPickSection] = useState(false);
  const currentHour = new Date().getHours();

  const menuRef = useRef(null);
  const timeoutRef = useRef(null);
  const firstSectionRef = useRef(null);
  const secondSectionRef = useRef(null);
  const isFirstRunRef = useRef(true);

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
          note: note,
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
          note: note,
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
          note: note,
          reminder,
          setLocalNote,
        });
      },
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

  useLayoutEffect(() => {
    if (!hasReminder) return;
    setTimeout(() => {
      setIsPickSection(true);
    }, 10);
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

    let previousWidth = window.innerWidth;

    const handleResize = () => {
      const currentWidth = window.innerWidth;

      if (currentWidth !== previousWidth) {
        previousWidth = currentWidth;
        setIsOpen(false);
      }
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

  const hasReminderFirstMountRef = useRef(hasReminder);

  useEffect(() => {
    const skipTimeout = hasReminder && hasReminderFirstMountRef.current;

    const menu = menuRef.current;
    const firstSection = firstSectionRef.current;
    const secondSection = secondSectionRef.current;

    if (!menu || !firstSection || !secondSection) return;

    firstSection.style.removeProperty("transition");
    secondSection.style.removeProperty("transition");
    menu.style.transitionDuration = ".25s";

    if (skipTimeout) {
      hasReminderFirstMountRef.current = false;
      firstSection.style.transition = "none";
      secondSection.style.transition = "none";
      menu.style.transitionDuration = "0s";
    }

    if (isFirstRunRef.current) {
      menu.style.height = firstSection.offsetHeight + "px";
      isFirstRunRef.current = false;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    secondSection.style.pointerEvents = isPickSection ? "all" : "none";
    firstSection.style.pointerEvents = !isPickSection ? "all" : "none";

    if (isPickSection) {
      menu.style.height = secondSection.offsetHeight + "px";
      firstSection.style.opacity = 0;

      timeoutRef.current = setTimeout(
        () => {
          secondSection.style.opacity = 1;
        },
        skipTimeout ? 0 : 250,
      );
    } else {
      menu.style.height = firstSection.offsetHeight + "px";
      secondSection.style.opacity = 0;

      timeoutRef.current = setTimeout(
        () => {
          firstSection.style.opacity = 1;
        },
        skipTimeout ? 0 : 250,
      );
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPickSection]);

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
              overflow: "visible",
              boxSizing: "content-box",
              transition: "width 0.25s ease-in, height 0.25s ease-in",
            }}
            ref={menuRef}
            className="menu menu-border not-draggable"
          >
            <div ref={firstSectionRef} className="remind-later-wrapper">
              <RemindMeLater setIsOpen={setIsOpen} menuItems={menuItems} />
            </div>
            <div ref={secondSectionRef} className="reminder-pick-wrapper">
              <PickTime
                setIsPickSection={setIsPickSection}
                setIsOpen={setIsOpen}
                noteActions={noteActions}
                note={note}
                setLocalNote={setLocalNote}
              />
            </div>
          </motion.div>
        )}
      </Popper>
    </>
  );
};

export default memo(ReminderMenu);
