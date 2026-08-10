export type VCardInput = {
  firstName: string;
  lastName: string;
  displayName: string;
  organisation?: string | null;
  title?: string | null;
  email?: string | null;
  mobile?: string | null;
  website?: string | null;
  linkedinUrl?: string | null;
  cardUrl?: string | null;
  note?: string | null;
};

function escapeVCard(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Build a vCard 3.0 string for contact download.
 * Analytics should label this as vcard_download — not "contact saved".
 */
export function buildVCard(input: VCardInput): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCard(input.lastName)};${escapeVCard(input.firstName)};;;`,
    `FN:${escapeVCard(input.displayName)}`,
  ];

  if (input.organisation) {
    lines.push(`ORG:${escapeVCard(input.organisation)}`);
  }
  if (input.title) {
    lines.push(`TITLE:${escapeVCard(input.title)}`);
  }
  if (input.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(input.email)}`);
  }
  if (input.mobile) {
    lines.push(`TEL;TYPE=CELL:${escapeVCard(input.mobile)}`);
  }
  if (input.website) {
    lines.push(`URL:${escapeVCard(input.website)}`);
  } else if (input.cardUrl) {
    lines.push(`URL:${escapeVCard(input.cardUrl)}`);
  }
  if (input.linkedinUrl) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${escapeVCard(input.linkedinUrl)}`);
  }
  if (input.note) {
    lines.push(`NOTE:${escapeVCard(input.note)}`);
  }
  if (input.cardUrl && input.website) {
    lines.push(`URL;TYPE=Card:${escapeVCard(input.cardUrl)}`);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}
