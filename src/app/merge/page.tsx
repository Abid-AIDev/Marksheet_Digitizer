// src/app/merge/page.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UploadCloud, Merge, Download, Loader2, AlertTriangle, FileDiff } from 'lucide-react';
import type { AggregatedData } from '@/types/marksheet';
import * as XLSX from 'xlsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const LOCAL_STORAGE_KEY = 'markSheetData';
const CSV_ADMISSION_NO_HEADER = "Admission No";
const EXCEL_REG_NO_HEADER = "Register No."; // Not directly used for keys, but good for context

export default function MergePage() {
  const [csvFile, setCsvFile] = React.useState<File | null>(null);
  const [excelData, setExcelData] = React.useState<AggregatedData | null>(null);
  const [mergedData, setMergedData] = React.useState<any[] | null>(null);
  const [csvHeaders, setCsvHeaders] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [updatedRowCount, setUpdatedRowCount] = React.useState(0);

  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const parsedData: AggregatedData = JSON.parse(storedData);
        if (parsedData && parsedData.sheets && parsedData.questions) {
          setExcelData(parsedData);
        } else {
          setError("Consolidated marks data from local storage is not in the expected format.");
          toast({ variant: 'destructive', title: "Data Load Error", description: "Invalid consolidated marks data format." });
        }
      } else {
        setError("No consolidated marks data found in local storage. Please process some marksheets first.");
        toast({ variant: 'destructive', title: "Data Load Error", description: "No consolidated marks data found." });
      }
    } catch (e) {
      console.error("Error loading data from local storage:", e);
      setError("Failed to load consolidated marks data.");
      toast({ variant: 'destructive', title: "Data Load Error", description: "Failed to load consolidated marks data." });
    }
  }, [toast]);

  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvFile(file);
        setError(null);
        setMergedData(null); 
        setUpdatedRowCount(0);


        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split(/\r\n|\n/);
                if (lines.length > 1) { // Check if there's more than one line for headers
                    // Try to find the header row more dynamically
                    let headerLineIndex = -1;
                    for(let i = 0; i < Math.min(lines.length, 10); i++) { // Search in first 10 lines
                        if (lines[i].includes(CSV_ADMISSION_NO_HEADER) && lines[i].includes("Name")) {
                            headerLineIndex = i;
                            break;
                        }
                    }

                    if (headerLineIndex !== -1) {
                        const headers = lines[headerLineIndex].split(',').map(h => h.trim().replace(/"/g, ''));
                        setCsvHeaders(headers);
                    } else {
                        setError(`Could not find '${CSV_ADMISSION_NO_HEADER}' and 'Name' headers in CSV.`);
                        toast({variant: 'destructive', title: 'CSV Error', description: `Required headers not found.`});
                        setCsvHeaders([]);
                    }
                } else {
                    setCsvHeaders([]);
                }
            } catch (parseError) {
                console.error("Error pre-parsing CSV headers:", parseError);
                setError("Failed to pre-parse CSV headers.");
                toast({variant: 'destructive', title: 'CSV Error', description: 'Failed to read CSV headers.'});
                setCsvHeaders([]);
            }
        };
        reader.readAsText(file);


      } else {
        setError("Invalid file type. Please upload a CSV file.");
        toast({ variant: 'destructive', title: "Invalid File", description: "Please upload a CSV file." });
        setCsvFile(null);
        setCsvHeaders([]);
      }
    }
  };
  
  const parseCsvData = (csvText: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      try {
        const lines = csvText.split(/\r\n|\n/);
        let headerLineIndex = -1;
        let headers: string[] = [];

        for(let i = 0; i < Math.min(lines.length, 10); i++) { // Search in first 10 lines
            if (lines[i].includes(CSV_ADMISSION_NO_HEADER) && lines[i].includes("Name")) { // More robust header detection
                headerLineIndex = i;
                headers = lines[i].split(',').map(h => h.trim().replace(/"/g, ''));
                break;
            }
        }
        
        if (headerLineIndex === -1) {
            throw new Error(`Required header '${CSV_ADMISSION_NO_HEADER}' and 'Name' not found in CSV file.`);
        }
        setCsvHeaders(headers); // Update state with actual headers from parsing

        const dataLines = lines.slice(headerLineIndex + 1);
        const jsonData = dataLines.filter(line => line.trim() !== '').map(line => {
          // Handle CSVs with values that might contain commas within quotes (basic handling)
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/"/g, ''));
          const row: { [key: string]: string } = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || ""; 
          });
          return row;
        });
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    });
  };


  const handleMergeData = async () => {
    if (!csvFile || !excelData) {
      setError("Please upload a CSV file and ensure consolidated data is loaded.");
      toast({ variant: 'destructive', title: "Merge Error", description: "Missing CSV file or consolidated data." });
      return;
    }
    setIsLoading(true);
    setError(null);
    setUpdatedRowCount(0);

    try {
      const csvText = await csvFile.text();
      const csvData = await parseCsvData(csvText);

      if (!csvHeaders.includes(CSV_ADMISSION_NO_HEADER)) {
        throw new Error(`CSV file must contain '${CSV_ADMISSION_NO_HEADER}' column.`);
      }

      let localUpdatedCount = 0;
      const newCsvData = csvData.map(csvRow => {
        const csvAdmissionNoValue = csvRow[CSV_ADMISSION_NO_HEADER];
        if (!csvAdmissionNoValue || typeof csvAdmissionNoValue !== 'string') {
          return csvRow; 
        }
        const csvAdmissionNoSuffix = csvAdmissionNoValue.slice(-3);
        let rowUpdated = false;

        for (const excelRegNo in excelData.sheets) {
          if (typeof excelRegNo !== 'string') continue; 
          const excelRegNoSuffix = excelRegNo.slice(-3);

          if (excelRegNoSuffix === csvAdmissionNoSuffix) {
            const excelMarks = excelData.sheets[excelRegNo];
            
            excelData.questions.forEach(questionKey => { // e.g. Q1a, Q7b, TotalMarks
              const excelMarkValue = excelMarks[questionKey];
              if (excelMarkValue !== undefined && excelMarkValue !== "") { 
                
                let csvHeaderKey = "";
                if (questionKey === "TotalMarks") {
                    csvHeaderKey = csvHeaders.find(h => h.toLowerCase().startsWith("total")) || "";
                } else {
                    const qMatch = questionKey.match(/Q?(\d+)([a-d]?)/i); // e.g. Q1a -> ["Q1a", "1", "a"]
                    if (qMatch) {
                        const qNum = qMatch[1]; // "1"
                        const qSub = (qMatch[2] || "").toLowerCase(); // "a"
                        
                        csvHeaderKey = csvHeaders.find(h => {
                            const headerNormalized = h.split(' ')[0].toLowerCase(); // "1" from "1 (3.00) CO1", or "6.a" from "6.a (7.00) CO1"
                            
                            // Case 1: CSV header is "N" (e.g., "1"), excel key is "QNa" (e.g., "Q1a")
                            if (qSub === 'a' && headerNormalized === qNum) {
                                return true;
                            }

                            // Case 2: CSV header is "N.s" or "Ns" (e.g., "1.a", "1a", "6.b", "6b")
                            const patternSubDirect = `${qNum}${qSub}`; // e.g., "1a"
                            const patternSubDot = `${qNum}.${qSub}`;    // e.g., "1.a"
                            
                            if (qSub && (headerNormalized === patternSubDirect || headerNormalized === patternSubDot)) {
                                return true;
                            }
                            
                            return false;
                        }) || "";
                    }
                }

                if (csvHeaderKey && csvRow[csvHeaderKey] !== String(excelMarkValue)) { // Ensure comparison is string to string
                  csvRow[csvHeaderKey] = String(excelMarkValue);
                  rowUpdated = true;
                }
              }
            });
            break; 
          }
        }
        if (rowUpdated) localUpdatedCount++;
        return csvRow;
      });

      setMergedData(newCsvData);
      setUpdatedRowCount(localUpdatedCount);
      if (localUpdatedCount > 0) {
        toast({ title: "Merge Successful", description: `${localUpdatedCount} student(s) marks updated in the CSV data.` });
      } else {
        toast({ title: "Merge Complete", description: "No matching students found or no new marks to update." });
      }

    } catch (e: any) {
      console.error("Error merging data:", e);
      setError(`Merge failed: ${e.message}`);
      toast({ variant: 'destructive', title: "Merge Failed", description: e.message });
      setMergedData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadMergedFile = () => {
    if (!mergedData || mergedData.length === 0) {
      toast({ variant: 'destructive', title: "Download Error", description: "No merged data to download." });
      return;
    }

    try {
      let originalCsvText = "";
      const reader = new FileReader();
      reader.onload = (e) => {
        originalCsvText = e.target?.result as string;
        const lines = originalCsvText.split(/\r\n|\n/);
        let headerLineIndex = -1;
        for(let i = 0; i < Math.min(lines.length, 10); i++) { // Search in first 10 lines
            if (lines[i].includes(CSV_ADMISSION_NO_HEADER) && lines[i].includes("Name")) {
                headerLineIndex = i;
                break;
            }
        }

        if (headerLineIndex === -1) {
            // Fallback: assume first non-empty line with CSV_ADMISSION_NO_HEADER is the header
            for(let i = 0; i < Math.min(lines.length, 10); i++) {
                if (lines[i].trim() !== '' && lines[i].includes(CSV_ADMISSION_NO_HEADER)) {
                    headerLineIndex = i;
                    break;
                }
            }
            if (headerLineIndex === -1) {
                 throw new Error("Original CSV header row not found during download reconstruction.");
            }
        }
        
        const linesBeforeHeader = lines.slice(0, headerLineIndex);
        const headerRow = csvHeaders.join(',');
        const dataRows = mergedData.map(row => csvHeaders.map(header => `"${(row[header] || "").replace(/"/g, '""')}"`).join(',')); // Ensure values are quoted
        
        const finalCsvText = [...linesBeforeHeader, headerRow, ...dataRows].join('\n');

        const blob = new Blob([finalCsvText], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `merged_marks_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Download Started", description: "Merged CSV file is being downloaded." });
      };
      reader.onerror = () => {
        throw new Error("Failed to read original CSV file for download reconstruction.");
      }
      if(csvFile) reader.readAsText(csvFile);
      else throw new Error("Original CSV file not available.");

    } catch (e: any) {
      console.error("Error preparing download:", e);
      setError(`Download preparation failed: ${e.message}`);
      toast({ variant: 'destructive', title: "Download Failed", description: e.message });
    }
  };


  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background py-8">
      <div className="container mx-auto max-w-3xl p-4 md:p-6">
        <header className="mb-8 flex flex-col items-center text-center">
          <Link href="/results" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 group self-start">
            <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Results
          </Link>
          <h1 className="text-4xl font-extrabold text-primary mb-2 flex items-center">
            <FileDiff className="mr-3 h-10 w-10 text-primary" /> Merge Marksheet Data
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload your base CSV student data file, then merge it with the consolidated marks.
          </p>
        </header>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl border-border/50 overflow-hidden mb-8">
          <CardHeader>
            <CardTitle>Step 1: Upload CSV File</CardTitle>
            <CardDescription>
              Select the CSV file containing student admission numbers and names. 
              Ensure it has an &quot;{CSV_ADMISSION_NO_HEADER}&quot; column.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="csv-upload" className="text-base">Student Data CSV File</Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
            {csvFile && <p className="mt-2 text-sm text-green-600">Selected: {csvFile.name}</p>}
             {csvHeaders.length > 0 && (
                <div className="mt-3 p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium text-foreground mb-1">Detected CSV Headers:</p>
                    <p className="text-xs text-muted-foreground break-all">{csvHeaders.join(', ')}</p>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xl border-border/50 overflow-hidden">
          <CardHeader>
            <CardTitle>Step 2: Merge and Download</CardTitle>
            <CardDescription>
              Once your CSV is uploaded and consolidated marks are available, merge them.
              The process matches Register Numbers (from consolidated data) with Admission Numbers (from CSV) using the last 3 digits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleMergeData}
              disabled={!csvFile || !excelData || isLoading}
              className="w-full mb-4 text-lg py-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Merging Data...
                </>
              ) : (
                <>
                  <Merge className="mr-2 h-5 w-5" /> Merge Data
                </>
              )}
            </Button>
            {updatedRowCount > 0 && mergedData && (
                 <Alert variant="default" className="mb-4 bg-green-50 border-green-300">
                    <FileDiff className="h-4 w-4 text-green-700" />
                    <AlertTitle className="text-green-800">Merge Successful!</AlertTitle>
                    <AlertDescription className="text-green-700">
                        {updatedRowCount} student(s) marks have been updated in the CSV data. You can now download the merged file.
                    </AlertDescription>
                </Alert>
            )}
             {mergedData && updatedRowCount === 0 && !isLoading && (
                 <Alert variant="default" className="mb-4 bg-blue-50 border-blue-300">
                    <FileDiff className="h-4 w-4 text-blue-700" />
                    <AlertTitle className="text-blue-800">Merge Complete</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        No matching students found for updates, or no new marks to update. You can download the (un)changed file.
                    </AlertDescription>
                </Alert>
            )}
            {mergedData && (
              <Button
                onClick={handleDownloadMergedFile}
                disabled={isLoading}
                variant="outline"
                className="w-full text-lg py-6 border-primary text-primary hover:bg-primary/10"
              >
                <Download className="mr-2 h-5 w-5" /> Download Merged CSV File
              </Button>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Ensure question number columns (e.g., &quot;1&quot;, &quot;6.a&quot;, &quot;Total&quot;) in your CSV correspond to the extracted question keys (e.g., &quot;Q1a&quot;, &quot;Q6a&quot;, &quot;Q6b&quot;, &quot;TotalMarks&quot;) for accurate merging.
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

