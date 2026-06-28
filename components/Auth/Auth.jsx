"use client";
import { usePathname } from "next/navigation";
import "@/assets/styles/login.css";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import RightPanel from "./RightPanel";
import LeftPanel from "./LeftPanel";
import AuthSlider from "./AuthSlider";
import ThemeToggle from "../Tools/ThemeToggle";
import NotopiaLogo from "../icons/NotopiaLogo";

const Auth = () => {
  const pathname = usePathname();
  const [isLogin, setIsLogin] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [googleIsLoading, setGoogleIsLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    <>
      <ThemeToggle />
      <motion.div
        initial={{ transform: "translate(-50%, -50%) scale(0.9)", opacity: 0 }}
        animate={{ transform: "translate(-50%, -50%) scale(1)", opacity: 1 }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
          // staggerChildren: 0.05,
          // delayChildren: 0.1,
        }}
        className="login-container"
      >
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
      </motion.div>
    </>
  );
};

export default Auth;
