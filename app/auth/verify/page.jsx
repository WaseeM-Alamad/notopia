"use client";

import Modal from "@/components/Tools/Modal";
import { verifyTokenAction } from "@/utils/actions";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Page = () => {
  const router = useRouter();

  const [isExpired, setIsExpired] = useState("loading...");
  const [showPassword, setShowPassword] = useState(false);
  const [PassStatus, setPassStatus] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setIsExpired(true);
      return;
    }

    const verify = async () => {
      const { success } = await verifyTokenAction(token);
      setIsExpired(!success);
    };

    verify();
  }, []);

  return (
    <Modal>
      <motion.div
        initial={{
          scale: 0.9,
          opacity: 0,
        }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 50, mass: 1 }}
        className="verify-acc-container"
      >
        <div className="verify-acc">
          <div>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>
              {isExpired
                ? "Authorization link has expired."
                : "Email verified."}{" "}
            </div>
            {isExpired && (
              <div style={{ fontSize: "1rem" }}>
                Please log in to resend the link.
              </div>
            )}
          </div>
          <div
            onClick={() => router.push("/auth/login")}
            style={{ marginTop: "auto" }}
            className="login-btn"
          >
            Log In
          </div>
        </div>
      </motion.div>
    </Modal>
  );
};

export default Page;
