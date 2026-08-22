import { criarLinkDaZona } from "@/lib/link-zona";
import { BASE_PATH } from "@/lib/paraopeba/basePath";

/**
 * `<Link>` da zona /paraopeba. Ver `lib/link-zona.tsx` para o porquê do
 * wrapper, e `lib/zonas.ts` para a regra de quando NÃO usá-lo: link para a
 * raiz do domínio ou para zona irmã é `<a>` cru, senão o prefixo desta zona
 * geraria `/paraopeba/congresso`.
 */
export default criarLinkDaZona(BASE_PATH);
