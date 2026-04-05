import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minimize2, Play, Volume2, VolumeX, X } from "lucide-react";

export const FloatingBrandVideo = () => {
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasManuallyClosed, setHasManuallyClosed] = useState(false);
  const shouldHideVideoTrigger = location.pathname === "/checkout";

  useEffect(() => {
    if (location.pathname === "/origin" && !hasManuallyClosed) {
      setIsExpanded(true);
    }
  }, [hasManuallyClosed, location.pathname]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;

    if (isExpanded) {
      void video.play().catch(() => undefined);
      return;
    }

    video.pause();
  }, [isExpanded, isMuted]);

  const handleOpen = () => {
    setHasManuallyClosed(false);
    setIsExpanded(true);
  };

  const handleClose = () => {
    setHasManuallyClosed(true);
    setIsExpanded(false);
  };

  if (shouldHideVideoTrigger) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-[85] md:right-6">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-auto w-[11.5rem] overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] md:w-[15rem] md:rounded-[1.5rem]"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-2.5 py-2 md:px-3 md:py-2.5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-600">
                  Video
                </p>
                <p className="mt-1 text-xs font-bold text-zinc-900 md:text-sm">獅頭鵝介紹</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:p-2"
                  aria-label={isMuted ? "開啟影片聲音" : "關閉影片聲音"}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:p-2"
                  aria-label="縮小影片視窗"
                >
                  <Minimize2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:p-2"
                  aria-label="關閉影片視窗"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="bg-black">
              <video
                ref={videoRef}
                src="/video/lion-goose.mp4"
                autoPlay
                playsInline
                loop={false}
                controls
                preload="auto"
                className="aspect-[4/5] w-full bg-black object-cover"
              />
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="trigger"
            type="button"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            onClick={handleOpen}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white/95 px-3 py-2.5 text-left shadow-[0_14px_35px_rgba(0,0,0,0.14)] backdrop-blur transition-transform hover:-translate-y-0.5 md:gap-3 md:px-4 md:py-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white md:h-10 md:w-10">
              <Play size={14} fill="currentColor" />
            </span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.26em] text-orange-600">
                Video
              </span>
              <span className="mt-0.5 block text-xs font-semibold text-zinc-900 md:mt-1 md:text-sm">
                獅頭鵝介紹
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
