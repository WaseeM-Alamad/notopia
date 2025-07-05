"use client";

import HorizontalLoader from "@/components/Tools/horizontalLoader";
import Modal from "@/components/Tools/Modal";
import { verifyTokenAction } from "@/utils/actions";
import { CircularProgress } from "@mui/material";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Page = () => {
  const router = useRouter();

  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginIsLoading, setLoginIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setIsExpired(true);
      setIsLoading(false);
      return;
    }

    const verify = async () => {
      const { success } = await verifyTokenAction(token);
      setIsExpired(!success);
      setIsLoading(false);
    };

    verify();
  }, []);

  return (
    <>
      <Modal
        initial={{
          scale: 0.9,
          opacity: 0,
        }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 50, mass: 1 }}
        isOpen={true}
        className="verify-acc-container"
        style={
          isLoading ? { maxWidth: "400px", maxHeight: "250px" } : undefined
        }
      >
        <div className="verify-acc">
          <div
            style={
              isLoading
                ? {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    marginBottom: "1rem",
                  }
                : undefined
            }
          >
            <div
              style={{
                fontSize: isLoading ? "1.7rem" : "1.5rem",
                marginBottom: "0.4rem",
                userSelect: "none",
              }}
            >
              {!isLoading
                ? isExpired
                  ? "Authorization link has expired"
                  : "Email verified"
                : "Please wait..."}
            </div>
            {
              isLoading ? (
                <HorizontalLoader color="#2b2663" size={0.8} />
              ) : isExpired ? (
                <div style={{ fontSize: "1rem" }}>
                  Please sign in to resend the link
                </div>
              ) : null
            }
          </div>
          {!isLoading && (
            <div
              onClick={() => {
                setLoginIsLoading(true);
                router.push("/auth/login");
              }}
              style={{ marginTop: "auto" }}
              className="login-btn"
            >
              {!loginIsLoading ? (
                "Sign In"
              ) : (
                <CircularProgress
                  sx={{
                    color: document.documentElement.classList.contains(
                      "dark-mode"
                    )
                      ? " #292929"
                      : "#dfdfdf",
                  }}
                  size={20}
                  thickness={5}
                />
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default Page;
