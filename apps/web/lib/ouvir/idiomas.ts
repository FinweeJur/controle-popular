/**
 * @file idiomas.ts
 * @description Idiomas de LEITURA EM VOZ ALTA com traducao automatica.
 *
 * Papel no portal: o controle "Ouvir" le a pagina em voz alta. A pedido do
 * dono (05/10/2026), o leitor escolhe o idioma e o texto e TRADUZIDO antes de
 * falar, para servir quem nao le portugues (migrantes, pesquisadores, imprensa
 * internacional). Cobre mandarim, italiano, espanhol, ingles e o resto.
 *
 * Fonte oficial (medida em 05/10/2026): lista de vozes do Azure AI Speech
 * (`cognitiveservices/voices/list`) cruzada com os idiomas do Azure AI
 * Translator (`languages?scope=translation`). So entra idioma que tem VOZ e
 * TRADUCAO — sem isso a leitura sairia muda ou sem sentido.
 *
 * Decisoes tecnicas:
 * - `codigo` e o locale BCP-47 (ex.: "en-US"); `voz` e o nome exato da voz
 *   neural do Azure; `tradutor` e o codigo de destino no Translator
 *   (ex.: "en", "zh-Hans"). Sem inventar nome de voz: sai da propria lista.
 * - o rotulo legivel vem do navegador (`Intl.DisplayNames`, pt) — assim nao
 *   ha tabela de traduzir nome de idioma a mao.
 * - arquivo GERADO: para atualizar, rode o gerador de novo quando o Azure
 *   publicar vozes novas.
 */

export interface IdiomaVoz {
  /** Locale BCP-47 (ex.: "en-US"). */
  codigo: string;
  /** Nome exato da voz neural do Azure Speech. */
  voz: string;
  /** Codigo de destino no Azure Translator (ex.: "en", "zh-Hans"). */
  tradutor: string;
}

