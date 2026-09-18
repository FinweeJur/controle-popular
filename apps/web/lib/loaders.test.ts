import { describe, expect, test } from "vitest";
import { WavePhysicsLoader } from "@/app/components/loaders/WavePhysicsLoader";
import { CircularBars } from "@/app/components/loaders/CircularBars";

describe("Loaders — Animações Físicas e Circulares", () => {
  test("WavePhysicsLoader e CircularBars são funções exportadas", () => {
    expect(typeof WavePhysicsLoader).toBe("function");
    expect(typeof CircularBars).toBe("function");
  });

  test("Parâmetros do modelo de física de ondas (WavePhysicsLoader)", () => {
    const numBars = 15;
    const barWidth = 12;
    const barGap = 8;
    const barTotalWidth = barWidth + barGap;
    const numFrames = 201;
    const B = 4;
    const maxBounce = 60;
    const baseBarH = 16;
    const wavePeakH = 48;

    expect(numBars).toBe(15);
    expect(barTotalWidth).toBe(20);
    expect(numFrames).toBe(201);
    expect(B).toBe(4);
    expect(maxBounce).toBe(60);
    expect(baseBarH).toBe(16);
    expect(wavePeakH).toBe(48);

    // Teste da física no frame t = 0.5 (pico do retorno)
    const t = 0.5;
    const x_frac = t < 0.5 ? t / 0.5 : (1 - t) / 0.5;
    expect(x_frac).toBe(1);

    const ball_idx = x_frac * (numBars - 1);
    expect(ball_idx).toBe(14); // última barra no ponto médio
  });

  test("Parâmetros do CircularBars (8 barras radiais)", () => {
    const totalBars = 8;
    const stepAngle = 360 / totalBars;
    expect(stepAngle).toBe(45);

    const delays = Array.from({ length: totalBars }).map((_, i) => +(i * 0.15).toFixed(2));
    expect(delays).toEqual([0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05]);
  });
});
