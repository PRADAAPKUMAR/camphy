import type { WorksheetItem, WorksheetSource } from './worksheet';

export interface QuestionRef { paper_id: string; question_number: number }
export interface SavedWorksheetSelection {
  id: string;
  name: string;
  level: string;
  savedAt: string;
  source: WorksheetSource;
  topics: { key: string; label: string; ids: string[]; count: number }[];
  refs: QuestionRef[];
  includeSources: boolean;
  showTotalMarks: boolean;
}
const STORAGE_KEY = 'physicshq:worksheet-selections:v1';
export const questionRef = (item: QuestionRef): QuestionRef => ({ paper_id: item.paper_id, question_number: item.question_number });
export const questionKey = (item: QuestionRef) => `${item.paper_id}:${item.question_number}`;
export const renumberWorksheet = <T extends { item: WorksheetItem }>(images: T[]): T[] =>
  images.map((image, index) => ({ ...image, item: { ...image.item, worksheet_number: index + 1 } }));

export const readSavedWorksheets = (): SavedWorksheetSelection[] => {
  try {
    const entries: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(entries)) return [];
    return entries.filter((entry): entry is SavedWorksheetSelection => {
      if (!entry || typeof entry.id !== 'string' || typeof entry.name !== 'string' || typeof entry.level !== 'string' || typeof entry.savedAt !== 'string') return false;
      if (!['random', 'topic', 'mistakes'].includes(entry.source) || !Array.isArray(entry.topics) || !Array.isArray(entry.refs) || entry.refs.length < 1 || entry.refs.length > 40) return false;
      return entry.refs.every((ref: QuestionRef) => ref && typeof ref.paper_id === 'string' && Number.isInteger(ref.question_number) && ref.question_number > 0)
        && entry.topics.every((topic: SavedWorksheetSelection['topics'][number]) => topic && typeof topic.key === 'string' && typeof topic.label === 'string' && Array.isArray(topic.ids) && topic.ids.every((id) => typeof id === 'string') && typeof topic.count === 'number');
    }).slice(0, 20);
  } catch { return []; }
};

/** Store stable references, never expiring signed URLs, images, or answer keys. */
export const writeSavedWorksheets = (entries: SavedWorksheetSelection[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 20).map((entry) => ({
    ...entry, refs: entry.refs.map(questionRef),
  }))));
};
