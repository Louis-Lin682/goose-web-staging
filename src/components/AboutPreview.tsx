import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const ABOUT_STORY = [
  {
    title: "傳承三代的堅持",
    content:
      "每一道工序都遵循古法，只為留下那一口最純粹的鮮甜。從選材、火候到風味層次，我們始終相信真正的美味，來自時間與手藝。",
    image: "/products/goose-platter-1.jpg",
    reverse: false,
  },
  {
    title: "職人手藝與當代餐桌",
    content:
      "保留台味的熟悉記憶，也讓餐桌更俐落、更有儀式感。無論家宴、送禮或日常品味，都希望你在每一次享用時都能感受到鵝作社的用心。",
    image: "/products/goose-large-portion-1.jpg",
    reverse: true,
  },
] as const;

export const AboutPreview = () => (
  <section id="about" className="overflow-hidden bg-white pt-16">
    <div className="mx-auto max-w-7xl px-6">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        className="mb-20 text-center"
      >
        <h2 className="mb-4 text-4xl font-black tracking-tighter md:text-5xl">關於我們</h2>
        <div className="mx-auto h-1 w-12 bg-orange-500"></div>
      </motion.div>

      {ABOUT_STORY.map((story, index) => (
        <div
          key={story.title}
          className={`mb-10 flex flex-col items-center gap-12 md:flex-row ${
            story.reverse ? "md:flex-row-reverse" : ""
          }`}
        >
          <motion.div
            initial={{ opacity: 0, x: story.reverse ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, delay: index * 0.08 }}
            className="aspect-[16/10] w-full overflow-hidden border border-zinc-200 bg-white shadow-sm md:w-1/2"
          >
            <motion.img
              src={story.image}
              alt={story.title}
              initial={{ scale: 1.04 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
              className="h-full w-full object-cover md:hidden"
            />
            <motion.img
              src={story.image}
              alt={story.title}
              whileHover={{
                scale: 1.02,
              }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="hidden h-full w-full object-cover md:block"
            />
          </motion.div>
          <div className="w-full space-y-6 md:w-1/2">
            <h3 className="text-3xl font-bold tracking-tight">{story.title}</h3>
            <p className="text-lg font-light leading-loose text-zinc-500">{story.content}</p>
            <Link to="/origin">
              <Button variant="outline" className="rounded-none border-black">
                了解更多
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  </section>
);
