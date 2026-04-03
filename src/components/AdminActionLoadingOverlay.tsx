import { motion } from "framer-motion";

export const AdminActionLoadingOverlay = ({
  title,
}: {
  title: string;
}) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-white/22 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ duration: 0.18 }}
        className="flex flex-col items-center gap-5 rounded-[2rem] border border-white/55 bg-white/82 px-8 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.08)]"
      >
        <div className="relative flex h-14 w-14 items-center justify-center">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.15, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-zinc-200 border-t-orange-500"
          />
          <img
            src="/goose-logo.svg"
            alt="Goose logo"
            className="h-14 w-14 rounded-full object-cover"
          />
        </div>

        <div className="w-48 space-y-3 text-center">
          <motion.p
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
            className="text-[11px] font-black uppercase tracking-[0.35em] text-orange-600"
          >
            Loading...
          </motion.p>

          <p className="text-base font-semibold text-zinc-900">{title}</p>

          <div className="relative h-2 overflow-hidden rounded-full bg-zinc-200/80">
            <motion.span
              animate={{ x: ["-100%", "220%"] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
              className="absolute inset-y-0 left-0 w-20 rounded-full bg-orange-500"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
