import { motion } from "framer-motion";
import { MapPin, Phone, Instagram, Clock } from "lucide-react";

const store = {
  title: "Visit ",
  subtitle: "門市資訊與聯絡方式",
  address: "台中市南屯區永春東七路746-1號",
  phone: "04-2380-0255",
  hours: "16:30 - 21:00",
  note: "每週二公休",
  instagram: "https://www.instagram.com/gozoshe.food",
  line: "https://line.me/ti/p/@737uyerc",
  mapEmbed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3640.7307105269497!2d120.63156077590584!3d24.14609347346932!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x34693dc4889a8159%3A0xc7727991dd8acdae!2zNDA46Ie65Lit5biC5Y2X5bGv5Y2A5rC45pil5p2x5LiD6LevNzQ2LTHomZ8!5e0!3m2!1szh-TW!2stw!4v1774147621285!5m2!1szh-TW!2stw",
};

const LineIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="transition-colors"
  >
    <path d="M24 10.304c0-5.232-5.383-9.488-12-9.488C5.383.816 0 5.072 0 10.304c0 4.688 4.272 8.6 10.056 9.352.392.08.928.256 1.064.592.12.304.08.776.04 1.08l-.176 1.056c-.056.328-.256 1.28 1.104.7 1.36-.584 7.328-4.312 10.008-7.384 1.888-2.112 1.904-3.6 1.904-4.8zM6.232 13.568H4.6a.44.44 0 0 1-.44-.44V7.576a.44.44 0 0 1 .44-.44h.352a.44.44 0 0 1 .44.44v5.112h.84a.44.44 0 0 1 .44.44v.312a.44.44 0 0 1-.44.448zm2.664 0h-.352a.44.44 0 0 1-.44-.44V7.576a.44.44 0 0 1 .44-.44h.352a.44.44 0 0 1 .44.44v5.552a.44.44 0 0 1-.44.44zm5.024 0h-.312a.432.432 0 0 1-.4-.288l-2.088-2.936v2.784a.44.44 0 0 1-.44.44h-.352a.44.44 0 0 1-.44-.44V7.576a.44.44 0 0 1 .44-.44h.312a.432.432 0 0 1 .4.288l2.088 2.936V7.576a.44.44 0 0 1 .44-.44h.352a.44.44 0 0 1 .44.44v5.552a.44.44 0 0 1-.44.44zm3.96-3.256h-.84v.736h.84a.44.44 0 0 1 .44.44v.312a.44.44 0 0 1-.44.44h-.84v.736h.84a.44.44 0 0 1 .44.44v.312a.44.44 0 0 1-.44.44h-1.632a.44.44 0 0 1-.44-.44V7.576a.44.44 0 0 1 .44-.44h1.632a.44.44 0 0 1 .44.44v.312a.44.44 0 0 1-.44.44h-.84v.736h.84a.44.44 0 0 1 .44.44v.312a.44.44 0 0 1-.44.44z" />
  </svg>
);

export const StoreInfo = () => {
  return (
    <section id="store" className="relative overflow-hidden pb-20 pt-36 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10 text-center lg:mb-20 lg:text-left">
          <h2 className="text-4xl font-black uppercase italic tracking-tighter">
            {store.title} <span className="text-orange-600">Us</span>
          </h2>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-400">
            {store.subtitle}
          </p>
        </div>

        <div className="space-y-4 lg:hidden">
          <div className="rounded-[1.75rem] border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-zinc-400">
              <MapPin size={18} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Location</span>
            </div>
            <p className="text-lg font-bold leading-8 text-zinc-900">{store.address}</p>
          </div>

          <a
            href={`tel:${store.phone}`}
            className="block rounded-[1.75rem] border border-zinc-100 bg-white p-5 shadow-sm transition-colors hover:border-orange-300"
          >
            <div className="mb-2 flex items-center gap-2 text-zinc-400">
              <Phone size={18} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Contact</span>
            </div>
            <p className="text-2xl font-black tracking-tight text-zinc-900">{store.phone}</p>
          </a>

          <div className="rounded-[1.75rem] border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-zinc-400">
              <Clock size={18} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Hours</span>
            </div>
            <p className="text-lg font-semibold text-zinc-900">{store.hours}</p>
            <p className="mt-1 text-sm font-bold text-orange-600">{store.note}</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            className="overflow-hidden rounded-[1.75rem] border border-zinc-100 bg-zinc-50 shadow-sm"
          >
            <div className="aspect-[4/3] w-full grayscale transition-all duration-700">
              <iframe
                src={store.mapEmbed}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </motion.div>

          <div className="rounded-[1.75rem] border border-zinc-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-400">
              Follow Us
            </p>
            <div className="flex items-center gap-4">
              <a
                href={store.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 transition-all duration-300 hover:border-black hover:bg-black hover:text-white"
              >
                <Instagram size={20} />
              </a>

              <a
                href={store.line}
                target="_blank"
                rel="noopener noreferrer"
                className="group/line flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 transition-all duration-300 hover:border-[#00B900] hover:bg-[#00B900] hover:text-white"
              >
                <span className="text-[#00B900] group-hover/line:text-white">
                  <LineIcon />
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white hidden gap-0 rounded-[2rem] border border-zinc-100 p-8 shadow-2xl lg:flex">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="min-h-[28rem] w-full overflow-hidden bg-zinc-50 grayscale transition-all duration-1000 hover:grayscale-0 lg:w-1/2"
          >
            <iframe
              src={store.mapEmbed}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            ></iframe>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex w-full flex-col justify-between bg-white p-12 lg:w-1/2 lg:p-20"
          >
            <div className="space-y-12">
              <div className="group">
                <div className="mb-2 flex items-center gap-3 text-zinc-300 transition-colors group-hover:text-orange-600">
                  <MapPin size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Location</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{store.address}</p>
              </div>

              <div className="group">
                <div className="mb-2 flex items-center gap-3 text-zinc-300 transition-colors group-hover:text-orange-600">
                  <Phone size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Contact</span>
                </div>
                <p className="font-mono text-2xl font-bold tracking-tight">{store.phone}</p>
              </div>

              <div className="group">
                <div className="mb-2 flex items-center gap-3 text-zinc-300 transition-colors group-hover:text-orange-600">
                  <Clock size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Hours</span>
                </div>
                <p className="text-xl font-medium text-zinc-800">{store.hours}</p>
                <p className="mt-1 text-sm font-bold text-orange-600">{store.note}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-16">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300">
                Follow Us
              </span>

              <a
                href={store.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 transition-all duration-300 hover:border-black hover:bg-black hover:text-white"
              >
                <Instagram size={20} />
              </a>

              <a
                href={store.line}
                target="_blank"
                rel="noopener noreferrer"
                className="group/line flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 transition-all duration-300 hover:border-[#00B900] hover:bg-[#00B900] hover:text-white"
              >
                <span className="text-[#00B900] group-hover/line:text-white">
                  <LineIcon />
                </span>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
