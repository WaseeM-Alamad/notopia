"use client";
import "@/assets/styles/navbar.css";
import React, { useEffect, useState, useRef } from "react";
import HighlightIcon from "@mui/icons-material/Highlight";
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
import Image from "next/image";
import notopia from "@/public/notopia.svg";

const Navbar = ({ image, name, email, handleRefresh }) => {
  const router = useRouter();
  const [rotation, setRotation] = useState(false);
  const [click, setClick] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState();
  const [searchTrigger, setSearchTrigger] = useState(false);
  const [LogoDis, setLogoDis] = useState(true);
  const [screenTrigger, setScreentrigger] = useState(false);
  const [buttonDisable, setButtonDisable] = useState(false);
  const [loadNav, setLoadNav] = useState(false);
  const searchRef = useRef(null);

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

  const [isGridLayout, setIsGridLayout] = useState(false);

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

  // Dispatch the custom event whenever isGridLayout changes
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("layoutChange", { detail: isGridLayout })
    );
  }, [isGridLayout]);

  return (
    <>
      <Sidebar />
      <nav
        style={{
          boxShadow: isScrolled ? "0 3px 10px rgba(0, 0, 0, 0.2)" : "",
          transition: "box-shadow 0.3s ease-in",
        }}
      >
        {(LogoDis || searchTrigger) && (
          <Link href="/home" className="logoButton">
            <Image
              width={130}
              style={{ marginLeft: "1.4rem" }}
              alt="logo"
              src={notopia}
            />
          </Link>
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
            <Tooltip title="Search" disableInteractive>
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
          <Tooltip title="Refresh" disableInteractive>
            <IconButton
              onClick={() => {
                setLoadNav((prev) => !prev);
                handleRefresh(loadNav);
              }}
              disableTouchRipple
              sx={{
                padding: "10px",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip
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
                disabled={buttonDisable}
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
          <Tooltip title="Settings">
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
