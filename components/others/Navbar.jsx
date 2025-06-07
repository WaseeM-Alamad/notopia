"use client";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import "@/assets/styles/navbar.css";
import RefreshIcon from "../icons/RefreshIcon";
import SettingsIcon from "../icons/SettingsIcon";
import GridIcon from "../icons/GridIcon";
import { CircularProgress } from "@mui/material";
import { Box } from "@mui/system";
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
import ListIcon from "../icons/ListIcon";
import SearchIcon from "../icons/SearchIcon";
import InputSearchIcon from "../icons/InputSearchIcon";

const Navbar = ({ user }) => {
  const {
    setSearchTerm,
    searchRef,
    skipHashChangeRef,
    filters: searchFilters,
  } = useSearch();
  const { labelsRef, labelsReady, ignoreKeysRef, layout, setLayout } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(0);
  const [UpToDatetrigger, setUpToDateTrigger] = useState(true);
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [showLayoutBtn, setShowLayoutBtn] = useState(false);
  const [showNav, setShowNav] = useState(true);
  const [threshold1, setThreshold1] = useState(false);
  const [threshold2, setThreshold2] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: 100,
    left: 600,
  });
  const image = user?.image;
  const firstRun = useRef(true);
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

      requestAnimationFrame(() => {
        if (hash === "search" || hash.startsWith("search/")) {
          setShowLayoutBtn(false);
          setShowClearBtn(true);
        } else {
          const width = window.innerWidth;
          setShowClearBtn(false);
          if (width >= 605) {
            setShowLayoutBtn(true);
          }
        }
      });

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
    };

    handler();

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

  const toggleLayout = () => {
    closeToolTip();
    if (layout === "grid") {
      localStorage.setItem("layout", "list");
      setLayout("list");
    } else {
      localStorage.setItem("layout", "grid");
      setLayout("grid");
    }
  };

  // 795  600

  useEffect(() => {
    const handler = () => {
      const width = window.innerWidth;
      const hash = window.location.hash.replace("#", "");
      const focused = searchRef.current === document.activeElement;

      if (width < 795) {
        setThreshold1(true);
        setShowInput(false);
        setShowNav(true);
      } else {
        setThreshold1(false);
        setShowInput(true);
        setShowNav(true);
      }

      if (width < 605) {
        setLayout("list");
        setThreshold2(true);
        setShowLayoutBtn(false);
      } else {
        setThreshold2(false);
        const savedLayout = localStorage.getItem("layout");
        setLayout(savedLayout);
        if (!hash.startsWith("search")) {
          setShowLayoutBtn(true);
        }
      }
    };

    handler();

    window.addEventListener("resize", handler);

    return () => window.removeEventListener("resize", handler);
  }, []);

  if (!isClient) return;

  return (
    <>
      {tooltipAnchor?.display && <Tooltip anchorEl={tooltipAnchor} />}
      <nav
        style={{
          minWidth: threshold2 && "0",
          boxShadow:
            isScrolled &&
            " rgba(67, 71, 85, 0.27) 0px 0px 0.25em, rgba(90, 125, 188, 0.05) 0px 0.25em 1em",
        }}
      >
        <div
          className="logo"
          style={{
            display: !showNav && "none",
            overflow: "hidden",
            marginLeft: "1.2rem",
            flex: threshold2 ? "1 1 auto" : "1 0 auto",
            minWidth: !threshold2 && "23%",
          }}
        >
          {/* <Logo style={{margin: "auto 0"}} /> */}
          <span style={{ marginLeft: "0rem" }}>Notopia</span>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            verticalAlign: "middle",
            justifyContent: "flex-end",
            flex: !showInput && threshold2 ? "0 0 auto" : "1 1 100%",
            whiteSpace: "nowrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              maxWidth: "100%",
              // flex: "1 1 auto",
              width: "100%",
              boxSizing: "border-box",
              padding: "0 0.625rem",
              height: "75%",
            }}
          >
            <div
              style={{
                display: !showInput && "none",
                position: threshold1 && "absolute",
                top: threshold1 && 0,
                right: threshold1 && "100px",
                width: threshold1 && "calc(100% - 110px)",
                // left: "3px"
              }}
              tabIndex="0"
              className="search-wrapper"
              onBlur={(e) => {
                const width = window.innerWidth;
                if (width >= 795) return;
                const element = e.currentTarget;
                const nextFocused = e.relatedTarget;

                if (!element.contains(nextFocused)) {
                  setShowNav(true);
                  setShowInput(false);
                }
              }}
            >
              <Button
                onClick={inputClick}
                onMouseEnter={(e) => handleMouseEnter(e, "Search")}
                onMouseLeave={handleMouseLeave}
                className="nav-btn nav-search-icon"
              >
                <InputSearchIcon />
              </Button>
              <input
                onClick={inputClick}
                ref={searchRef}
                dir="auto"
                onChange={debouncedHandleInputOnChange}
                className="search"
                placeholder={inputPlaceHolder}
                spellCheck="false"
              />

              <Button
                onClick={handleClearSearch}
                style={{ display: !showClearBtn && "none" }}
                className="clear-search-icon"
                onMouseEnter={(e) => handleMouseEnter(e, "Clear search")}
                onMouseLeave={handleMouseLeave}
              />
            </div>
          </div>
          <div className="top-icons">
            <Button
              onClick={() => {
                const hash = window.location.hash.replace("#", "");

                inputClick();

                if (hash.startsWith("search")) {
                  const width = window.innerWidth;
                  setShowInput(true);
                  if (width < 795) {
                    setShowNav(false);
                  }
                  requestAnimationFrame(() => {
                    searchRef.current.focus();
                  });
                }
              }}
              style={{ display: showInput && "none" }}
              onMouseEnter={(e) => handleMouseEnter(e, "Search")}
              onMouseLeave={handleMouseLeave}
              className="nav-btn"
            >
              <SearchIcon />
            </Button>
            <Button
              onMouseEnter={(e) =>
                handleMouseEnter(
                  e,
                  layout === "grid" ? "List view" : "Grid view"
                )
              }
              onMouseLeave={handleMouseLeave}
              onClick={toggleLayout}
              className="nav-btn"
              style={{
                display: !showLayoutBtn && "none",
              }}
            >
              {layout === "grid" ? <ListIcon /> : <GridIcon />}
            </Button>
            <Button
              disabled={(isLoading && UpToDatetrigger) || !UpToDatetrigger}
              className="nav-btn"
              onClick={handleRefresh}
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
            <Button disabled={true} className="nav-btn">
              <SettingsIcon />
            </Button>
          </div>
        </div>

        <div
          style={{
            display: "flex",

            paddingRight: "1.8rem",
            paddingLeft: "1rem",
            flex: "0 0 auto",
          }}
        >
          <div
            style={{ padding: "8px" }}
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
              className="profile-image"
              draggable="false"
              src={image}
              alt="pfp"
            />
          </div>
        </div>
      </nav>
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
