export interface SheetMark {
  question: string; // e.g., "Q1a", "Q7b"
  extractedMark: string;
  correctedMark: string;
}

export interface SheetData {
  regNo: string;
  marks: SheetMark[];
  extractedTotalMarks?: string; // Extracted total marks from AI
  correctedTotalMarks?: string; // User corrected total marks
}

export interface AggregatedData {
  /** List of all unique question sub-part numbers encountered (e.g., ['Q1a', 'Q1b', 'Q2a']) */
  questions: string[];
  /** Object where each key is a register number and value is an object of marks { 'RegNo123': { 'Q1a': '10', 'Q1b': '8', 'Total': '18' } } */
  sheets: { [regNo: string]: { [question: string]: string } }; // 'question' can also be 'TotalMarks' for the total
}
