// src/app/page.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/image-upload';
import { MarksTable } from '@/components/marks-table';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { extractMarksAndRegNoFromImage, type ExtractMarksAndRegNoOutput, type QuestionMarks } from '@/ai/flows/extract-marks-from-image';
import type { AggregatedData, SheetData, SheetMark } from '@/types/marksheet';
import { AlertTriangle, Wand2, UploadCloud, Library, Save, ArrowRight, FileSpreadsheet, Camera, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';

const LOCAL_STORAGE_KEY = 'markSheetData';

const sortQuestions = (questions: string[]) => {
  return questions.sort((a, b) => {
    if (a === 'TotalMarks') return 1; // TotalMarks always last
    if (b === 'TotalMarks') return -1; // TotalMarks always last

    const matchA = a.match(/Q?(\d+)([a-d]?)/i);
    const matchB = b.match(/Q?(\d+)([a-d]?)/i);
    if (matchA && matchB) {
      const numA = parseInt(matchA[1]);
      const numB = parseInt(matchB[1]);
      if (numA !== numB) return numA - numB;
      return (matchA[2] || '').localeCompare(matchB[2] || '');
    }
    return a.localeCompare(b); // Fallback sort
  });
};


export default function Home() {
  const router = useRouter(); 
  const supabase = createClient();
  const { toast } = useToast();

  const [imageDataUris, setImageDataUris] = React.useState<string[]>([]);
  const [aggregatedTableData, setAggregatedTableData] = React.useState<AggregatedData>({ sheets: {}, questions: [] });
  const [processingStates, setProcessingStates] = React.useState<Array<{ name: string; progress: number; status: 'pending' | 'processing' | 'done' | 'error'; data?: ExtractMarksAndRegNoOutput }>>([]);
  const [overallProgress, setOverallProgress] = React.useState(0);
  const [isProcessingQueue, setIsProcessingQueue] = React.useState(false);
  const [processedSheetCount, setProcessedSheetCount] = React.useState(0);
  const [currentReviewSheet, setCurrentReviewSheet] = React.useState<SheetData | null>(null);
  const [currentReviewSheetRegNo, setCurrentReviewSheetRegNo] = React.useState<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = React.useState<'environment' | 'user'>('environment');


  React.useEffect(() => {
    // Data loading from localStorage remains a client-side convenience.
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const parsedData: AggregatedData = JSON.parse(storedData);
        setProcessedSheetCount(Object.keys(parsedData.sheets).length);
        setAggregatedTableData(parsedData);
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setProcessedSheetCount(0);
    }
  }, []);

  const startCamera = React.useCallback(async () => {
    if (!isCameraOpen) return;
    if (videoRef.current && videoRef.current.srcObject) {
      const prev = videoRef.current.srcObject as MediaStream;
      prev.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    try {
      const constraints: MediaStreamConstraints = { video: { facingMode: { ideal: cameraFacing } }, audio: false };
      let stream = await navigator.mediaDevices.getUserMedia(constraints);
      setHasCameraPermission(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraError(null);
    } catch (err) {
      try {
        const fb = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setHasCameraPermission(true);
        if (videoRef.current) videoRef.current.srcObject = fb;
        setCameraError(null);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setCameraError('Camera access denied. Please enable camera permissions in your browser settings.');
        toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions in your browser settings.' });
        setIsCameraOpen(false);
      }
    }
  }, [cameraFacing, isCameraOpen, toast]);

  React.useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    } else if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, [isCameraOpen, startCamera]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const mapAiOutputToSheetData = (data: ExtractMarksAndRegNoOutput): SheetData => {
    const sheetMarks: SheetMark[] = [];
    data.questionsAndMarks.forEach(qam => {
      const baseQuestionLabel = `Q${qam.questionNumber}`;
      if (qam.a) sheetMarks.push({ question: `${baseQuestionLabel}a`, extractedMark: qam.a, correctedMark: '' });
      if (qam.b) sheetMarks.push({ question: `${baseQuestionLabel}b`, extractedMark: qam.b, correctedMark: '' });
      if (qam.c) sheetMarks.push({ question: `${baseQuestionLabel}c`, extractedMark: qam.c, correctedMark: '' });
      if (qam.d) sheetMarks.push({ question: `${baseQuestionLabel}d`, extractedMark: qam.d, correctedMark: '' });
      // If no subparts have marks but question number exists, add a default QXa for review
      if (!qam.a && !qam.b && !qam.c && !qam.d && qam.questionNumber) {
         sheetMarks.push({ question: `${baseQuestionLabel}a`, extractedMark: '', correctedMark: '' });
      }
    });
     sortQuestions(sheetMarks.map(sm => sm.question));

    return {
      regNo: data.regNo,
      marks: sheetMarks,
      extractedTotalMarks: data.totalMarks,
      correctedTotalMarks: data.totalMarks, // Initialize corrected with extracted
    };
  };


  const handleImageUpload = (dataUris: string[]) => {
    setImageDataUris(prevUris => [...prevUris, ...dataUris]);
    const newFiles = dataUris.map((uri, index) => ({
      name: `Image ${imageDataUris.length + index + 1}`,
      progress: 0,
      status: 'pending' as 'pending' | 'processing' | 'done' | 'error',
    }));
    setProcessingStates(prevStates => [...prevStates, ...newFiles]);
    toast({
      title: `${dataUris.length} image(s) selected`,
      description: 'Images added to the processing queue. Click "Process Queue" to start.',
    });
  };

  const processQueue = async () => {
    if (processingStates.every(s => s.status !== 'pending' && s.status !== 'error')) {
      toast({ title: 'Queue Empty', description: 'No images to process.' });
      return;
    }
    setIsProcessingQueue(true);
    setOverallProgress(0);

    const filesToProcess = processingStates.filter(s => s.status === 'pending' || s.status === 'error');
    const totalFilesToProcess = filesToProcess.length;
    let filesProcessedCount = 0;

    for (let i = 0; i < processingStates.length; i++) {
      if (processingStates[i].status === 'pending' || processingStates[i].status === 'error') {
        const originalIndex = imageDataUris.findIndex(uri => 
            processingStates[i].name.endsWith(String(imageDataUris.indexOf(uri) + imageDataUris.length - processingStates.length +1))
        );
        const dataUriToProcess = imageDataUris[originalIndex !== -1 ? originalIndex : i];


        setProcessingStates(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'processing', progress: 10 } : s));


        try {
          await new Promise(resolve => setTimeout(resolve, 200)); 
          setProcessingStates(prev => prev.map((s, idx) => idx === i ? { ...s, progress: 30 } : s));
          
          const result = await extractMarksAndRegNoFromImage({ markSheetImageDataUri: dataUriToProcess });
          
          await new Promise(resolve => setTimeout(resolve, 300)); 
          setProcessingStates(prev => prev.map((s, idx) => idx === i ? { ...s, progress: 70 } : s));
          
          const hasAnyExtractedSubPartMark = result && result.questionsAndMarks && result.questionsAndMarks.some(qm => qm.a || qm.b || qm.c || qm.d);

          if (!result || !result.regNo || (!hasAnyExtractedSubPartMark && !result.totalMarks)) {
             setProcessingStates(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'error', progress: 100 } : s));
            toast({
              variant: 'destructive',
              title: `Extraction Failed for ${processingStates[i].name}`,
              description: 'Could not find register number or any marks/total marks. Please try a clearer image.',
            });
          } else {
             setProcessingStates(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'done', progress: 100, data: result } : s));
            const numSubPartsExtracted = result.questionsAndMarks.reduce((count, qm) => {
                if(qm.a) count++; if(qm.b) count++; if(qm.c) count++; if(qm.d) count++;
                return count;
            }, 0);

            toast({
              title: `Extraction Successful for ${processingStates[i].name}`,
              description: `Reg No: ${result.regNo}, marks for ${numSubPartsExtracted} sub-parts extracted. Total: ${result.totalMarks || 'N/A'}.`,
            });
            
            if (!currentReviewSheetRegNo) { 
                const sheetData = mapAiOutputToSheetData(result);
                setCurrentReviewSheetRegNo(sheetData.regNo);
                setCurrentReviewSheet(sheetData);
            }
          }
        } catch (error) {
          console.error(`Error extracting marks for ${processingStates[i].name}:`, error);
           setProcessingStates(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'error', progress: 100 } : s));
          toast({
            variant: 'destructive',
            title: `Error for ${processingStates[i].name}`,
            description: (error instanceof Error ? error.message : 'An error occurred during processing.'),
          });
        }
        filesProcessedCount++;
        setOverallProgress(Math.round((filesProcessedCount / totalFilesToProcess) * 100));
      }
    }
    setIsProcessingQueue(false);
  };

  const handleClearImage = (indexToRemove: number) => {
    setImageDataUris(prev => prev.filter((_, i) => i !== indexToRemove));
    setProcessingStates(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleFinalizeSheet = () => {
    if (!currentReviewSheet || !currentReviewSheetRegNo) {
      toast({ variant: 'destructive', title: 'Finalization Error', description: 'No sheet data available to finalize.' });
      return;
    }
    
    const finalMarksForSheet: { [question: string]: string } = {};
    const currentQuestions: string[] = [];
    currentReviewSheet.marks.forEach(item => {
      const finalMark = (item.correctedMark?.trim() !== '' ? item.correctedMark : item.extractedMark) ?? '';
      finalMarksForSheet[item.question] = finalMark;
      currentQuestions.push(item.question);
    });
    
    const finalTotalMarks = currentReviewSheet.correctedTotalMarks ?? currentReviewSheet.extractedTotalMarks ?? '';
    if (finalTotalMarks) {
        finalMarksForSheet['TotalMarks'] = finalTotalMarks;
    }


    setAggregatedTableData(prevAggregated => {
        const newSheets = { ...prevAggregated.sheets, [currentReviewSheetRegNo]: finalMarksForSheet };
        let allQuestionsSet = new Set([...prevAggregated.questions, ...currentQuestions]);
        if (finalTotalMarks) {
            allQuestionsSet.add('TotalMarks');
        }
        const newQuestions = sortQuestions(Array.from(allQuestionsSet));
        
        const newData = { sheets: newSheets, questions: newQuestions };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
        setProcessedSheetCount(Object.keys(newSheets).length);
        return newData;
    });

    toast({
      title: 'Sheet Finalized',
      description: `Sheet for Reg No: ${currentReviewSheetRegNo} added to results.`,
      className: 'bg-green-100 border-green-300 text-green-800',
    });

    setCurrentReviewSheet(null);
    setCurrentReviewSheetRegNo(null);
    
    const nextReviewable = processingStates.find(s => s.status === 'done' && s.data && !aggregatedTableData.sheets[s.data.regNo]);
    if (nextReviewable && nextReviewable.data) {
        const sheetData = mapAiOutputToSheetData(nextReviewable.data);
        setCurrentReviewSheetRegNo(sheetData.regNo);
        setCurrentReviewSheet(sheetData);
    } else if (imageDataUris.length === 0 && processingStates.every(s => s.status !== 'pending' && s.status !== 'processing')) {
        setProcessingStates([]);
    }
  };

  const handleMarkChange = (index: number, newMark: string) => {
    if (!currentReviewSheet) return;
    const updatedMarks = [...currentReviewSheet.marks];
    updatedMarks[index] = { ...updatedMarks[index], correctedMark: newMark };
    setCurrentReviewSheet({ ...currentReviewSheet, marks: updatedMarks });
  };

  const handleTotalMarkChange = (newMark: string) => {
    if (!currentReviewSheet) return;
    setCurrentReviewSheet({ ...currentReviewSheet, correctedTotalMarks: newMark });
  };
  
  const handleSelectSheetForReview = (regNo: string) => {
    const sheetToReviewState = processingStates.find(s => s.data?.regNo === regNo && s.status === 'done');
    if (sheetToReviewState && sheetToReviewState.data) {
        const sheetData = mapAiOutputToSheetData(sheetToReviewState.data);
        setCurrentReviewSheetRegNo(sheetData.regNo);
        setCurrentReviewSheet(sheetData);
    }
  };

  const openCamera = () => setIsCameraOpen(true);
  const closeCamera = () => setIsCameraOpen(false); 

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        handleImageUpload([dataUri]);
        closeCamera();
        toast({ title: 'Image Captured', description: 'Image from camera added to queue.' });
      }
    }
  };

  const allProcessedOrFinalized = processingStates.every(s => s.status === 'done' || s.status === 'error') && 
                                  processingStates.filter(s => s.status === 'done').every(s => s.data && aggregatedTableData.sheets[s.data.regNo]);


  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background py-8">
      <div className="container mx-auto max-w-6xl p-4 md:p-6">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6 border-b pb-6">
          <div className="text-center md:text-left">
            <h1 className="group text-4xl md:text-5xl font-extrabold text-primary mb-1 flex items-center justify-center md:justify-start">
              MarkSheet Digitizer
              <Wand2 className="ml-3 h-9 w-9 text-primary transform transition-all duration-300 ease-in-out group-hover:rotate-[15deg] group-hover:scale-110" />
            </h1>
            <p className="text-lg text-muted-foreground">
              Effortlessly digitize marksheet data. Upload, verify, and consolidate results with AI-powered precision.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center shrink-0">
             <Button onClick={handleSignOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            <Badge variant="secondary" className="py-2 px-4 text-sm">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Processed Sheets: {processedSheetCount}
            </Badge>
            <Link href="/results" passHref>
              <Button variant="outline" disabled={processedSheetCount === 0}>
                View Consolidated Results <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6 animate-in fade-in-50 slide-in-from-left-10 duration-700">
            <ImageUpload
              onImageUpload={handleImageUpload}
              currentImages={imageDataUris}
              clearImage={handleClearImage}
              isLoading={isProcessingQueue}
              openCamera={openCamera}
            />

            {isCameraOpen && (
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-border/50">
                <CardHeader>
                  <CardTitle>Camera View</CardTitle>
                </CardHeader>
                <CardContent>
                  <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                  {hasCameraPermission === false && cameraError && (
                     <Alert variant="destructive" className="mt-4">
                       <AlertTriangle className="h-4 w-4" />
                       <AlertTitle>Camera Error</AlertTitle>
                       <AlertDescription>{cameraError}</AlertDescription>
                     </Alert>
                   )}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <div className="flex gap-3">
                    <Button onClick={captureImage} disabled={!hasCameraPermission || !!cameraError}>Capture Image</Button>
                    <Button variant="secondary" onClick={() => setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')}>
                      {cameraFacing === 'environment' ? 'Use Front Camera' : 'Use Back Camera'}
                    </Button>
                  </div>
                  <Button onClick={closeCamera} variant="outline">Close Camera</Button>
                </CardFooter>
              </Card>
            )}

            {processingStates.length > 0 && (
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-border/50">
                <CardHeader>
                  <CardTitle>Processing Queue</CardTitle>
                  <CardDescription>Manage and process your uploaded marksheet images.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isProcessingQueue && <Progress value={overallProgress} className="w-full mb-4 h-3" />}
                  {processingStates.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                      <span className="truncate text-sm font-medium">{file.name} - <Badge variant={
                        file.status === 'done' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'
                      }>{file.status}</Badge></span>
                      {file.status === 'processing' && <LoadingSpinner size={16} />}
                      {file.status === 'pending' && <UploadCloud className="h-4 w-4 text-muted-foreground" />}
                      {file.status === 'done' && (!aggregatedTableData.sheets[file.data?.regNo ?? ''] ? (
                        <Button size="sm" variant="outline" onClick={() => file.data && handleSelectSheetForReview(file.data.regNo)}>Review</Button>
                      ) : <Badge variant="secondary" className="text-xs">Finalized</Badge>)}
                      {file.status === 'error' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button onClick={processQueue} disabled={isProcessingQueue || processingStates.every(s => s.status === 'done' || (s.status === 'error' && !isProcessingQueue) )} className="w-full">
                    {isProcessingQueue ? <><LoadingSpinner size={16} className="mr-2" />Processing...</> : 'Process Queue'}
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {!isProcessingQueue && imageDataUris.length === 0 && processingStates.length === 0 && (
              <Card className="flex items-center justify-center p-6 bg-muted/20 border-border/40 border-dashed text-muted-foreground shadow-sm">
                <UploadCloud className="mr-2 h-5 w-5" /> Upload marksheet images or use camera to begin.
              </Card>
            )}
          </div>

          <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-10 duration-700 delay-200">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-border/50">
              <CardHeader>
                <CardTitle>Review & Finalize Sheet</CardTitle>
                <CardDescription>
                  {currentReviewSheetRegNo 
                    ? `Reviewing Register No: ${currentReviewSheetRegNo}. Edit if needed, then finalize.`
                    : allProcessedOrFinalized && imageDataUris.length > 0 && processingStates.length > 0
                        ? "All pending sheets processed. Some may need review or are finalized."
                        : processingStates.length > 0 && processingStates.filter(s => s.status === 'done' && s.data && !aggregatedTableData.sheets[s.data.regNo]).length > 0
                            ? "Select a processed sheet from the queue to review."
                            : "Upload and process images to review marks."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MarksTable
                  sheetData={currentReviewSheet}
                  isLoading={isProcessingQueue && processingStates.some(s => s.status === 'processing' && s.data?.regNo === currentReviewSheetRegNo)}
                  onMarkChange={handleMarkChange}
                  onTotalMarkChange={handleTotalMarkChange}
                />
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleFinalizeSheet}
                  disabled={isProcessingQueue || !currentReviewSheetRegNo || !currentReviewSheet}
                  className="w-full"
                >
                  <Save className="mr-2 h-4 w-4" /> Finalize Sheet for {currentReviewSheetRegNo || '...'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
