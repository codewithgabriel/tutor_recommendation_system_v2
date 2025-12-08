import { format } from 'date-fns'
import {LanguageLevels , TimeSlot} from "./types";


export function concatTextFeatures(item: any): string {
  return Object.values(item)
    .flatMap(v =>
      typeof v === "string"
        ? [v]
        : Array.isArray(v)
        ? v.map(String)
        : typeof v === "object" && v
        ? Object.entries(v).map(([k, val]) => `${k}-${val}`)
        : []
    )
    .join(" ");
}

export function normalizeString(val: any): string | null {
  if (val == null) return null;
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.map(String).join(", ");
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}


export function normalizeNumber(val: any): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : -1; // ← sentinel value
}

export function normalizeAvailability(availabilityData: any): string | null {
  if (!availabilityData || !Array.isArray(availabilityData) || availabilityData.length === 0) {
    return null;
  }

  const descriptions: string[] = [];

  for (const slot of availabilityData) {
    if (slot && typeof slot.start === 'string' && typeof slot.end === 'string') {
      try {
        // parse the dates and format them into a human-readable string
        const startTime = new Date(slot.start);
        const endTime = new Date(slot.end);

        const formattedStart = format(startTime, 'EEEE,  h:mm a');
        const formattedEnd = format(endTime, 'h:mm a');

        descriptions.push(`${formattedStart} to ${formattedEnd}`);
      } catch (e) {
        console.error("Error parsing date in normalizeAvailability:", e);
        // fallback for invalid dates
        descriptions.push(`${slot.start} to ${slot.end}`);
      }
    }
  }

  if (descriptions.length > 0) {
    return `${descriptions.join('; ')}`;
  }
  
  return null;
}



export function parseLanguagesWithLevels(s: string | undefined): LanguageLevels {
  if (!s || !s.trim()) return {};

  return s
    .split(/[;,|]/)
    .map(x => x.trim())
    .filter(Boolean)
    .reduce((acc: LanguageLevels, part) => {
      const chunks = part.split("-").map(p => p.trim());

      if (chunks[0] && chunks[1]) {
        acc[chunks[0].toLowerCase()] = chunks[1].toLowerCase();
      } else {
        acc[part.toLowerCase()] = "unknown";
      }

      return acc;
    }, {});
}

export function parseListField(s: string | undefined): string[] {
  if (!s || !s.trim()) return [];
  return s
    .split(/[;,|]/)
    .map(x => x.trim().toLowerCase())
    .filter(Boolean);
}


export function parseAvailability(s: string | undefined): TimeSlot[] {
  if (!s || !s.trim()) return [];

  return s.split("|")
    .map(slot => slot.trim())
    .filter(Boolean)
    .map(slot => {
      const parts = slot.split("to").map(p => p.trim());

      return {
        start: parts[0] ?? "",
        end: parts[1] ?? ""
      };
    });
}
