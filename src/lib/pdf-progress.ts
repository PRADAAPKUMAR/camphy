/** Milestones describe completed work, not a time-based estimate. */
export interface PdfProgressUpdate {
  percent: number;
  message: string;
}

export type PdfProgressReporter = (update: PdfProgressUpdate) => Promise<void> | void;