"use client";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "@/assets/styles/navbar.css";
import RefreshIcon from "../icons/RefreshIcon";
import SettingsIcon from "../icons/SettingsIcon";
import GridIcon from "../icons/GridIcon";
import CloudIcon from "../icons/CloudIcon";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../Tools/Button";
import Logo from "../icons/Logo";
import ProfileMenu from "./ProfileMenu";
import { useSearch } from "@/context/SearchContext";
import { debounce } from "lodash";
import { useAppContext } from "@/context/AppContext";
import AccountDialog from "./AccountDialog";
import ListIcon from "../icons/ListIcon";
import SearchIcon from "../icons/SearchIcon";
import InputSearchIcon from "../icons/InputSearchIcon";
import LeftArrow from "../icons/LeftArrow";
import KeybindsTable from "./KeybindsTable";
import LocalSaveIcon from "../icons/LocalSaveIcon";
import CustomThreeLineSpinner from "../Tools/CustomSpinner";

const Navbar = () => {
  const {
    labelSearchTerm,
    setLabelSearchTerm,
    setSearchTerm,
    searchRef,
    skipHashChangeRef,
    filters: searchFilters,
  } = useSearch();
  const {
    labelsRef,
    labelsReady,
    ignoreKeysRef,
    layout,
    setLayout,
    isFiltered,
    currentSection,
    initialLoading,
    user,
    setUser,
    showTooltip,
    hideTooltip,
    closeToolTip,
    setBindsOpenRef,
    isOnline,
    setIsExpanded,
    lockScroll,
    session,
    status,
  } = useAppContext();
  const [isLoading, setIsLoading] = useState(0);
  const [UpToDatetrigger, setUpToDateTrigger] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bindsOpen, setBindsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showInput, setShowInput] = useState(null);
  const [showLayoutBtn, setShowLayoutBtn] = useState(false);
  const [showNav, setShowNav] = useState(true);
  const [threshold1, setThreshold1] = useState(false);
  const [threshold2, setThreshold2] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: 100,
    left: 600,
  });
  const image = user?.image;
  const isFirstRunRef = useRef(true);
  const imageRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const width = window.innerWidth;
    setShowInput(!(width < 795));
    requestAnimationFrame(() => {
      handleResizeLayout();
    });
    setIsClient(true);
  }, []);

  useEffect(() => {
    setBindsOpenRef.current = setBindsOpen;
  }, []);

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

    window.addEventListener("loadingStart", startLoading);
    window.addEventListener("loadingEnd", stopLoading);

    return () => {
      window.removeEventListener("loadingStart", startLoading);
      window.removeEventListener("loadingEnd", stopLoading);
    };
  }, []);

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
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
        event.returnValue = message;
        return message;
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

  const doubleDecode = (str) => {
    return decodeURIComponent(decodeURIComponent(str));
  };

  const [inputPlaceHolder, setInputPlaceHolder] = useState("Search notes");

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace("#", "");

      if (hash.toLowerCase().startsWith("note/")) {
        return;
      }

      requestAnimationFrame(() => {
        if (hash === "search" || hash.startsWith("search/")) {
          setShowClearBtn(true);
        } else {
          setShowClearBtn(false);
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
      } else if (currentSection?.toLowerCase() === "labels") {
        setInputPlaceHolder("Search labels");
      } else {
        setInputPlaceHolder("Search notes");
      }
    };

    handler();

    window.addEventListener("hashchange", handler);
    return () => {
      window.removeEventListener("hashchange", handler);
    };
  }, [labelsReady, searchFilters, currentSection]);

  useEffect(() => {
    const handler = () => {
      requestAnimationFrame(() => {
        const width = window.innerWidth;
        if (width < 605) return;
        if (currentSection?.toLowerCase() === "search") {
          setShowLayoutBtn(isFiltered);
        } else {
          setShowLayoutBtn(true);
        }
      });
    };

    handler();

    window.addEventListener("hashchange", handler);
    return () => {
      window.removeEventListener("hashchange", handler);
    };
  }, [currentSection, isFiltered]);

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
    if (currentHash.startsWith("search") || currentHash === "labels") {
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
        const hash = window.location.hash.replace("#", "");
        if (hash === "labels") {
          setLabelSearchTerm(e.target.value.trim());
        } else {
          skipHashChangeRef.current = true;
          setSearchTerm(e.target.value.trim());
        }
      }, 300),
    []
  );

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

  const handleResizeLayout = useCallback(() => {
    const width = window.innerWidth;
    const focused = searchRef.current === document.activeElement;

    if (width < 795) {
      setThreshold1(true);
      if (!focused || !threshold1) {
        setShowInput(false);
        setShowNav(true);
      }
    } else {
      setThreshold1(false);
      setShowInput(true);
      setShowNav(true);
    }

    if (width <= 605) {
      setThreshold2(true);
      setShowLayoutBtn(false);
    } else {
      setThreshold2(false);
      if (currentSection?.toLowerCase() === "search") {
        if (isFiltered) {
          setShowLayoutBtn(true);
        }
      } else {
        setShowLayoutBtn(true);
      }
    }
  }, [currentSection, isFiltered, threshold1]);

  useEffect(() => {
    window.addEventListener("resize", handleResizeLayout);
    return () => window.removeEventListener("resize", handleResizeLayout);
  }, [handleResizeLayout]);

  if (!isClient || !currentSection) {
    return;
  }

  return (
    <>
      <nav
        className={isScrolled && currentSection === "Home" ? "nav-shadow" : ""}
        style={{
          minWidth: threshold2 && "0",
        }}
      >
        {/* rgba(67, 71, 85, 0.27) 0px 0px 0.25em, rgba(90, 125, 188, 0.05) 0px 0.25em 1em */}
        <div
          className="logo"
          style={{
            display: !showNav && "none",
            flex: threshold2 ? "1 1 auto" : "1 0 auto",
            minWidth: !threshold2 && "23%",
          }}
        >
          <Button
            onMouseEnter={(e) =>
              showTooltip(
                e,
                <span style={{ fontWeight: "550" }}>Main menu</span>
              )
            }
            onMouseLeave={hideTooltip}
            onClick={() => {
              closeToolTip();
              const width = window.innerWidth;
              setIsExpanded((prev) => ({
                open: !prev.open,
                threshold: width < 605 ? "before" : "after",
              }));
            }}
            className="side-expand-btn"
          />
          {/* <Logo style={{ margin: "auto 0", flexShrink: "0" }} /> */}
          <span
            onClick={() => (window.location.hash = "home")}
            className="notopia"
          >
            Notopia
          </span>
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
              // style={{
              //   display: !showInput && "none",
              //   position: threshold1 && "absolute",
              //   top: threshold1 && 0,
              //   right: threshold1 ? (showLayoutBtn ? "146px" : "100px") : null,
              //   width: threshold1
              //     ? showLayoutBtn
              //       ? "calc(100% - 156px)"
              //       : "calc(100% - 110px)"
              //     : null,
              // }}
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
              <div style={{ padding: "0 0.5rem" }}>
                <Button
                  tabIndex="-1"
                  onClick={
                    threshold1
                      ? () => {
                          closeToolTip();
                          setShowNav(true);
                          setShowInput(false);
                        }
                      : inputClick
                  }
                  onMouseEnter={(e) =>
                    showTooltip(e, threshold1 ? "Close search" : "Search")
                  }
                  onMouseLeave={hideTooltip}
                  onFocus={(e) =>
                    showTooltip(e, threshold1 ? "Close search" : "Search")
                  }
                  onBlur={hideTooltip}
                  className="nav-btn nav-search-icon"
                >
                  {threshold1 ? <LeftArrow /> : <InputSearchIcon />}
                </Button>
              </div>
              <input
                onClick={inputClick}
                ref={searchRef}
                dir="auto"
                onChange={debouncedHandleInputOnChange}
                className="search"
                placeholder={inputPlaceHolder}
                spellCheck="false"
              />

              <div
                style={{
                  padding: "0 0.5rem",
                  display: !showClearBtn && "none",
                }}
              >
                <Button
                  onClick={handleClearSearch}
                  className="clear-search-icon"
                  onMouseEnter={(e) => showTooltip(e, "Clear search")}
                  onMouseLeave={hideTooltip}
                  onFocus={(e) => showTooltip(e, "Clear search")}
                  onBlur={hideTooltip}
                />
              </div>
              <div
                style={{
                  padding: "0 0.5rem",
                  display: currentSection?.toLowerCase() !== "labels" && "none",
                }}
              >
                <Button
                  onClick={() => {
                    closeToolTip();

                    if (labelSearchTerm.trim()) {
                      setLabelSearchTerm("");
                      searchRef.current.value = "";
                    } else {
                      window.location.hash = "search";
                    }
                  }}
                  className={
                    labelSearchTerm.trim()
                      ? "clear-search-icon"
                      : "filter-search-icon"
                  }
                  onMouseEnter={(e) =>
                    showTooltip(
                      e,
                      labelSearchTerm.trim()
                        ? "Clear search"
                        : "Advanced filters"
                    )
                  }
                  onMouseLeave={hideTooltip}
                  onFocus={(e) =>
                    showTooltip(
                      e,
                      labelSearchTerm.trim()
                        ? "Clear search"
                        : "Advanced filters"
                    )
                  }
                  onBlur={hideTooltip}
                />
              </div>
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
                requestAnimationFrame(() => {
                  const hash = window.location.hash.replace("#", "");
                  if (!hash.startsWith("search")) {
                    const width = window.innerWidth;
                    setShowInput(true);
                    if (width < 795) {
                      setShowNav(false);
                    }
                    requestAnimationFrame(() => {
                      searchRef.current.focus();
                    });
                  }
                });
              }}
              style={{ display: showInput && "none" }}
              onMouseEnter={(e) => showTooltip(e, "Search")}
              onMouseLeave={hideTooltip}
              onFocus={(e) => showTooltip(e, "Search")}
              onBlur={hideTooltip}
              className="nav-btn"
            >
              <SearchIcon />
            </Button>
            <Button
              onMouseEnter={(e) =>
                showTooltip(e, layout === "grid" ? "List view" : "Grid view")
              }
              onMouseLeave={hideTooltip}
              onFocus={(e) =>
                showTooltip(e, layout === "grid" ? "List view" : "Grid view")
              }
              onBlur={hideTooltip}
              onClick={toggleLayout}
              className="nav-btn"
              style={
                {
                  // display: !showLayoutBtn && "none",
                }
              }
            >
              {layout === "grid" ? <ListIcon /> : <GridIcon />}
            </Button>
            <Button
              disabled={(isLoading && UpToDatetrigger) || !UpToDatetrigger}
              className="nav-btn"
              onClick={handleRefresh}
              onMouseEnter={(e) => showTooltip(e, "Refresh")}
              onMouseLeave={hideTooltip}
              onFocus={(e) => showTooltip(e, "Refresh")}
              onBlur={hideTooltip}
            >
              <AnimatePresence>
                {!isLoading && UpToDatetrigger && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { delay: 0.1 } }}
                    transition={{ duration: 0.2 }}
                    style={{ position: "absolute", display: "flex" }}
                  >
                    <RefreshIcon />
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {isLoading && UpToDatetrigger && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { delay: 0.07 } }}
                    transition={{ duration: 0.15 }}
                    style={{ position: "absolute", display: "flex" }}
                  >
                    <CustomThreeLineSpinner
                      size={20}
                      strokeWidth={2.8}
                      color={
                        document.documentElement.classList.contains("dark-mode")
                          ? "#dfdfdf"
                          : "#292929"
                      }
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {!UpToDatetrigger && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.35 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    transition={{ duration: 0.25 }}
                    style={{ position: "absolute", display: "flex" }}
                  >
                    {isOnline ? <CloudIcon /> : <LocalSaveIcon />}
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            {/* <Button disabled={true} className="nav-btn">
              <SettingsIcon />
            </Button> */}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            paddingRight: "1rem",
            paddingLeft: "1rem",
            flex: "0 0 auto",
          }}
        >
          <div
            style={{ padding: "8px", opacity: "1" }}
            className="btn"
            onClick={handleProfileOpen}
            onMouseEnter={(e) =>
              showTooltip(
                e,
                <>
                  <span style={{ fontSize: "0.85rem" }}>Notopia account</span>
                  <div style={{ opacity: "0.7", paddingTop: "0.2rem" }}>
                    {user?.username}
                    <br />
                    {user?.email}
                  </div>
                </>
              )
            }
            onMouseLeave={hideTooltip}
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
      <AnimatePresence>
        {isMenuOpen && (
          <ProfileMenu
            user={user}
            ref={menuRef}
            menuPosition={menuPosition}
            isOpen={isMenuOpen}
            setIsOpen={setIsMenuOpen}
            setSettingsOpen={setSettingsOpen}
            setBindsOpen={setBindsOpen}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <AccountDialog
            isOpen={settingsOpen}
            setIsOpen={setSettingsOpen}
            user={user}
            setUser={setUser}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bindsOpen && (
          <KeybindsTable
            keybindsRef={keybindsRef}
            isOpen={bindsOpen}
            setIsOpen={setBindsOpen}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(Navbar);
