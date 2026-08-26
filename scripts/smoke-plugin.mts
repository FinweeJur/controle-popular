// Smoke test do plugin: importa, registra hooks e dispara evento fake.
const mod = await import("file:///C:/DevCoder/controle-popular/.opencode/plugin/canario-telegram.ts");
const fabrica = mod.default ?? mod.canarioTelegramPlugin;
const hooks = await fabrica({});
console.log("hooks registrados:", Object.keys(hooks).join(", "));
await hooks.event({ type: "session.error", foo: "teste-fumaca" });
console.log("evento de teste disparado");
