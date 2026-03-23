import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, type Variants } from "framer-motion";

const MENU_ITEMS = [
  {
    id: 1,
    name: "煙燻鵝肉禮盒",
    price: 380,
    description: "招牌煙燻鵝肉搭配細緻油香，適合節慶送禮與家庭聚餐。",
    tag: "人氣推薦",
    image:
      "https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "鵝油香蔥拌麵",
    price: 180,
    description: "以鵝油與香蔥提味，拌上彈牙麵條，香氣厚實又順口。",
    tag: "門市熱賣",
    image:
      "https://images.unsplash.com/photo-1543332164-6e82f355badc?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "鵝肉丸湯",
    price: 85,
    description: "手工鵝肉丸搭配清甜高湯，口感扎實，適合搭配主食。",
    tag: "暖胃首選",
    image:
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=800&auto=format&fit=crop",
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
          <Card className="group overflow-hidden rounded-[1.75rem] border-zinc-100 shadow-none transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
            <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
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
                <span className="font-mono text-lg text-zinc-400">${menu.price}</span>
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
