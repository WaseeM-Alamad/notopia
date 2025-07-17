"use client";
import { usePathname } from "next/navigation";
import "@/assets/styles/login.css";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import RightPanel from "./RightPanel";
import LeftPanel from "./LeftPanel";

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
      <motion.div
        initial={{ transform: "translate(-50%, -50%) scale(0.9)", opacity: 0 }}
        animate={{ transform: "translate(-50%, -50%) scale(1)", opacity: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 50, mass: 1 }}
        className="login-container"
      >
        <motion.div
          initial={{
            transform: isLogin ? "translateX(85.19%)" : "translateX(0%)",
            borderTopLeftRadius: isLogin ? "1.5rem" : "0",
            borderBottomLeftRadius: isLogin ? "1.5rem" : "0",
            borderTopRightRadius: !isLogin ? "1.5rem" : "0",
            borderBottomRightRadius: !isLogin ? "1.5rem" : "0",
          }}
          animate={{
            transform: isLogin ? "translateX(85.19%)" : "translateX(0%)",
            borderTopLeftRadius: isLogin ? "1.5rem" : "0",
            borderBottomLeftRadius: isLogin ? "1.5rem" : "0",
            borderTopRightRadius: !isLogin ? "1.5rem" : "0",
            borderBottomRightRadius: !isLogin ? "1.5rem" : "0",
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 30,
            mass: 1.25,
          }}
          className="login-slider"
        />
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
