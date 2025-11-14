"use client";

import { useEffect } from "react";

export default function PolyfillClient() {
  useEffect(() => {
    if (!window.requestIdleCallback) {
      window.requestIdleCallback = function (cb) {
        return setTimeout(() => {
          const start = Date.now();
          cb({
            didTimeout: false,
            timeRemaining() {
              return Math.max(0, 50 - (Date.now() - start));
            },
          });
        }, 1);
      };

      window.cancelIdleCallback = function (id) {
        clearTimeout(id);
      };
    }
  }, []);

  return null;
}
