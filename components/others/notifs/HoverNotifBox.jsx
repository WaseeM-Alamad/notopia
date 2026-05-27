import { useNotifs } from "@/context/NotificationContext";
import { motion } from "framer-motion";
import React, { memo, useEffect, useMemo, useState } from "react";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ReminderNotif from "./ReminderNotif";
import Button from "@/components/Tools/Button";
import { useGlobalContext } from "@/context/GlobalContext";

const NoNotifs = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: ".5rem",
        alignItems: "center",
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        whiteSpace: "nowrap",
        color: "var(--bg-text-color)",
        fontWeight: "500",
        fontSize: "1.05rem",
      }}
    >
      <svg
        width="97"
        height="97"
        viewBox="0 0 97 97"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M70.1688 64.8139L66.1716 35.6362C64.9964 27.0578 56.9278 19.8412 48.5006 19.8412C40.0843 19.8412 32.0043 27.0611 30.8295 35.6362L26.832 64.8139H70.1688ZM23.6247 34.5887C25.3077 22.3043 36.4696 12.3457 48.5006 12.3457C60.5561 12.3457 71.6948 22.3148 73.3763 34.5887L77.5284 64.8965C78.0893 68.9905 75.3134 72.3094 71.296 72.3094H25.7047C21.7018 72.3094 18.9102 69.0001 19.4724 64.8965L23.6247 34.5887ZM59.4148 76.0571C59.4148 82.2665 54.5284 87.3003 48.5006 87.3003C42.4728 87.3003 37.5863 82.2665 37.5863 76.0571H43.0435C43.0435 79.1618 45.4867 81.6787 48.5006 81.6787C51.5145 81.6787 53.9577 79.1618 53.9577 76.0571H59.4148Z"
          fill="var(--bg-icon-color)"
        />
        <path
          d="M48.5096 19.841C52.5281 19.841 55.7857 16.4852 55.7857 12.3456C55.7857 8.20593 52.5281 4.8501 48.5096 4.8501C44.491 4.8501 41.2334 8.20593 41.2334 12.3456C41.2334 16.4852 44.491 19.841 48.5096 19.841Z"
          fill="var(--bg-icon-color)"
        />
      </svg>

      <span>You have no notifications</span>
    </div>
  );
};

const isToday = (d) => {
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const isYesterday = (d) => {
  const now = new Date();
  const y = new Date();
  y.setDate(now.getDate() - 1);
  return d.toDateString() === y.toDateString();
};

const HoverNotifBox = ({
  right,
  top,
  onMouseEnter,
  onMouseLeave,
  hoverNotifBoxRef,
  closeMenu,
  isOpen,
}) => {
  const { lockScroll } = useGlobalContext();
  const { notifsMap, fetchNotifs } = useNotifs();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifs(setIsLoading);
  }, []);

  useEffect(() => {
    if (window.innerWidth > 605) {
      lockScroll(false);
      return;
    }
    lockScroll(isOpen);

    return () => lockScroll(false);
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        closeFunc();
        setDialogInfo(null);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const notifications = isLoading
    ? Array.from({ length: 6 }, (_, i) => [
        `skeleton-${i}`,
        {
          skeleton: true,
          type: "reminder",
          createdAt: new Date(),
        },
      ])
    : [...notifsMap];

  const grouped = useMemo(() => {
    const groups = {
      now: [],
      today: [],
      yesterday: [],
      last7: [],
      last30: [],
    };

    const now = new Date();

    notifications.forEach(([id, notif]) => {
      const date = new Date(notif.createdAt);

      const diffMin = (now - date) / 1000 / 60;
      const diffDays = (now - date) / 1000 / 60 / 60 / 24;

      if (notif.skeleton || diffMin <= 5) {
        groups.now.push([id, notif]);
      } else if (isToday(date)) {
        groups.today.push([id, notif]);
      } else if (isYesterday(date)) {
        groups.yesterday.push([id, notif]);
      } else if (diffDays <= 7) {
        groups.last7.push([id, notif]);
      } else {
        groups.last30.push([id, notif]);
      }
    });

    return groups;
  }, [notifications]);

  const Section = ({ title, items }) => {
    if (!items.length) return null;

    return (
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            fontSize: ".9rem",
            fontWeight: "bold",
            padding: "0 1rem",
            marginBottom: ".3rem",
            textTransform: "capitalize",
            color: "var(--text)",
          }}
        >
          {title}
        </div>

        {items.map(([id, notif]) => {
          switch (notif.type) {
            case "reminder":
              return (
                <ReminderNotif key={id} notif={notif} closeMenu={closeMenu} />
              );
            default:
              return null;
          }
        })}
      </div>
    );
  };

  return (
    <motion.div
      ref={hoverNotifBoxRef}
      initial={{ x: -7, scale: 0.97, opacity: 0 }}
      animate={{ x: 0, scale: 1, opacity: 1 }}
      exit={{ x: -7, scale: 0.97, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 40,
        mass: 1.05,
      }}
      className="hover-notif-box"
      style={{
        top: top + "px",
        right: right + "px",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <SkeletonTheme
        baseColor="var(--skeleton-base)"
        highlightColor="var(--skeleton-highlight)"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flex: "1",
            fontWeight: "bold",
            fontSize: "1.25rem",
            padding: "1.5rem",
            paddingBottom: "1rem",
          }}
        >
          <span>Notifications</span>
          <Button
            onClick={closeMenu}
            className="clear-icon small-btn mobile-element"
            style={{
              position: "relative",
              margin: "0",
              left: "0",
              top: "0",
              width: "35px",
              height: "35px",
            }}
          />
        </div>

        <div
          style={{
            overflowY: isLoading ? "unset" : "auto",
            flex: "1",
            height: "calc(100% - 66px)",
          }}
        >
          {!isLoading && notifsMap.size === 0 ? (
            <NoNotifs />
          ) : (
            <div className="notifs-container">
              <Section title={isLoading ? "" : "Now"} items={grouped.now} />
              <Section title={isLoading ? "" : "Today"} items={grouped.today} />
              <Section
                title={isLoading ? "" : "Yesterday"}
                items={grouped.yesterday}
              />
              <Section
                title={isLoading ? "" : "Last 7 Days"}
                items={grouped.last7}
              />
              <Section
                title={isLoading ? "" : "Last 30 Days"}
                items={grouped.last30}
              />
            </div>
          )}
        </div>
      </SkeletonTheme>
    </motion.div>
  );
};

export default memo(HoverNotifBox);
