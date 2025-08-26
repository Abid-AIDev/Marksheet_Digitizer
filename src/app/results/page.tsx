// src/app/results/page.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ConsolidatedMarksTable } from '@/components/consolidated-marks-table';
import { AlertTriangle, ArrowLeft, Download, Loader2, Eraser, Trash2, FileText } from 'lucide-react'; 
import type { AggregatedData } from '@/types/marksheet';
import ExcelJS from 'exceljs';
import { useToast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'markSheetData';

const sortQuestions = (questions: string[]) => {
  return questions.sort((a, b) => {
    if (a === 'TotalMarks') return 1; 
    if (b === 'TotalMarks') return -1;

    const matchA = a.match(/Q?(\d+)([a-d]?)/i);
    const matchB = b.match(/Q?(\d+)([a-d]?)/i);
    if (matchA && matchB) {
      const numA = parseInt(matchA[1]);
      const numB = parseInt(matchB[1]);
      if (numA !== numB) return numA - numB;
      return (matchA[2] || '').localeCompare(matchB[2] || '');
    }
    return a.localeCompare(b); 
  });
};

export default function ResultsPage() {
  const [aggregatedData, setAggregatedData] = React.useState<AggregatedData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isExporting, setIsExporting] = React.useState(false);
  const [sheetToDeleteRegNo, setSheetToDeleteRegNo] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const parsedData: AggregatedData = JSON.parse(storedData);
        if (parsedData && typeof parsedData.sheets === 'object' && Array.isArray(parsedData.questions)) {
          setAggregatedData(parsedData);
        } else {
          console.error('Invalid data format in localStorage');
          setAggregatedData({ questions: [], sheets: {} });
        }
      } else {
        setAggregatedData({ questions: [], sheets: {} });
      }
    } catch (error) {
      console.error('Failed to load or parse data from localStorage:', error);
      setAggregatedData({ questions: [], sheets: {} }); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExport = async () => {
    if (!aggregatedData || Object.keys(aggregatedData.sheets).length === 0) {
        toast({
            variant: 'destructive',
            title: 'Export Error',
            description: 'No data available to export.',
        });
        return;
    }
    setIsExporting(true);

    try {
      const sortedQuestions = sortQuestions([...aggregatedData.questions]);
      
      const header = ['Register No.', ...sortedQuestions.map(q => q === 'TotalMarks' ? 'Total Marks' : q)];
      const sortedRegNos = Object.keys(aggregatedData.sheets).sort();

      const dataRows = sortedRegNos.map(regNo => {
        const row: (string | number)[] = [regNo];
        sortedQuestions.forEach(question => {
          row.push(aggregatedData.sheets[regNo]?.[question] ?? '');
        });
        return row;
      });

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Consolidated Marks');
      
      // Add header row
      worksheet.addRow(header);
      
      // Add data rows
      dataRows.forEach(row => {
        worksheet.addRow(row);
      });
      
      // Generate and download the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'consolidated_marks_data.xlsx';
      link.target = '_blank';
      document.body.appendChild(link);
      try {
        link.click();
      } catch (e) {
        window.open(url, '_blank');
      } finally {
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }
      toast({
        title: 'Export Successful',
        description: 'Marksheet data exported to Excel.',
      });
    } catch (error) {
      console.error('Error exporting data to Excel:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'An error occurred while exporting data.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteSheet = (regNoToDelete: string) => {
    if (!aggregatedData) return;

    const updatedSheets = { ...aggregatedData.sheets };
    delete updatedSheets[regNoToDelete];
    
    let updatedQuestionsArray: string[] = [];
    if (Object.keys(updatedSheets).length > 0) {
      const allRemainingQuestionsSet = new Set<string>();
      Object.values(updatedSheets).forEach(sheetMarks => {
        Object.keys(sheetMarks).forEach(q => allRemainingQuestionsSet.add(q));
      });
      updatedQuestionsArray = sortQuestions(Array.from(allRemainingQuestionsSet));
    }

    const updatedData: AggregatedData = {
      questions: updatedQuestionsArray,
      sheets: updatedSheets,
    };

    setAggregatedData(updatedData);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedData));
    toast({
      title: 'Sheet Deleted',
      description: `Data for Register No. ${regNoToDelete} has been removed.`,
    });
    setSheetToDeleteRegNo(null); 
  };

  const handleClearAllData = () => {
    const clearedData: AggregatedData = { questions: [], sheets: {} };
    setAggregatedData(clearedData);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast({
      title: 'Data Cleared',
      description: 'All marksheet data has been cleared.',
      variant: 'destructive'
    });
  };
  
  const openDeleteSheetDialog = (regNo: string) => {
    setSheetToDeleteRegNo(regNo);
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const hasData = aggregatedData && Object.keys(aggregatedData.sheets).length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background py-8">
        <div className="container mx-auto max-w-7xl p-4 md:p-6">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6">
            <div className="text-center md:text-left">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2 group">
                <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Upload
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary">Consolidated Marksheet Results</h1>
            <p className="text-muted-foreground mt-1">
                View all verified marks. Register numbers are rows, questions are columns.
            </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Link href="/merge" passHref>
                  <Button variant="outline" disabled={!hasData} className="w-full sm:w-auto">
                    <FileText className="mr-2 h-4 w-4" /> Merge Excel Sheets
                  </Button>
                </Link>
                <Button onClick={handleExport} disabled={!hasData || isExporting} className="w-full sm:w-auto">
                {isExporting ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...
                    </>
                ) : (
                    <>
                    <Download className="mr-2 h-4 w-4" /> Export to Excel
                    </>
                )}
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={!hasData} className="w-full sm:w-auto">
                            <Eraser className="mr-2 h-4 w-4" /> Clear All Data
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all
                            consolidated marksheet data.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAllData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            Yes, clear all
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </header>

        <Card className="shadow-xl border-border/50 overflow-hidden">
            <CardHeader>
            <CardTitle>Aggregated Marks Table</CardTitle>
            <CardDescription>
                Click the <Trash2 className="inline h-4 w-4 text-muted-foreground" /> icon on a row to delete data for that Register Number.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {hasData ? (
                <ConsolidatedMarksTable 
                    aggregatedData={aggregatedData} 
                    onDeleteSheet={openDeleteSheetDialog}
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed rounded-lg text-muted-foreground p-6 text-center bg-muted/20">
                <AlertTriangle className="h-10 w-10 mb-3 text-primary" />
                <span className="font-semibold text-lg">No Finalized Marksheet Data Found</span>
                <Link href="/" className="mt-3">
                    <Button variant="link" className="text-primary text-base">Go back to upload and finalize sheets</Button>
                </Link>
                </div>
            )}
            </CardContent>
        </Card>

        {sheetToDeleteRegNo !== null && (
            <AlertDialog open={sheetToDeleteRegNo !== null} onOpenChange={(open) => !open && setSheetToDeleteRegNo(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Delete Data for Register No. {sheetToDeleteRegNo}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all data for this Register Number.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSheetToDeleteRegNo(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteSheet(sheetToDeleteRegNo)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Yes, delete sheet data
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
        </div>
    </main>
  );
}
