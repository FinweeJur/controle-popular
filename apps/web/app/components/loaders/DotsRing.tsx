"use client";

import { motion } from "framer-motion";

/**
 * DotsRing — anel de 8 pontos pulsando, para os carregamentos PEQUENOS
 * (spinner do buscador global, rodapé do LoadingOverlay). Substituto do
 * `CircularBars` nesses cantinhos.
 *
 * NÃO usar em: transição de página (`loading.tsx`, `WavePhysicsLoader`) e
 * carregamento de gráficos/tabelas grandes — lá o loader continua sendo o
 * de física. Pedido do dono (19/09/2026), portado de amicro.vercel.app.
 *
 * `size` escalona a geometria do original (48 px: ponto 8 px, origem no
 * centro). Cores via corrente (`bg-current`) para herdar tema claro/escuro.
 */
export function DotsRing({ size = 16, className = "" }: { size?: number; className?: string }) {
  const ponto = size / 6;
  return (
    <div
      role="status"
      aria-label="Carregando..."
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <motion.span
          key={i}
          className="absolute top-0 left-1/2 rounded-full bg-current"
          style={{
            width: ponto,
            height: ponto,
            marginLeft: -ponto / 2,
            transformOrigin: `${ponto / 2}px ${size / 2}px`,
            rotate: i * 45,
          }}
          animate={{ scale: [1, 0.5, 1], opacity: [1, 0.3, 1] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
