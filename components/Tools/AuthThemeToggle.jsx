import { useEffect, useState, useId } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { useGlobalContext } from "@/context/GlobalContext";
import { usePathname } from "next/navigation";

const transition = { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.6 };

const properties = {
  dark: { r: 9, rotate: 40, cx: 12, cy: 4, opacity: 0 },
  light: { r: 5, rotate: 90, cx: 30, cy: 0, opacity: 1 },
};

export default function AuthThemeToggle({ isSmallScreen }) {
  const { isDarkMode, setIsDarkMode } = useGlobalContext();
  const pathname = usePathname();
  const maskId = useId();
  const [isLogin, setIsLogin] = useState(true);
  const [isDark, setIsDark] = useState(!isDarkMode);

  const initial = properties[!isDarkMode ? "dark" : "light"];
  const r = useMotionValue(initial.r);
  const cx = useMotionValue(initial.cx);
  const cy = useMotionValue(initial.cy);
  const opacity = useMotionValue(initial.opacity);
  const svgRotate = useMotionValue(initial.rotate);

  useEffect(() => {
    const {
      r: tr,
      cx: tcx,
      cy: tcy,
      opacity: to,
      rotate,
    } = properties[isDark ? "dark" : "light"];
    animate(r, tr, transition);
    animate(cx, tcx, transition);
    animate(cy, tcy, transition);
    animate(opacity, to, transition);
    animate(svgRotate, rotate, transition);
  }, [isDark]);

  useEffect(() => {
    const routeName = pathname.replace(/^\/|\/$/g, "").toLowerCase();
    setIsLogin(routeName === "auth/login");
  }, [pathname]);

  return (
    <button
      className={`auth-theme-toggle ${isSmallScreen ? "auth-theme-toggle-sm" : ""}`}
      style={{
        left: !isLogin ? "1.2rem" : "unset",
        right: !isLogin ? "unset" : "1.2rem",
      }}
      onClick={() => {
        setIsDark((p) => !p);
        requestIdleCallback(() => {
          document.documentElement.classList.toggle("dark-mode");
          const dark = document.documentElement.classList.contains("dark-mode");
          localStorage.setItem("theme", dark ? "dark" : "light");
          setIsDarkMode(dark);
        });
      }}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ cursor: "pointer", rotate: svgRotate }}
      >
        <mask id={maskId}>
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          {/* cx and cy passed as MotionValues directly — sets SVG attributes via setAttribute */}
          <motion.circle r="9" fill="black" cx={cx} cy={cy} />
        </mask>

        <motion.circle
          cx="12"
          cy="12"
          fill="white"
          mask={`url(#${maskId})`}
          r={r}
        />

        <motion.g style={{ opacity }}>
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </motion.g>
      </motion.svg>
    </button>
  );
}
