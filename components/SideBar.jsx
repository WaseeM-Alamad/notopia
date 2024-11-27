import React, { useEffect, useRef, useState } from "react";
import "@/assets/styles/SideBar.css";
import BellIcon from "./BellIcon";
import TrashIcon from "./TrashIcon";
import EditIcon from "./EditIcon";
import ArchiveIcon from '@/components/ArchiveSideIcon';
import NoteIcon from "./NoteIcon";
import { usePathname, useRouter } from "next/navigation";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const sideBarRef = useRef(null);
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

  const menuItems = [
    { id: "home", icon: NoteIcon, label: "Notes" },
    { id: "reminders", icon: BellIcon, label: "Reminders" },
    { id: "edit", icon: EditIcon, label: "Edit labels" },
    { id: "archive", icon: ArchiveIcon, label: "Archive" },
    { id: "trash", icon: TrashIcon, label: "Trash" },
  ];

  const handleSideMenuItemClick = (id) => {
    setActiveItem(id);
    router.push(`/${id}`);
  };

  const handleSideMenuHover = (e) => {
    const timeoutId = setTimeout(() => {
      if (sideBarRef.current && sideBarRef.current.contains(e.target)) {
        setIsCollapsed(false);
      }
    }, 350);

    const handleMouseLeave = () => {
      clearTimeout(timeoutId);
      setIsCollapsed(true);
    };

    sideBarRef.current.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      sideBarRef.current.removeEventListener("mouseleave", handleMouseLeave);
    };
  };

  return (
    <div
      ref={sideBarRef}
      onMouseOver={handleSideMenuHover}
      className={`${"sidebar"} ${isCollapsed ? "collapsed" : "sidebar-shadow"}`}
    >
      <aside className={"navSection"}>
        {menuItems.map(({ id, icon: Icon, label }) => (
          <div
            key={id}
            className={`${"navItem"} ${activeItem === id ? "active" : ""}`}
            onClick={() => handleSideMenuItemClick(id)}
          >
            <Icon className={"navIcon"} />
            <span className={"navLabel"}>{label}</span>
          </div>
        ))}
      </aside>
    </div>
  );
};

export default Sidebar;
