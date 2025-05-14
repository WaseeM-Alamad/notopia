"use client";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import "@/assets/styles/navbar.css";
import { signOut } from "next-auth/react";
import RefreshIcon from "../icons/RefreshIcon";
import SettingsIcon from "../icons/SettingsIcon";
import GridIcon from "../icons/GridIcon";
import { CircularProgress } from "@mui/material";
import { usePathname } from "next/navigation";
import { Box, margin, width } from "@mui/system";
import CloudIcon from "../icons/CloudIcon";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../Tools/Button";
import Logo from "../icons/Logo";
import ProfileMenu from "./ProfileMenu";
import { useSearch } from "@/context/SearchContext";
import { debounce } from "lodash";
import { useAppContext } from "@/context/AppContext";
import Tooltip from "../Tools/Tooltip";
import AccountSettings from "./AccountSettings";

const Navbar = ({ user }) => {
  const {
    setSearchTerm,
    searchRef,
    skipHashChangeRef,
    filters: searchFilters,
  } = useSearch();
  const { labelsRef, labelsReady, ignoreKeysRef } = useAppContext();
  const [isLoading, setIsLoading] = useState(0);
  const [UpToDatetrigger, setUpToDateTrigger] = useState(true);
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  // const isDarkMode = document.documentElement.classList.contains("dark-mode");
  const [menuPosition, setMenuPosition] = useState({
    top: 100,
    left: 600,
  });
  const image = user?.image;
  const pathName = usePathname();
  const firstRun = useRef(true);
  const firstRun2 = useRef(true);
  const imageRef = useRef(null);
  const menuRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    ignoreKeysRef.current = settingsOpen;
    const nav = document.querySelector("nav");
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    console.log(scrollbarWidth);

    if (settingsOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      if (nav) nav.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "";
      if (nav) nav.style.paddingRight = "0px";

      if (settingsRef.current) {
        settingsRef.current.style.marginLeft = `${scrollbarWidth / 2}px`;
      }
    }

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "";
      if (nav) nav.style.paddingRight = "0px";
    };
  }, [settingsOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const startLoading = () => {
      setIsLoading((prev) => prev + 1);
      clearTimeout(timeoutRef.current);
      setUpToDateTrigger(true);
    };
    const stopLoading = () => {
      setTimeout(() => {
        setIsLoading((prev) => {
          if (prev > 0) return prev - 1;
        });
      }, 800);
    };

    // Listen for custom events
    window.addEventListener("loadingStart", startLoading);
    window.addEventListener("loadingEnd", stopLoading);

    return () => {
      window.removeEventListener("loadingStart", startLoading);
      window.removeEventListener("loadingEnd", stopLoading);
    };
  }, []);

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!isLoading) {
      setUpToDateTrigger(false);
      timeoutRef.current = setTimeout(() => {
        setUpToDateTrigger(true);
      }, 1100);
    }
  }, [isLoading]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isLoading) {
        const message =
          "Your request is still in progress. Are you sure you want to leave?";
        event.returnValue = message; // Standard for most browsers
        return message; // For some browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isLoading]);

  useEffect(() => {
    const handler = (e) => {
      if (
        isMenuOpen &&
        !imageRef.current?.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (isMenuOpen) {
        // setIsMenuOpen(false);
        const rect = imageRef.current?.getBoundingClientRect();
        setMenuPosition({
          top: rect.top,
          left: rect.left,
        });
      }
    };

    document.addEventListener("mousedown", handler);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMenuOpen]);

  const [showClearBtn, setShowClearBtn] = useState(false);

  const tripleEncode = (str) => {
    return encodeURIComponent(encodeURIComponent(encodeURIComponent(str)));
  };

  const doubleEncode = (str) => {
    return encodeURIComponent(encodeURIComponent(str));
  };

  const tripleDecode = (str) => {
    return decodeURIComponent(decodeURIComponent(decodeURIComponent(str)));
  };

  const doubleDecode = (str) => {
    return decodeURIComponent(decodeURIComponent(str));
  };

  const [inputPlaceHolder, setInputPlaceHolder] = useState("Search");

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace("#", "");

      if (hash.toLowerCase().startsWith("note/")) {
        return;
      }

      const decodedHash = doubleDecode(hash.replace("search/", ""));

      if (hash.startsWith("search/")) {
        const filters = decodedHash.split("&");

        filters.forEach((filter, index) => {
          if (index > 1) {
            return;
          }
          if (filter.startsWith("text")) {
            return;
          }
          const decodedFilter = decodeURIComponent(filter);
          const parts = decodedFilter.split(/=(.+)/);
          const type = parts[0];
          const within = parts[1];
          if (type === "color") {
            setInputPlaceHolder(
              `Search within "${
                within.charAt(0).toUpperCase() + within.slice(1)
              }"`
            );
          } else if (type === "label") {
            if (!labelsReady || !searchFilters.label) return;
            const labelUUID = searchFilters.label;
            const label = labelsRef.current.get(labelUUID).label;
            setInputPlaceHolder("Search within " + label);
          } else if (type === "image") {
            setInputPlaceHolder(`Search within "Images"`);
          }
        });
      } else {
        setInputPlaceHolder("Search");
      }

      if (hash.startsWith("search") || hash.startsWith("search/")) {
        setShowClearBtn(true);
        return;
      }

      setShowClearBtn(false);
    };

    handler();

    window.removeEventListener("hashchange", handler);
    window.addEventListener("hashchange", handler);
    return () => {
      window.removeEventListener("hashchange", handler);
    };
  }, [labelsReady, searchFilters]);

  const handleRefresh = () => {
    closeToolTip();
    if (!isLoading && UpToDatetrigger)
      window.dispatchEvent(new Event("refresh"));
  };

  const handleProfileOpen = () => {
    closeToolTip();
    const rect = imageRef.current?.getBoundingClientRect();
    setMenuPosition({
      top: rect.top,
      left: rect.left,
    });
    setIsMenuOpen((prev) => !prev);
  };

  const inputClick = () => {
    closeToolTip();
    const currentHash = window.location.hash.replace("#", "");
    if (currentHash.startsWith("search")) {
      return;
    }
    const hash = "search";
    const event = new CustomEvent("sectionChange", {
      detail: { hash },
    });
    window.dispatchEvent(event);
  };

  const handleClearSearch = () => {
    closeToolTip();
    const hash = window.location.hash.replace("#", "");

    if (hash.startsWith("search/")) {
      window.location.hash = "search";
    } else {
      window.location.hash = "home";
    }
  };

  const debouncedHandleInputOnChange = useMemo(
    () =>
      debounce((e) => {
        skipHashChangeRef.current = true;
        setSearchTerm(e.target.value);
      }, 300),
    []
  );

  const closeToolTip = () => {
    setTooltipAnchor((prev) => ({
      anchor: null,
      text: prev?.text,
    }));
  };

  const handleMouseEnter = (e, text) => {
    const target = e.currentTarget;
    setTooltipAnchor({ anchor: target, text: text, display: true });
  };

  const handleMouseLeave = () => {
    setTooltipAnchor((prev) => ({
      ...prev,
      display: false,
    }));
  };

  if (!isClient) return;

  return (
    <>
      {tooltipAnchor?.display && <Tooltip anchorEl={tooltipAnchor} />}
      {pathName !== "/" && (
        <nav
          style={{
            boxShadow: isScrolled && "0 3px 10px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div className="logo" style={{marginLeft: "1.2rem"}}>
          {/* <Logo style={{margin: "auto 0"}} /> */}
          <span style={{marginLeft: "0rem"}}>Notopia</span>
          </div>
          <div className="search-wrapper">
            <Button
              onClick={handleClearSearch}
              style={{ display: !showClearBtn && "none" }}
              className="clear-search-icon"
              onMouseEnter={(e) => handleMouseEnter(e, "Clear search")}
              onMouseLeave={handleMouseLeave}
            />
            <input
              onClick={inputClick}
              ref={searchRef}
              onChange={debouncedHandleInputOnChange}
              className="search"
              placeholder={inputPlaceHolder}
              spellCheck="false"
            />
            <Button
              onClick={inputClick}
              onMouseEnter={(e) => handleMouseEnter(e, "Search")}
              onMouseLeave={handleMouseLeave}
              className="nav-search-icon"
            />
          </div>
          <div className="top-icons">
            <Button
              className="nav-btn"
              style={{ width: "2.8rem", height: "2.8rem" }}
            >
              <GridIcon />
            </Button>
            <Button
              disabled={(isLoading && UpToDatetrigger) || !UpToDatetrigger}
              className="nav-btn"
              onClick={handleRefresh}
              style={{ width: "2.8rem", height: "2.8rem" }}
              onMouseEnter={(e) => handleMouseEnter(e, "Refresh")}
              onMouseLeave={handleMouseLeave}
            >
              <AnimatePresence>
                {!isLoading && UpToDatetrigger && (
                  <motion.div
                    initial={{ opacity: 0 }} // Start with opacity 0 when the component first mounts
                    animate={{ opacity: 1 }} // Fade in to opacity 1 when it becomes visible
                    exit={{ opacity: 0, transition: { delay: 0.1 } }} // Fade out to opacity 0 when the component unmounts
                    transition={{ duration: 0.2 }}
                    style={{ position: "absolute", height: "18px" }}
                  >
                    <RefreshIcon />
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {isLoading && UpToDatetrigger && (
                  <motion.div
                    initial={{ opacity: 0 }} // Start with opacity 0 when the component first mounts
                    animate={{ opacity: 1 }} // Fade in to opacity 1 when it becomes visible
                    exit={{ opacity: 0, transition: { delay: 0.07 } }} // Fade out to opacity 0 when the component unmounts
                    transition={{ duration: 0.15 }}
                    style={{ position: "absolute", marginTop: "4px" }}
                  >
                    <Box>
                      <CircularProgress
                        sx={{
                          color: document.documentElement.classList.contains(
                            "dark-mode"
                          )
                            ? "#dfdfdf"
                            : "#292929",
                        }}
                        size={20}
                        thickness={5}
                      />
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {!UpToDatetrigger && (
                  <motion.div
                    initial={{ opacity: 0 }} // Start with opacity 0 when the component first mounts
                    animate={{ opacity: 1, transition: { duration: 0.35 } }} // Fade in to opacity 1 when it becomes visible
                    exit={{ opacity: 0, transition: { duration: 0.1 } }} // Fade out to opacity 0 when the component unmounts
                    transition={{ duration: 0.25 }}
                    style={{ position: "absolute", height: "22px" }}
                  >
                    <CloudIcon />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            <Button style={{ width: "2.8rem", height: "2.8rem" }}>
              <SettingsIcon />
            </Button>
          </div>
          <div
            style={{ marginRight: "2.3rem", padding: "8px" }}
            className="btn"
            onClick={handleProfileOpen}
            onMouseEnter={(e) =>
              handleMouseEnter(
                e,
                <>
                  <span style={{ fontSize: "0.85rem" }}>Notopia account</span>
                  <div style={{ opacity: "0.7", paddingTop: "0.2rem" }}>
                    {user.name}
                    <br />
                    {user.email}
                  </div>
                </>
              )
            }
            onMouseLeave={handleMouseLeave}
            ref={imageRef}
          >
            <img
              style={{ display: "block", userSelect: "none" }}
              className="profile-image"
              src={image}
              alt="pfp"
            />
          </div>
        </nav>
      )}
      <ProfileMenu
        user={user}
        ref={menuRef}
        menuPosition={menuPosition}
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        setSettingsOpen={setSettingsOpen}
      />

      <AnimatePresence>
        {settingsOpen && (
          <AccountSettings
            settingsRef={settingsRef}
            setIsOpen={setSettingsOpen}
            user={user}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(Navbar);
