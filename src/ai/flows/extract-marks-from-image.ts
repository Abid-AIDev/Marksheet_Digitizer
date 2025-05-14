'use server';

/**
 * @fileOverview Extracts marks for sub-parts (a, b, c, d), register number, and total marks from an image of a mark sheet.
 *
 * This file defines a Genkit flow that takes an image of a mark sheet as input,
 * extracts the numerical marks for each question's sub-parts (a,b,c,d),
 * the register number, and the total marks, returning them in a structured format.
 *
 * @extractMarksAndRegNoFromImage - A function that handles the mark, register number, and total marks extraction process.
 * @ExtractMarksAndRegNoInput - The input type for the extractMarksAndRegNoFromImage function.
 * @ExtractMarksAndRegNoOutput - The return type for the extractMarksAndRegNoFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the flow.
const ExtractMarksAndRegNoInputSchema = z.object({
  markSheetImageDataUri: z
    .string()
    .describe(
      "A photo of a mark sheet, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractMarksAndRegNoInput = z.infer<typeof ExtractMarksAndRegNoInputSchema>;

// Define the output schema for the marks of a single question
const QuestionMarksSchema = z.object({
  questionNumber: z.string().describe('The main question number (e.g., "1", "7", "20", "34") as a string.'),
  a: z.string().optional().describe('Mark for sub-part a, if present. Should be a numerical string or empty.'),
  b: z.string().optional().describe('Mark for sub-part b, if present. Should be a numerical string or empty.'),
  c: z.string().optional().describe('Mark for sub-part c, if present. Should be a numerical string or empty.'),
  d: z.string().optional().describe('Mark for sub-part d, if present. Should be a numerical string or empty.'),
});
export type QuestionMarks = z.infer<typeof QuestionMarksSchema>;

// Define the overall output schema for the flow.
const ExtractMarksAndRegNoOutputSchema = z.object({
  regNo: z.string().describe('The register number extracted from the mark sheet. If characters are in separate boxes, they should be concatenated into a single string (e.g., "JEC23AD016").'),
  questionsAndMarks: z.array(QuestionMarksSchema).describe('An array of questions with their corresponding marks for sub-parts a, b, c, d.'),
  totalMarks: z.string().optional().describe('The total marks extracted from the mark sheet, if present. Should be a numerical string or empty.'),
});
export type ExtractMarksAndRegNoOutput = z.infer<typeof ExtractMarksAndRegNoOutputSchema>;


// Exported function to call the flow
export async function extractMarksAndRegNoFromImage(
  input: ExtractMarksAndRegNoInput
): Promise<ExtractMarksAndRegNoOutput> {
  return extractMarksAndRegNoFlow(input);
}

// Define the prompt to extract marks and register number from the image.
const extractMarksAndRegNoPrompt = ai.definePrompt({
  name: 'extractMarksAndRegNoPrompt',
  input: {schema: ExtractMarksAndRegNoInputSchema},
  output: {schema: ExtractMarksAndRegNoOutputSchema},
  prompt: `You are an expert in optical character recognition (OCR) from mark sheets.
        The marksheet has question numbers (typically from 1 up to 34, ensure this is extracted as a string). Each question number may have sub-parts labeled 'a', 'b', 'c', and 'd'.
        Your goal is to accurately identify and extract:
        1. The register number (often labeled as "Reg. No.", "Register Number", or similar). This is usually at the top of the marksheet. If the register number's characters are in separate boxes (e.g., J | E | C | 2 | 4 | A | D | 0 | 1 | 6), concatenate them to form a single string like "JEC24AD016".
        2. For each main question number visible on the marksheet:
           a. Identify the main question number (e.g., "1", "7", "15", "32"). This will be the 'questionNumber' and must be a string.
           b. For this 'questionNumber', identify the marks awarded for its sub-parts 'a', 'b', 'c', and 'd'.
           c. If a sub-part (e.g., 'a') has a red numerical mark, record it in the corresponding field ('a', 'b', 'c', or 'd').
           d. If a sub-part is empty, not attempted, or not present, leave its field empty or undefined in the output.
        3. The "Total Marks" value, which is usually written at the bottom or side of the table. Extract this as a numerical string. If not found, leave 'totalMarks' empty or undefined.

        Return the register number as a string, an array of 'questionsAndMarks' objects (each with 'questionNumber' (string) and optional 'a', 'b', 'c', 'd' mark fields), and the 'totalMarks'.
        If a main question number has no discernible marks for any of its sub-parts, you can either omit it from the 'questionsAndMarks' array or return it with all sub-part marks empty/undefined.
        Accuracy for the register number, all sub-part marks, and the total marks is paramount. Double-check all extracted values. All marks should be extracted as strings.

        Here is the image of the mark sheet:

        {{media url=markSheetImageDataUri}}
        `, // end of prompt
  // Safety settings configuration
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

// Define the Genkit flow.
const extractMarksAndRegNoFlow = ai.defineFlow(
  {
    name: 'extractMarksAndRegNoFlow',
    inputSchema: ExtractMarksAndRegNoInputSchema,
    outputSchema: ExtractMarksAndRegNoOutputSchema,
  },
  async input => {
    const {output} = await extractMarksAndRegNoPrompt(input);
    return {
        regNo: output?.regNo ?? '',
        questionsAndMarks: output?.questionsAndMarks ?? [],
        totalMarks: output?.totalMarks // Default to undefined if not present
    };
  }
);

