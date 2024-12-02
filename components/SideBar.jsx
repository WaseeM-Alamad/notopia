import React, { useEffect, useRef, useState } from "react";
import "@/assets/styles/SideBar.css";
import BellIcon from "./BellIcon";
import TrashIcon from "./TrashIcon";
import EditIcon from "./EditIcon";
import ArchiveIcon from "@/components/ArchiveSideIcon";
import NoteIcon from "./NoteIcon";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const Sidebar = ({ sideTrigger }) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const sideTrigger = localStorage.getItem("sideBarTrigger");
    console.log("side Trigger: " + sideTrigger);
    return sideTrigger === "true";
  });
  const sideBarRef = useRef(null);
  const timeoutRef = useRef(null);
  const [activeItem, setActiveItem] = useState("home");
  const pathName = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathName === "/home" || pathName === "/") {
      setActiveItem("home");
    } else if (pathName === "/reminders") {
      setActiveItem("reminders");
    } else if (pathName === "/archive") {
      setActiveItem("archive");
    } else if (pathName === "/trash") {
      setActiveItem("trash");
    }
  }, [pathName]);

  const handleSideMenuItemClick = (id) => {
    setActiveItem(id);
    router.push(`/${id}`);
  };

  const handleSideMenuHover = (e) => {
    if (sideTrigger) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsExpanded(true);
    }, 350);
  };

  const handleSideMenuLeave = () => {
    if (sideTrigger) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsExpanded(false);
  };

  useEffect(() => {
    if (sideTrigger) setIsExpanded(true);
    else setIsExpanded(false);
  }, [sideTrigger]);

  return (
    <motion.aside
      ref={sideBarRef}
      onMouseOver={handleSideMenuHover}
      onMouseLeave={handleSideMenuLeave}
      style={{
        boxShadow:
          isExpanded &&
          !sideTrigger &&
          "0 16px 10px 0 rgba(0,0,0,.14),0 11px 18px 0 rgba(0,0,0,.12),0 13px 5px -1px rgba(0,0,0,.2)",
      }}
      className="sidebar"
      animate={{ width: isExpanded ? "280px" : "80px" }}
      transition={{ duration: 0.12, ease: "easeInOut" }}
    >
      <div style={{ width: "100%", boxSizing: "border-box" }}>
        <div
          style={{
            display: "flex",
            borderRadius: isExpanded ? "0 25px 25px 0" : "50%",
            padding: "12px",
            width: isExpanded ? "100%" : "49px",
            height: "49px",
            backgroundColor: activeItem === "home" ? "#feefc3" : "transparent",
            boxSizing: "border-box",
            marginLeft: !isExpanded ? "12px" : "0px",
            transition: "all 0.1s ease",
          }}
          onClick={() => handleSideMenuItemClick("home")}
          className="sidebar-item"
        >
          <NoteIcon
            style={{
              position: "relative",
              left: !isExpanded ? "0" : "12px",
              transition: "all 0.1s ease",
            }}
            size={24}
          />
          <span className="roboto-regular label">Notes</span>
        </div>
      </div>
      <div style={{ width: "100%", boxSizing: "border-box" }}>
        <div
          style={{
            borderRadius: isExpanded ? "0 25px 25px 0" : "50%",
            padding: "12px",
            width: isExpanded ? "100%" : "49px",
            height: "49px",
            backgroundColor:
              activeItem === "reminders" ? "#feefc3" : "transparent",
            boxSizing: "border-box",
            marginLeft: !isExpanded ? "12px" : "+0px",
            transition: "all 0.1s ease",
          }}
          onClick={() => handleSideMenuItemClick("reminders")}
          className="sidebar-item"
        >
          <BellIcon
            style={{
              position: "relative",
              left: !isExpanded ? "0" : "12px",
              transition: "all 0.1s ease",
            }}
            size={24}
          />
          <span className="roboto-regular label">Reminders</span>
        </div>
      </div>
      <div style={{ width: "100%", boxSizing: "border-box" }}>
        <div
          style={{
            borderRadius: isExpanded ? "0 25px 25px 0" : "50%",
            padding: "12px",
            width: isExpanded ? "100%" : "49px",
            height: "49px",
            backgroundColor: "transparent",
            boxSizing: "border-box",
            marginLeft: !isExpanded ? "12px" : "0px",
            transition: "all 0.1s ease",
          }}
          className="sidebar-item"
        >
          <EditIcon
            style={{
              position: "relative",
              left: !isExpanded ? "0" : "12px",
              transition: "all 0.1s ease",
            }}
            size={24}
          />
          <span className="roboto-regular label">Edit labels</span>
        </div>
      </div>
      <div style={{ width: "100%", boxSizing: "border-box" }}>
        <div
          style={{
            borderRadius: isExpanded ? "0 25px 25px 0" : "50%",
            padding: "12px",
            width: isExpanded ? "100%" : "49px",
            height: "49px",
            backgroundColor:
              activeItem === "archive" ? "#feefc3" : "transparent",
            boxSizing: "border-box",
            marginLeft: !isExpanded ? "12px" : "0px",
            transition: "all 0.1s ease",
          }}
          onClick={() => handleSideMenuItemClick("archive")}
          className="sidebar-item"
        >
          <ArchiveIcon
            style={{
              position: "relative",
              left: !isExpanded ? "0" : "12px",
              transition: "all 0.1s ease",
            }}
            size={24}
          />
          <span className="roboto-regular label">Archive</span>
        </div>
      </div>
      <div style={{ width: "100%", boxSizing: "border-box" }}>
        <div
          style={{
            borderRadius: isExpanded ? "0 25px 25px 0" : "50%",
            padding: "12px",
            width: isExpanded ? "100%" : "49px",
            height: "49px",
            backgroundColor: activeItem === "trash" ? "#feefc3" : "transparent",
            boxSizing: "border-box",
            marginLeft: !isExpanded ? "12px" : "0px",
            transition: "all 0.1s ease",
          }}
          onClick={() => handleSideMenuItemClick("trash")}
          className="sidebar-item"
        >
          <TrashIcon
            style={{
              position: "relative",
              left: !isExpanded ? "0" : "12px",
              transition: "all 0.1s ease",
            }}
            size={24}
          />
          <span className="roboto-regular label">Trash</span>
        </div>
      </div>
    </motion.aside>
  );
};

export default React.memo(Sidebar);
