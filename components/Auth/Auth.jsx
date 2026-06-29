"use client";
import { usePathname } from "next/navigation";
import "@/assets/styles/login.css";
import { useEffect, useState } from "react";
import RightPanel from "./RightPanel";
import LeftPanel from "./LeftPanel";
import AuthSlider from "./AuthSlider";
import AuthThemeToggle from "../Tools/AuthThemeToggle";

const Auth = () => {
  const pathname = usePathname();
  const [isLogin, setIsLogin] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [googleIsLoading, setGoogleIsLoading] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handler = () => {
      const height = window.innerHeight;
      const width = window.innerWidth;
      if (width > 900 && height > 670) return;
      setIsSmallScreen(true);
    };

    handler();

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [isSmallScreen]);

  useEffect(() => {
    console.log(isSmallScreen);
  }, [isSmallScreen]);

  useEffect(() => {
    const routeName = pathname.replace(/^\/|\/$/g, "").toLowerCase();
    setIsLogin(routeName === "auth/login");
  }, [pathname]);

  const toggleForm = () => {
    const newRoute = isLogin ? "/auth/signup" : "/auth/login";
    window.history.pushState(null, "", newRoute);
  };

  if (!isClient) return null;

  return (
    <div id="idk" className={isSmallScreen ? "no-mount-animation" : ""}>
      <div className={`auth-container`}>
        <AuthThemeToggle isSmallScreen={true} />
        <AuthSlider isLogin={isLogin} />
        <RightPanel
          isLogin={isLogin}
          toggleForm={toggleForm}
          googleIsLoading={googleIsLoading}
          setGoogleIsLoading={setGoogleIsLoading}
        />

        <LeftPanel
          isLogin={isLogin}
          toggleForm={toggleForm}
          googleIsLoading={googleIsLoading}
          setGoogleIsLoading={setGoogleIsLoading}
        />
      </div>
    </div>
  );
};

export default Auth;
