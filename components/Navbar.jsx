"use client";
import "@/assets/styles/navbar.css";
import React, { useEffect, useState, useRef } from "react";
import ListIcon from "./ListIcon";
import GridIcon from "./GridIcon";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import SettingsIcon from "./SettingsIcon";
import Link from "next/link";
import RefreshIcon from "./RefreshIcon";
import { useRouter } from "next/navigation";
import SearchIcon from "./SearchIcon";
import ProfileMenu from "@/components/ProfileMenu";
import Sidebar from "./SideBar";
import CircularProgress from "@mui/material/CircularProgress";
import { DehazeSharp, HighlightSharp } from "@mui/icons-material";
import { useAppContext } from "@/context/AppContext";

const Navbar = ({ image, name, email }) => {
  const router = useRouter();
  const [rotation, setRotation] = useState(false);
  const [click, setClick] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState();
  const [searchTrigger, setSearchTrigger] = useState(false);
  const [LogoDis, setLogoDis] = useState(true);
  const [screenTrigger, setScreentrigger] = useState(false);
  const { isLoading, setIsLoading } = useAppContext();
  const { loadTrigger, setLoadTrigger } = useAppContext();
  const [isGridLayout, setIsGridLayout] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const isGridLayout = localStorage.getItem("isGridLayout");
    setClick(isGridLayout === "true");
  }, []);

  const TooltipPosition = {
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, -11], // Adjust position (x, y)
        },
      },
    ],
  };

  const slotProps = {
    tooltip: {
      sx: {
        height: "fit-content",
        margin: "0",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        fontFamily: "Roboto",
        fontWeight: "400",
        fontSize: "0.76rem",
        padding: "5px 8px 5px 8px",
      },
    },
  };

  const handleScroll = () => {
    if (window.scrollY > 0) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function handleSearch(event) {
    const { value } = event.target;
    setSearchQuery(value);
    if (searchQuery) {
      router.push(`/home?Search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/");
    }
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 794) {
        setSearchTrigger(true);
        setScreentrigger(true);
      } else if (window.innerWidth > 794) {
        setScreentrigger(false);
        setSearchTrigger(false);
        setLogoDis(true);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!searchTrigger && screenTrigger) searchRef.current.focus();
  }, [searchTrigger]);

  function handleBlur() {
    if (screenTrigger) {
      setSearchTrigger(true);
    }
  }

  useEffect(() => {
    const savedLayout = localStorage.getItem("isGridLayout");
    if (savedLayout !== null) {
      setIsGridLayout(JSON.parse(savedLayout));
    }
  }, []);

  const handleToggle = () => {
    setClick((prev) => !prev);
    setIsGridLayout((prev) => {
      const newLayout = !prev;
      localStorage.setItem("isGridLayout", JSON.stringify(newLayout));
      return newLayout;
    });
  };

  const handleSideTrigger = () => {
    setSideTrigger((prev) => {
      const newLayout = !prev;
      localStorage.setItem("sideBarTrigger", JSON.stringify(newLayout));
      return newLayout;
    });
  };

  // Dispatch the custom event whenever isGridLayout changes
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("layoutChange", { detail: isGridLayout })
    );
  }, [isGridLayout]);

  useEffect(() => {
    const handler = (event) => {
      setIsLoading(event.detail);
    };

    window.addEventListener("isLoading", handler);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("isLoading", handler);
    };
  }, []);

  const [sideTrigger, setSideTrigger] = useState(() => {
    const sideTrigger = localStorage.getItem("sideBarTrigger");
    console.log("side Trigger: " + sideTrigger);
    return sideTrigger === "true";
  });

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("sideBarTrigger", { detail: sideTrigger })
    );
  }, [sideTrigger]);

  return (
    <>
      <Sidebar sideTrigger={sideTrigger} />
      <nav
        style={{
          boxShadow: isScrolled ? "0 3px 10px rgba(0, 0, 0, 0.2)" : "",
          transition: "box-shadow 0.3s ease-in",
        }}
      >
        {(LogoDis || searchTrigger) && (
          <>
            <div style={{ paddingLeft: "0.9rem" }}>
              <Tooltip
                slotProps={slotProps}
                PopperProps={{
                  modifiers: [
                    {
                      name: "offset",
                      options: {
                        offset: [11, -11], // Adjust position (x, y)
                      },
                    },
                  ],
                }}
                title="Main menu"
                disableInteractive
              >
                <IconButton
                  disableTouchRipple
                  onClick={handleSideTrigger}
                  sx={{
                    padding: "10px",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                  }}
                >
                  <DehazeSharp sx={{ color: "#5f6368" }} />
                </IconButton>
              </Tooltip>
            </div>
            <Link href="/home" className="logoButton">
              <HighlightSharp
                sx={{ paddingBottom: "0.3rem", paddingRight: "0.3rem" }}
              />
              <h1 style={{ fontSize: "1.7rem" }}>Notopia</h1>
            </Link>
          </>
        )}

        {!searchTrigger && (
          <input
            ref={searchRef}
            onChange={handleSearch}
            onBlur={handleBlur}
            value={searchQuery}
            className="search"
            placeholder="Search notes"
            type="text"
            style={{ width: LogoDis ? "50%" : "100%" }}
          />
        )}

        <div className="navTools">
          {searchTrigger && (
            <Tooltip
              slotProps={slotProps}
              PopperProps={TooltipPosition}
              title="Search"
              disableInteractive
            >
              <IconButton
                onClick={() => {
                  setSearchTrigger(false);
                  setLogoDis(false);
                }}
                disableTouchRipple
                sx={{
                  padding: "10px",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                }}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip
            slotProps={slotProps}
            PopperProps={TooltipPosition}
            title="Refresh"
            disableInteractive
            disableHoverListener={isLoading}
          >
            <IconButton
              onClick={() => setLoadTrigger((prev) => !prev)}
              disableTouchRipple
              sx={{
                padding: "10px",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
              }}
              disabled={isLoading}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress
                      sx={{
                        color: "#757575",
                        borderRadius: "50%",
                        position: "absolute",
                        rotate: "260deg",
                      }}
                      size={19}
                      thickness={5}
                    />
                  </>
                ) : (
                  <>
                    <RefreshIcon isLoading={isLoading} />
                  </>
                )}
              </div>
            </IconButton>
          </Tooltip>

          <Tooltip
            slotProps={slotProps}
            PopperProps={TooltipPosition}
            title={!click ? "List view" : "Grid view"}
            disableInteractive
          >
            <span>
              <IconButton
                disableTouchRipple
                sx={{
                  padding: "10px",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                }}
                onClick={handleToggle}
              >
                <div
                  style={{
                    display: !click ? "flex" : "none",
                    visibility: !click ? "visible" : "hidden",
                  }}
                >
                  <ListIcon />
                </div>

                <div
                  style={{
                    display: click ? "flex" : "none",
                    justifyContent: "center",
                    alignItems: "center",
                    visibility: click ? "visible" : "hidden",
                  }}
                >
                  <GridIcon />
                </div>
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip
            slotProps={slotProps}
            PopperProps={TooltipPosition}
            title="Settings"
            disableInteractive
          >
            <IconButton
              onClick={() => setRotation((prev) => !prev)}
              disableTouchRipple
              sx={{
                padding: "10px",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
              }}
            >
              <SettingsIcon rotation={rotation ? "120deg" : "180deg"} />
            </IconButton>
          </Tooltip>
        </div>
        <div className="account">
          <Tooltip
            slotProps={slotProps}
            PopperProps={TooltipPosition}
            title={
              <span>
                <p style={{ color: "#a4a9ad" }}>{name}</p>
                <p>{email}</p>
              </span>
            }
            disableInteractive
          >
            <ProfileMenu image={image} name={name} />
          </Tooltip>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
