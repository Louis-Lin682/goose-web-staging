import { motion } from "framer-motion"


export const Hero = () => (
    <section className="relative h-[80vh] w-full overflow-hidden bg-zinc-900">
        <picture>
          <source media="(max-width: 767px)" srcSet="/banner/banner_goose_m.png" />
          <img
            src="/banner/banner_goose.png"
            alt="Hero Background"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
        </picture>
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-white px-6">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="text-7xl font-black tracking-tighter md:text-9xl mb-4"
          >
            鵝作社<span className="text-orange-500">.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-10 max-w-lg text-lg font-light tracking-wide">
            傳承道地美味，結合現代極簡美學。
            <br />在這裡，每一口都是對食材的極致追求。
          </motion.p>
        </div>
      </section>
);
