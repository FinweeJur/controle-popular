import { fetchColetaLixo, diaSemanaParaIcs } from "@/lib/betim/servicos";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

function icsEscape(text: string): string {
  return text.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

/** Parses "07:00" (or similar) into hour/minute; defaults to 07:00 if unparseable. */
function parseHorario(horario: string | null): { hour: number; minute: number } {
  const m = horario ? /^(\d{1,2}):(\d{2})/.exec(horario) : null;
  if (!m) return { hour: 7, minute: 0 };
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

/** Finds the next date (today or later) that falls on the given ICS weekday code. */
function nextDateForByday(byday: string): Date {
  const codes = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const targetDow = codes.indexOf(byday);
  const now = new Date();
  const diff = (targetDow - now.getDay() + 7) % 7;
  const result = new Date(now);
  result.setDate(now.getDate() + diff);
  return result;
}

function formatIcsDate(d: Date, hour: number, minute: number): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const h = String(hour).padStart(2, "0");
  const mi = String(minute).padStart(2, "0");
  return `${y}${mo}${da}T${h}${mi}00`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ municipio: string; bairro: string }> }
) {
  const { municipio, bairro: bairroParam } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return new Response("Cidade não encontrada.", { status: 404 });

  const bairro = decodeURIComponent(bairroParam);
  const { rows } = await fetchColetaLixo(cidade.id_municipio, bairro);

  const events: string[] = [];
  let uidCounter = 0;

  for (const row of rows) {
    const { hour, minute } = parseHorario(row.horario);
    const bydays = (row.dias_semana ?? [])
      .map(diaSemanaParaIcs)
      .filter((v): v is string => v !== null);

    if (bydays.length === 0) continue;

    const startDate = nextDateForByday(bydays[0]);
    const dtstart = formatIcsDate(startDate, hour, minute);
    uidCounter += 1;

    events.push(
      [
        "BEGIN:VEVENT",
        `UID:coleta-${bairroParam}-${row.tipo ?? "comum"}-${uidCounter}@controlepopular.br`,
        `DTSTART;TZID=America/Sao_Paulo:${dtstart}`,
        `DURATION:PT30M`,
        `RRULE:FREQ=WEEKLY;BYDAY=${bydays.join(",")}`,
        `SUMMARY:${icsEscape(`Coleta de lixo (${row.tipo ?? "comum"}) — ${bairro}`)}`,
        `DESCRIPTION:${icsEscape(
          `Coleta ${row.tipo ?? "comum"} no bairro ${bairro}, Betim. Fonte: Controle Popular Betim (controlepopular.br/betim).`
        )}`,
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Coloque o lixo pra fora — coleta amanhã cedo",
        "TRIGGER:-PT12H",
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n")
    );
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Controle Popular Betim//Coleta de Lixo//PT-BR",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="coleta-lixo-${bairroParam}.ics"`,
    },
  });
}
