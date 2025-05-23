// src/components/marks-table.tsx
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
import { AlertCircle, Pencil, Sigma } from 'lucide-react'; // Added Sigma for Total
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { SheetData } from '@/types/marksheet';
import { Label } from '@/components/ui/label';

interface MarksTableProps {
  sheetData: SheetData | null;
  isLoading: boolean;
  onMarkChange: (index: number, newMark: string) => void;
  onTotalMarkChange: (newMark: string) => void; // Added prop for total mark change
}

export function MarksTable({ sheetData, isLoading, onMarkChange, onTotalMarkChange }: MarksTableProps) {

  const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    onMarkChange(index, event.target.value);
  };

  const handleTotalMarkInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onTotalMarkChange(event.target.value);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4 border rounded-lg shadow animate-pulse bg-card">
        <Skeleton className="h-8 w-1/3 mb-2" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 py-2 border-b border-border/30">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        ))}
        <div className="flex items-center space-x-3 py-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }
  
  if (!sheetData || (sheetData.marks.length === 0 && !sheetData.extractedTotalMarks)) {
    return (
      <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground p-4 text-center bg-muted/20">
        <AlertCircle className="h-8 w-8 mb-3 text-primary" />
        <span className="font-medium">No marksheet selected or no marks to display.</span>
        <span className="text-sm mt-1">Please upload and process an image, then select it for review.</span>
      </div>
    );
  }

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm border">
      <Table className="shadow-sm rounded-lg border overflow-hidden bg-card mb-4">
        <TableCaption>Review marks for Register No: {sheetData.regNo}. Edit if needed.</TableCaption>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[120px] font-semibold text-foreground">Question #</TableHead>
            <TableHead className="font-semibold text-foreground">Extracted Mark</TableHead>
            <TableHead className="font-semibold text-foreground">Final Mark (Edit)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sheetData.marks.map((item, index) => (
            <TableRow key={index} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium text-primary">{item.question}</TableCell>
              <TableCell className="text-muted-foreground">
                {item.extractedMark || <span className="italic text-xs">Empty</span>}
              </TableCell>
              <TableCell>
                 <div className="relative flex items-center">
                    <Pencil className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="text"
                        value={item.correctedMark ?? ''}
                        onChange={(e) => handleInputChange(index, e)}
                        className="h-9 pl-8 text-sm bg-background focus:ring-primary focus:border-primary"
                        placeholder={item.extractedMark ? `Use: ${item.extractedMark}` : "Enter mark"}
                    />
                 </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {(sheetData.extractedTotalMarks !== undefined || sheetData.correctedTotalMarks !== undefined) && (
         <div className="mt-6 pt-4 border-t">
            <Label htmlFor="totalMarks" className="text-lg font-semibold text-foreground flex items-center mb-2">
                <Sigma className="mr-2 h-5 w-5 text-primary" /> Total Marks
            </Label>
            <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">Extracted Total:</p>
                    <Input
                        type="text"
                        id="extractedTotalMarks"
                        value={sheetData.extractedTotalMarks ?? ''}
                        readOnly
                        className="h-9 text-sm bg-muted/50 cursor-not-allowed"
                    />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground mb-1">Corrected Total (Edit):</p>
                    <div className="relative flex items-center">
                        <Pencil className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            type="text"
                            id="correctedTotalMarks"
                            value={sheetData.correctedTotalMarks ?? ''}
                            onChange={handleTotalMarkInputChange}
                            className="h-9 pl-8 text-sm bg-background focus:ring-primary focus:border-primary"
                            placeholder={sheetData.extractedTotalMarks ? `Use: ${sheetData.extractedTotalMarks}` : "Enter total"}
                        />
                    </div>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}
