import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const LOADING_DURATION_MS = 1000;

export const RouteLoadingOverlay = () => {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const hasMountedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      timeoutRef.current = null;
    }, LOADING_DURATION_MS);

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [pathname]);

  useEffect(() => {
    const hideOverlay = () => {
      setIsVisible(false);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        hideOverlay();
      }
    };

    window.addEventListener("pageshow", hideOverlay);
    window.addEventListener("focus", hideOverlay);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", hideOverlay);
      window.removeEventListener("focus", hideOverlay);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none fixed inset-0 z-140 flex items-center justify-center backdrop-blur-xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col items-center gap-5 rounded-[2rem] px-8 py-7"
          >
            <div className="relative flex h-14 w-14 items-center justify-center">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-zinc-200 border-t-orange-500"
              />
              <img
                src="/goose-logo.svg"
                alt="Goose logo"
                className="h-14 w-14 rounded-full object-cover"
              />
            </div>

            <div className="w-44 space-y-3 text-center">
              <motion.p
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                className="text-[11px] font-black uppercase tracking-[0.35em] text-orange-600"
              >
                Loading...
              </motion.p>

              <div className="relative h-2 overflow-hidden rounded-full bg-zinc-200/80">
                <motion.span
                  animate={{ x: ["-100%", "220%"] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                  className="absolute inset-y-0 left-0 w-20 rounded-full bg-orange-500"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
