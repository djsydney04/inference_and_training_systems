/**
 * Display numbers belong to the assembled curriculum, never to an authored file.
 * All ordinals in this module are one-based. Stable fragment IDs remain separate
 * from these display numbers so inserting or moving a chapter preserves links.
 */
export type ReaderItemKind = "section" | "figure" | "code" | "check";

const itemNames: Record<ReaderItemKind, string> = {
  section: "Section",
  figure: "Figure",
  code: "Code",
  check: "Check",
};

function requireOrdinal(value: number, name: string) {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new RangeError(`${name} must be a positive, one-based integer`);
}

export function itemNumber(chapterNumber: number, itemNumber: number): string {
  requireOrdinal(chapterNumber, "Chapter number");
  requireOrdinal(itemNumber, "Item number");
  return `${chapterNumber}.${itemNumber}`;
}

export function itemLabel(
  kind: ReaderItemKind,
  chapterNumber: number,
  ordinal: number,
): string {
  return `${itemNames[kind]} ${itemNumber(chapterNumber, ordinal)}`;
}

// Legacy labels used both numeric and alphabetic components: 4.4, 4.E, K.6.
// A boundary prevents treating the first character of a topic as an ordinal.
const ordinalPattern = String.raw`(?:\d+|[A-Za-z])(?:\.(?:\d+|[A-Za-z]))*`;
const namedNumber = new RegExp(
  String.raw`^(Section|Lesson|Figure|Interactive|Lab|Code|Listing|Check|Exercise)\s+${ordinalPattern}(?=\s|$)`,
  "i",
);
const bareNumber = new RegExp(
  String.raw`^(?:\d+(?:\.(?:\d+|[A-Za-z]))*|[A-Za-z]\.(?:\d+|[A-Za-z]))\s*(?:[/·:—–]|-\s)\s*`,
);
const separator = /^\s*(?:[/·:—–]|-\s)\s*/;

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function captionDescriptor(
  original: string,
  redundantKinds: readonly string[],
): string {
  const text = clean(original);
  const numbered = text.match(namedNumber);
  if (numbered) {
    const kind = numbered[1];
    const remainder = text.slice(numbered[0].length).replace(separator, "").trim();
    const prefix = redundantKinds.includes(kind.toLowerCase()) ? "" : kind;
    return [prefix, remainder].filter(Boolean).join(" · ");
  }
  // New content can simply say "Figure", "Interactive", or a descriptive label.
  if (redundantKinds.includes(text.toLowerCase())) return "";
  const unnumbered = text.match(/^(Section|Lesson|Figure)\s*[/·:—–]\s*(.*)$/i);
  if (unnumbered && redundantKinds.includes(unnumbered[1].toLowerCase()))
    return unnumbered[2];
  return text.replace(bareNumber, "");
}

export function sectionCaptionLabel(
  chapterNumber: number,
  ordinal: number,
  original = "",
): string {
  const descriptor = captionDescriptor(original, ["section", "lesson"]);
  return [itemLabel("section", chapterNumber, ordinal), descriptor]
    .filter(Boolean)
    .join(" · ");
}

/** All static diagrams, photographs and interactive workbenches share a sequence. */
export function figureCaptionLabel(
  chapterNumber: number,
  ordinal: number,
  original = "",
): string {
  const descriptor = captionDescriptor(original, ["figure"]);
  return [itemLabel("figure", chapterNumber, ordinal), descriptor]
    .filter(Boolean)
    .join(" · ");
}

export type ReaderSection = { id: string; title: string };
export type NumberedReaderSection = ReaderSection & {
  number: string;
  label: string;
};

/** Use the same returned order and number in section headers and both outlines. */
export function buildChapterOutline(
  chapterNumber: number,
  sections: readonly ReaderSection[],
): NumberedReaderSection[] {
  requireOrdinal(chapterNumber, "Chapter number");
  const ids = new Set<string>();
  return sections.map((section, index) => {
    if (!section.id || /[\s#]/.test(section.id))
      throw new Error(`A section needs a stable fragment ID: ${section.id}`);
    if (ids.has(section.id)) throw new Error(`Duplicate section ID: ${section.id}`);
    if (!section.title.trim()) throw new Error(`Section ${section.id} has no title`);
    ids.add(section.id);
    return {
      ...section,
      number: itemNumber(chapterNumber, index + 1),
      label: itemLabel("section", chapterNumber, index + 1),
    };
  });
}
