'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';


export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
     <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md text-center shadow-lg border-destructive">
         <CardHeader className="bg-destructive text-destructive-foreground rounded-t-lg p-4">
             <div className="flex justify-center mb-2">
                 <AlertTriangle className="h-8 w-8" />
             </div>
           <CardTitle>Something went wrong!</CardTitle>
         </CardHeader>
         <CardContent className="pt-6">
           <CardDescription className="text-foreground mb-4">
             An unexpected error occurred. You can try to recover from the error.
           </CardDescription>
            {error.message && (
             <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto mb-4">
               <code>Error details: {error.message}</code>
             </pre>
            )}
         </CardContent>
         <CardFooter>
           <Button
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
             className="w-full"
             variant="destructive"
           >
             Try again
           </Button>
         </CardFooter>
       </Card>
     </div>
  );
}
