'use server';

/**
 * @fileOverview Verifies and corrects the extracted marks displayed in a table.
 *
 * - verifyTableData - A function that handles the verification and correction of table data.
 * - VerifyTableDataInput - The input type for the verifyTableData function.
 * - VerifyTableDataOutput - The return type for the verifyTableData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyTableDataInputSchema = z.object({
  tableData: z.array(
    z.object({
      question: z.string().describe('The question number or identifier.'),
      extractedMark: z
        .string()
        .describe('The mark extracted from the marksheet image.'),
    })
  ).describe('The extracted marks in a table format.'),
});
export type VerifyTableDataInput = z.infer<typeof VerifyTableDataInputSchema>;

const VerifyTableDataOutputSchema = z.array(
  z.object({
    question: z.string().describe('The question number or identifier.'),
    extractedMark: z
      .string()
      .describe('The mark extracted from the marksheet image.'),
    correctedMark: z.string().describe('The manually corrected mark, if any.'),
    isAccurate: z.boolean().describe('Whether the extracted mark is accurate.'),
  })
);
export type VerifyTableDataOutput = z.infer<typeof VerifyTableDataOutputSchema>;

export async function verifyTableData(input: VerifyTableDataInput): Promise<VerifyTableDataOutput> {
  return verifyTableDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyTableDataPrompt',
  input: {schema: VerifyTableDataInputSchema},
  output: {schema: VerifyTableDataOutputSchema},
  prompt: `You are an expert at verifying extracted data from mark sheets.

  You will receive data extracted from a mark sheet in tabular format. Your task is to verify the extracted marks for each question and identify any inaccuracies. If a mark is inaccurate, you will provide a corrected mark.

  Here is the extracted data:

  {{#each tableData}}
  Question: {{{question}}}, Extracted Mark: {{{extractedMark}}}
  {{/each}}

  Analyze each extracted mark for accuracy. If the extracted mark is correct, set 'isAccurate' to true and leave 'correctedMark' empty. If the extracted mark is incorrect, set 'isAccurate' to false and provide the correct mark in 'correctedMark'.

  Return the data in the following JSON format:
  [
    {
      "question": "Question Number",
      "extractedMark": "The extracted mark",
      "correctedMark": "The corrected mark, if any",
      "isAccurate": true/false
    }
  ]
  `,
});

const verifyTableDataFlow = ai.defineFlow(
  {
    name: 'verifyTableDataFlow',
    inputSchema: VerifyTableDataInputSchema,
    outputSchema: VerifyTableDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