export const IDIOMAS_VOZ: readonly IdiomaVoz[] = [
  { codigo: "af-ZA", voz: "af-ZA-AdriNeural", tradutor: "af" },
  { codigo: "am-ET", voz: "am-ET-MekdesNeural", tradutor: "am" },
  { codigo: "ar-AE", voz: "ar-AE-FatimaNeural", tradutor: "ar" },
  { codigo: "ar-BH", voz: "ar-BH-LailaNeural", tradutor: "ar" },
  { codigo: "ar-DZ", voz: "ar-DZ-AminaNeural", tradutor: "ar" },
  { codigo: "ar-EG", voz: "ar-EG-SalmaNeural", tradutor: "ar" },
  { codigo: "ar-IQ", voz: "ar-IQ-RanaNeural", tradutor: "ar" },
  { codigo: "ar-JO", voz: "ar-JO-SanaNeural", tradutor: "ar" },
  { codigo: "ar-KW", voz: "ar-KW-NouraNeural", tradutor: "ar" },
  { codigo: "ar-LB", voz: "ar-LB-LaylaNeural", tradutor: "ar" },
  { codigo: "ar-LY", voz: "ar-LY-ImanNeural", tradutor: "ar" },
  { codigo: "ar-MA", voz: "ar-MA-MounaNeural", tradutor: "ar" },
  { codigo: "ar-OM", voz: "ar-OM-AyshaNeural", tradutor: "ar" },
  { codigo: "ar-QA", voz: "ar-QA-AmalNeural", tradutor: "ar" },
  { codigo: "ar-SA", voz: "ar-SA-ZariyahNeural", tradutor: "ar" },
  { codigo: "ar-SY", voz: "ar-SY-AmanyNeural", tradutor: "ar" },
  { codigo: "ar-TN", voz: "ar-TN-ReemNeural", tradutor: "ar" },
  { codigo: "ar-YE", voz: "ar-YE-MaryamNeural", tradutor: "ar" },
  { codigo: "as-IN", voz: "as-IN-YashicaNeural", tradutor: "as" },
  { codigo: "az-AZ", voz: "az-AZ-BanuNeural", tradutor: "az" },
  { codigo: "bg-BG", voz: "bg-BG-KalinaNeural", tradutor: "bg" },
  { codigo: "bn-BD", voz: "bn-BD-NabanitaNeural", tradutor: "bn" },
  { codigo: "bn-IN", voz: "bn-IN-TanishaaNeural", tradutor: "bn" },
  { codigo: "bs-BA", voz: "bs-BA-VesnaNeural", tradutor: "bs" },
  { codigo: "ca-ES", voz: "ca-ES-JoanaNeural", tradutor: "ca" },
  { codigo: "cs-CZ", voz: "cs-CZ-VlastaNeural", tradutor: "cs" },
  { codigo: "cy-GB", voz: "cy-GB-NiaNeural", tradutor: "cy" },
  { codigo: "da-DK", voz: "da-DK-ChristelNeural", tradutor: "da" },
  { codigo: "de-AT", voz: "de-AT-IngridNeural", tradutor: "de" },
  { codigo: "de-CH", voz: "de-CH-LeniNeural", tradutor: "de" },
  { codigo: "de-DE", voz: "de-DE-SeraphinaMultilingualNeural", tradutor: "de" },
  { codigo: "el-GR", voz: "el-GR-AthinaNeural", tradutor: "el" },
  { codigo: "en-AU", voz: "en-AU-NatashaNeural", tradutor: "en" },
  { codigo: "en-CA", voz: "en-CA-ClaraNeural", tradutor: "en" },
  { codigo: "en-GB", voz: "en-GB-AdaMultilingualNeural", tradutor: "en" },
  { codigo: "en-HK", voz: "en-HK-YanNeural", tradutor: "en" },
  { codigo: "en-IE", voz: "en-IE-EmilyNeural", tradutor: "en" },
  { codigo: "en-IN", voz: "en-IN-AartiIndicNeural", tradutor: "en" },
  { codigo: "en-KE", voz: "en-KE-AsiliaNeural", tradutor: "en" },
  { codigo: "en-NG", voz: "en-NG-EzinneNeural", tradutor: "en" },
  { codigo: "en-NZ", voz: "en-NZ-MollyNeural", tradutor: "en" },
  { codigo: "en-PH", voz: "en-PH-RosaNeural", tradutor: "en" },
  { codigo: "en-SG", voz: "en-SG-LunaNeural", tradutor: "en" },
  { codigo: "en-TZ", voz: "en-TZ-ImaniNeural", tradutor: "en" },
  { codigo: "en-US", voz: "en-US-AvaMultilingualNeural", tradutor: "en" },
  { codigo: "en-ZA", voz: "en-ZA-LeahNeural", tradutor: "en" },
  { codigo: "es-AR", voz: "es-AR-ElenaNeural", tradutor: "es" },
  { codigo: "es-BO", voz: "es-BO-SofiaNeural", tradutor: "es" },
  { codigo: "es-CL", voz: "es-CL-CatalinaNeural", tradutor: "es" },
  { codigo: "es-CO", voz: "es-CO-SalomeNeural", tradutor: "es" },
  { codigo: "es-CR", voz: "es-CR-MariaNeural", tradutor: "es" },
  { codigo: "es-CU", voz: "es-CU-BelkysNeural", tradutor: "es" },
  { codigo: "es-DO", voz: "es-DO-RamonaNeural", tradutor: "es" },
  { codigo: "es-EC", voz: "es-EC-AndreaNeural", tradutor: "es" },
  { codigo: "es-ES", voz: "es-ES-ElviraNeural", tradutor: "es" },
  { codigo: "es-GQ", voz: "es-GQ-TeresaNeural", tradutor: "es" },
  { codigo: "es-GT", voz: "es-GT-MartaNeural", tradutor: "es" },
  { codigo: "es-HN", voz: "es-HN-KarlaNeural", tradutor: "es" },
  { codigo: "es-MX", voz: "es-MX-DaliaNeural", tradutor: "es-MX" },
  { codigo: "es-NI", voz: "es-NI-YolandaNeural", tradutor: "es" },
  { codigo: "es-PA", voz: "es-PA-MargaritaNeural", tradutor: "es" },
  { codigo: "es-PE", voz: "es-PE-CamilaNeural", tradutor: "es" },
  { codigo: "es-PR", voz: "es-PR-KarinaNeural", tradutor: "es" },
  { codigo: "es-PY", voz: "es-PY-TaniaNeural", tradutor: "es" },
  { codigo: "es-SV", voz: "es-SV-LorenaNeural", tradutor: "es" },
  { codigo: "es-US", voz: "es-US-PalomaNeural", tradutor: "es" },
  { codigo: "es-UY", voz: "es-UY-ValentinaNeural", tradutor: "es" },
  { codigo: "es-VE", voz: "es-VE-PaolaNeural", tradutor: "es" },
  { codigo: "et-EE", voz: "et-EE-AnuNeural", tradutor: "et" },
  { codigo: "eu-ES", voz: "eu-ES-AinhoaNeural", tradutor: "eu" },
  { codigo: "fa-IR", voz: "fa-IR-DilaraNeural", tradutor: "fa" },
  { codigo: "fi-FI", voz: "fi-FI-SelmaNeural", tradutor: "fi" },
  { codigo: "fil-PH", voz: "fil-PH-BlessicaNeural", tradutor: "fil" },
  { codigo: "fr-BE", voz: "fr-BE-CharlineNeural", tradutor: "fr" },
  { codigo: "fr-CA", voz: "fr-CA-SylvieNeural", tradutor: "fr-CA" },
  { codigo: "fr-CH", voz: "fr-CH-ArianeNeural", tradutor: "fr" },
  { codigo: "fr-FR", voz: "fr-FR-DeniseNeural", tradutor: "fr" },
  { codigo: "ga-IE", voz: "ga-IE-OrlaNeural", tradutor: "ga" },
  { codigo: "gl-ES", voz: "gl-ES-SabelaNeural", tradutor: "gl" },
  { codigo: "gu-IN", voz: "gu-IN-DhwaniNeural", tradutor: "gu" },
  { codigo: "he-IL", voz: "he-IL-HilaNeural", tradutor: "he" },
  { codigo: "hi-IN", voz: "hi-IN-AnanyaNeural", tradutor: "hi" },
  { codigo: "hr-HR", voz: "hr-HR-GabrijelaNeural", tradutor: "hr" },
  { codigo: "hu-HU", voz: "hu-HU-NoemiNeural", tradutor: "hu" },
  { codigo: "hy-AM", voz: "hy-AM-AnahitNeural", tradutor: "hy" },
  { codigo: "id-ID", voz: "id-ID-GadisNeural", tradutor: "id" },
  { codigo: "is-IS", voz: "is-IS-GudrunNeural", tradutor: "is" },
  { codigo: "it-IT", voz: "it-IT-ElsaNeural", tradutor: "it" },
  { codigo: "iu-Cans-CA", voz: "iu-Cans-CA-SiqiniqNeural", tradutor: "iu" },
  { codigo: "iu-Latn-CA", voz: "iu-Latn-CA-SiqiniqNeural", tradutor: "iu" },
  { codigo: "ja-JP", voz: "ja-JP-NanamiNeural", tradutor: "ja" },
  { codigo: "ka-GE", voz: "ka-GE-EkaNeural", tradutor: "ka" },
  { codigo: "kk-KZ", voz: "kk-KZ-AigulNeural", tradutor: "kk" },
  { codigo: "km-KH", voz: "km-KH-SreymomNeural", tradutor: "km" },
  { codigo: "kn-IN", voz: "kn-IN-SapnaNeural", tradutor: "kn" },
  { codigo: "ko-KR", voz: "ko-KR-SunHiNeural", tradutor: "ko" },
  { codigo: "lo-LA", voz: "lo-LA-KeomanyNeural", tradutor: "lo" },
  { codigo: "lt-LT", voz: "lt-LT-OnaNeural", tradutor: "lt" },
  { codigo: "lv-LV", voz: "lv-LV-EveritaNeural", tradutor: "lv" },
  { codigo: "mk-MK", voz: "mk-MK-MarijaNeural", tradutor: "mk" },
  { codigo: "ml-IN", voz: "ml-IN-SobhanaNeural", tradutor: "ml" },
  { codigo: "mr-IN", voz: "mr-IN-AarohiNeural", tradutor: "mr" },
  { codigo: "ms-MY", voz: "ms-MY-YasminNeural", tradutor: "ms" },
  { codigo: "mt-MT", voz: "mt-MT-GraceNeural", tradutor: "mt" },
  { codigo: "my-MM", voz: "my-MM-NilarNeural", tradutor: "my" },
  { codigo: "nb-NO", voz: "nb-NO-PernilleNeural", tradutor: "nb" },
  { codigo: "ne-NP", voz: "ne-NP-HemkalaNeural", tradutor: "ne" },
  { codigo: "nl-BE", voz: "nl-BE-DenaNeural", tradutor: "nl" },
  { codigo: "nl-NL", voz: "nl-NL-FennaNeural", tradutor: "nl" },
  { codigo: "or-IN", voz: "or-IN-SubhasiniNeural", tradutor: "or" },
  { codigo: "pa-IN", voz: "pa-IN-VaaniNeural", tradutor: "pa" },
  { codigo: "pl-PL", voz: "pl-PL-AgnieszkaNeural", tradutor: "pl" },
  { codigo: "ps-AF", voz: "ps-AF-LatifaNeural", tradutor: "ps" },
  { codigo: "pt-BR", voz: "pt-BR-FranciscaNeural", tradutor: "pt" },
  { codigo: "pt-PT", voz: "pt-PT-RaquelNeural", tradutor: "pt-PT" },
  { codigo: "ro-RO", voz: "ro-RO-AlinaNeural", tradutor: "ro" },
  { codigo: "ru-RU", voz: "ru-RU-SvetlanaNeural", tradutor: "ru" },
  { codigo: "si-LK", voz: "si-LK-ThiliniNeural", tradutor: "si" },
  { codigo: "sk-SK", voz: "sk-SK-ViktoriaNeural", tradutor: "sk" },
  { codigo: "sl-SI", voz: "sl-SI-PetraNeural", tradutor: "sl" },
  { codigo: "so-SO", voz: "so-SO-UbaxNeural", tradutor: "so" },
  { codigo: "sq-AL", voz: "sq-AL-AnilaNeural", tradutor: "sq" },
  { codigo: "sv-SE", voz: "sv-SE-SofieNeural", tradutor: "sv" },
  { codigo: "sw-KE", voz: "sw-KE-ZuriNeural", tradutor: "sw" },
  { codigo: "sw-TZ", voz: "sw-TZ-RehemaNeural", tradutor: "sw" },
  { codigo: "ta-IN", voz: "ta-IN-PallaviNeural", tradutor: "ta" },
  { codigo: "ta-LK", voz: "ta-LK-SaranyaNeural", tradutor: "ta" },
  { codigo: "ta-MY", voz: "ta-MY-KaniNeural", tradutor: "ta" },
  { codigo: "ta-SG", voz: "ta-SG-VenbaNeural", tradutor: "ta" },
  { codigo: "te-IN", voz: "te-IN-ShrutiNeural", tradutor: "te" },
  { codigo: "th-TH", voz: "th-TH-PremwadeeNeural", tradutor: "th" },
  { codigo: "tr-TR", voz: "tr-TR-EmelNeural", tradutor: "tr" },
  { codigo: "uk-UA", voz: "uk-UA-PolinaNeural", tradutor: "uk" },
  { codigo: "ur-IN", voz: "ur-IN-GulNeural", tradutor: "ur" },
  { codigo: "ur-PK", voz: "ur-PK-UzmaNeural", tradutor: "ur" },
  { codigo: "uz-UZ", voz: "uz-UZ-MadinaNeural", tradutor: "uz" },
  { codigo: "vi-VN", voz: "vi-VN-HoaiMyNeural", tradutor: "vi" },
  { codigo: "yue-CN", voz: "yue-CN-XiaoMinNeural", tradutor: "yue" },
  { codigo: "zh-CN", voz: "zh-CN-XiaoxiaoNeural", tradutor: "zh-Hans" },
  { codigo: "zh-CN-henan", voz: "zh-CN-henan-YundengNeural", tradutor: "zh-Hans" },
  { codigo: "zh-CN-liaoning", voz: "zh-CN-liaoning-XiaobeiNeural", tradutor: "zh-Hans" },
  { codigo: "zh-CN-shaanxi", voz: "zh-CN-shaanxi-XiaoniNeural", tradutor: "zh-Hans" },
  { codigo: "zh-CN-shandong", voz: "zh-CN-shandong-YunxiangNeural", tradutor: "zh-Hans" },
  { codigo: "zh-CN-sichuan", voz: "zh-CN-sichuan-YunxiNeural", tradutor: "zh-Hans" },
  { codigo: "zh-HK", voz: "zh-HK-HiuMaanNeural", tradutor: "zh-Hant" },
  { codigo: "zh-TW", voz: "zh-TW-HsiaoChenNeural", tradutor: "zh-Hant" },
  { codigo: "zu-ZA", voz: "zu-ZA-ThandoNeural", tradutor: "zu" },
];

/** Acha o idioma pelo locale; `undefined` se nao existir. */
export function acharIdioma(codigo: string): IdiomaVoz | undefined {
  return IDIOMAS_VOZ.find((i) => i.codigo === codigo);
}

/** Idioma padrao: portugues do Brasil. */
export const IDIOMA_PADRAO = "pt-BR";
