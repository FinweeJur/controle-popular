// Liga o hook useEstabelecimentosMg no TabelaPresidios (deps + chamada).
const fs = require("fs");
const p = "app/judiciario/presidios/TabelaPresidios.tsx";
let t = fs.readFileSync(p, "utf8");

// 1) chama o hook junto dos estados
t = t.replace(
  "const [mostrando, setMostrando] = useState(POR_PAGINA);",
  "const [mostrando, setMostrando] = useState(POR_PAGINA);\n  const presidios = useEstabelecimentosMg();"
);

// 2) deps dos useMemos de opções
t = t.split("e.ramo)), [],").join("e.ramo)), [presidios],");
t = t.split("e.natureza)), [],").join("e.natureza)), [presidios],");
t = t.split("e.inspecoes)), [],").join("e.inspecoes)), [presidios],");

// 3) deps do useMemo filtradas
t = t.split("}, [busca, ramo, natureza, ordem]);").join("}, [busca, ramo, natureza, ordem, presidios]);");

fs.writeFileSync(p, t, "utf8");
console.log("hook chamado:", (t.match(/useEstabelecimentosMg\(\)/g) || []).length, "vezes");
