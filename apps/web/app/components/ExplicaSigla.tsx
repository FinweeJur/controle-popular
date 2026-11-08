/**
 * ExplicaSigla — "O que é o SUS?" em uma linha, com a explicação longa no hover.
 *
 * POR QUE EXISTE: as páginas de serviço mostram números de SUS, IDEB e CAGED
 * sem dizer o que a sigla é. O dono pediu que a explicação ficasse no
 * detalhamento da página (hover), não no menu — o menu só carrega o nome curto.
 *
 * O texto completo sai em `data-dica`, lido pelo `DicaHover` global depois de
 * o ponteiro parar. O `<abbr title>` cobre leitor de tela e navegador sem JS.
 */
export default function ExplicaSigla({
  sigla,
  extenso,
  explicacao,
  dica,
}: {
  sigla: string;
  extenso: string;
  explicacao: string;
  dica: string;
}) {
  return (
    <p className="text-sm text-text-soft" data-dica={dica}>
      O que é o {sigla}?{" "}
      <abbr title={extenso} className="font-medium no-underline">
        {extenso}
      </abbr>{" "}
      — {explicacao}
    </p>
  );
}
