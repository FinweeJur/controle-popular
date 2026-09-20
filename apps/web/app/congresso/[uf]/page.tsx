import { redirect } from "next/navigation";

const UFS = [
  "ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma", "mt", "ms", "mg",
  "pa", "pb", "pr", "pe", "pi", "rj", "rn", "rs", "ro", "rr", "sc", "sp", "se", "to"
];

export async function generateStaticParams() {
  return UFS.map((uf) => ({ uf }));
}

export default async function CongressoUfPage({
  params,
}: {
  params: Promise<{ uf: string }>;
}) {
  const { uf } = await params;
  const ufLimpa = uf.toLowerCase();
  redirect(`/governo/${ufLimpa}/legislativo`);
}
