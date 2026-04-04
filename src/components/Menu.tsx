import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, type Variants } from "framer-motion";

const MENU_ITEMS = [
  {
    id: 1,
    name: "招牌獅頭鵝與小菜",
    // price: 380,
    description: "修長的鵝頸,油香濃郁,不僅粗壯,更是肉感十足,頭頂肉冠正是老饕所追求的一口Q彈,經典人氣滷味,更是下酒美味",
    tag: "人氣推薦",
    image:
      "/products/鵝作社潮滷獅頭鵝肉1.jpg",
  },
  {
    id: 2,
    name: "獅頭鵝肉拼盤",
    // price: 180,
    description: "精選獅頭鵝多部位拼盤,包含鵝肉,鵝翅,鵝爪與鵝胗,滷香濃郁,肉質彈嫩,想一次品嚐多種部位的最佳選擇",
    tag: "門市精選",
    image:
      "/products/鵝作社潮滷獅頭鵝肉_鵝肉拼盤1.jpg",
  },
  {
    id: 3,
    name: "鵝肉飯套餐",
    // price: 85,
    description: "經典套餐內含滷白鵝肉、滷蛋、時蔬、筍絲，鵝香週邊小菜，以及每日例湯，一次滿足",
    tag: "經典首選",
    image:
      "/products/鵝作社潮滷獅頭鵝肉_鵝肉飯套餐1.jpg",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export const Menu = () => (
  <section className="mx-auto max-w-7xl px-6 py-16">
    <div className="mb-12 flex items-center justify-between">
      <h2 className="text-3xl font-bold tracking-tighter underline decoration-orange-500 decoration-4 underline-offset-8">
        推薦產品
      </h2>
      <div className="ml-8 hidden h-px flex-1 bg-zinc-100 md:block"></div>
    </div>

    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
      className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
    >
      {MENU_ITEMS.map((menu) => (
        <motion.div
          key={menu.id}
          variants={cardVariants}
          whileHover={{ y: -10 }}
          whileTap={{ scale: 0.985, y: -4 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Card className="group overflow-hidden rounded-[1.75rem] bg-white border-zinc-200 shadow-none transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
            <div className="relative aspect-[4/3] overflow-hidden bg-white">
              <img
                src={menu.image}
                alt={menu.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute right-4 top-4 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                {menu.tag}
              </div>
            </div>
            <CardHeader>
              <div className="mb-2 flex justify-between gap-4">
                <CardTitle className="text-2xl font-bold tracking-tight">{menu.name}</CardTitle>
                {/* <span className="font-mono text-lg text-zinc-400">${menu.price}</span> */}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-zinc-500">{menu.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  </section>
);
