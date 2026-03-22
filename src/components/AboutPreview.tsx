import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ABOUT_STORY = [
  {
    title: "傳承三代的堅持",
    content: "每一道工序都遵循古法，只為留住那口最純粹的鮮甜。",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800",
    reverse: false
  },
  {
    title: "現代極簡美學",
    content: "我們相信美味不需要繁複的裝飾，讓吃鵝肉也能成為視覺饗宴。",
    image: "https://images.unsplash.com/photo-1543332164-6e82f355badc?q=80&w=800",
    reverse: true
  }
];

export const AboutPreview = () => (
  <section id="about" className="overflow-hidden bg-white pt-16">
    <div className="max-w-7xl mx-auto px-6">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">關於我們</h2>
        <div className="w-12 h-1 bg-orange-500 mx-auto"></div>
      </motion.div>

      {ABOUT_STORY.map((story, index) => (
        <div key={index} className={`flex flex-col md:flex-row items-center gap-12 mb-10 ${story.reverse ? 'md:flex-row-reverse' : ''}`}>
          <motion.div 
            initial={{ opacity: 0, x: story.reverse ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="w-full md:w-1/2 aspect-[16/10] overflow-hidden border border-zinc-100"
          >
            <motion.img
              src={story.image}
              alt={story.title}
              initial={{ filter: "grayscale(100%)", scale: 1.04 }}
              whileInView={{ filter: "grayscale(0%)", scale: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
              className="h-full w-full object-cover md:hidden"
            />
            <img
              src={story.image}
              alt={story.title}
              className="hidden h-full w-full object-cover transition-all duration-1000 md:block md:grayscale md:hover:grayscale-0"
            />
          </motion.div>
          <div className="w-full md:w-1/2 space-y-6">
            <h3 className="text-3xl font-bold tracking-tight">{story.title}</h3>
            <p className="text-zinc-500 leading-loose text-lg font-light">{story.content}</p>
            <Link to="/origin"><Button variant="outline" className="rounded-none border-black">了解更多</Button></Link>
          </div>
        </div>
      ))}
    </div>
  </section>
);
