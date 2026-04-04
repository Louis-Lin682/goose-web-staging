import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const GooseDetail = () => {
  return (
    <main className="bg-white min-h-screen pb-20">
      {/* 1. 頂部優雅標題 */}
      <section className="pt-40 pb-10 px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-orange-600 font-bold tracking-[0.4em] text-xs uppercase mb-6 block">
              Origin & Heritage
            </span>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-zinc-900 leading-none">
              潮汕<br />
              <span className="opacity-[0.4]">獅頭鵝的靈魂</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* 2. 故事主體內容 */}
      <section className="px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="prose prose-zinc lg:prose-xl font-light leading-loose text-zinc-600"
          >
            <p className="text-2xl text-black font-normal mb-12 leading-relaxed">
              「無鵝不成宴」這句話，精確地概括了潮汕人的飲食靈魂。
              在所有鵝種中，獅頭鵝被尊稱為「鵝王」，其巨大的身形與獨特的肉瘤，
              象徵著頂級美味的最高殿堂。
            </p>

            <div className="space-y-8">
              <p>
                獅頭鵝的產地就在廣東潮汕。那裡的氣候與水質，孕育出體型碩大、皮薄肉嫩的鵝隻。
                每一隻鵝都必須經過嚴格的選肥、宰殺與長達數小時的低溫慢滷。
              </p>

              <h3 className="text-black font-bold text-2xl mt-16 mb-4 italic">
                “ 滷水，是時間的藝術。”
              </h3>

              <p>
                我們的滷水配方是品牌的秘密武器。選用南薑、八角、肉桂與陳皮等數十種珍稀中藥材，
                讓滷汁在慢火中與鵝肉的油脂完美交融，
                最終呈現出琥珀色的光澤與令人難忘的深邃香氣。
              </p>
            </div>

            {/* 一張點綴用的大圖 (取代掉 37 張小圖) */}
            <div className="my-20 aspect-[16/9] overflow-hidden bg-zinc-100">
              <img 
                src="/products/鵝作社潮滷獅頭鵝肉2.png" 
                className="w-full h-full object-cover" 
                alt="Goose Process"
              />
            </div>

            <p>
              來到「鵝作社」，我們不只是在提供一份餐點，
              而是希望將這份跨越海洋、傳承百年的「潮汕記憶」，
              原封不動地送達您的舌尖。
            </p>
          </motion.div>

          {/* 3. 底部返回按鈕 */}
          <div className="mt-32 pt-12 border-t border-zinc-100 flex justify-between items-center">
            <Link to="/" className="group flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-zinc-400 hover:text-black transition-colors">
              <span className="group-hover:-translate-x-2 transition-transform">←</span> 返回首頁
            </Link>
            <div className="text-[10px] text-zinc-300 font-mono">GOOSE.FOOD CO. / 2026</div>
          </div>
        </div>
      </section>
    </main>
  );
};
