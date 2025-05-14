// src/components/consolidated-marks-table.tsx
"use client";

import * as React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { AggregatedData } from '@/types/marksheet';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ConsolidatedMarksTableProps {
  aggregatedData: AggregatedData | null;
  onDeleteSheet: (regNo: string) => void; 
}

export function ConsolidatedMarksTable({ aggregatedData, onDeleteSheet }: ConsolidatedMarksTableProps) {
  if (!aggregatedData || Object.keys(aggregatedData.sheets).length === 0) {
    return <p className="text-muted-foreground text-center py-10">No consolidated data to display.</p>;
  }

  const { questions, sheets } = aggregatedData;
  const registerNumbers = Object.keys(sheets).sort(); 
  const numberOfSheets = registerNumbers.length;

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border shadow-md">
      <Table className="min-w-full bg-card">
        <TableCaption>Consolidated marks from {numberOfSheets} sheet(s). Rows are Register Numbers, Columns are Question Numbers.</TableCaption>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[200px] sticky left-0 bg-muted/50 z-10 border-r font-semibold text-foreground">Register No.</TableHead>
            {questions.map((question, index) => (
              <TableHead key={`question-header-${index}`} className="text-center font-semibold text-foreground">
                {question === 'TotalMarks' ? 'Total Marks' : question}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {registerNumbers.map((regNo) => (
            <TableRow key={`sheet-row-${regNo}`} className="hover:bg-muted/20 transition-colors">
              <TableCell className="font-medium sticky left-0 bg-card z-10 border-r">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-primary font-semibold">{regNo}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteSheet(regNo)}
                    aria-label={`Delete sheet for Register No. ${regNo}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              {questions.map((question, questionIndex) => (
                <TableCell key={`cell-${regNo}-${questionIndex}`} className="text-center text-sm">
                  {sheets[regNo]?.[question] ?? <span className="text-muted-foreground text-xs italic">-</span>}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
