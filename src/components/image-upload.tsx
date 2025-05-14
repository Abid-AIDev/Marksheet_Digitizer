"use client";

import * as React from 'react';
import Image from 'next/image';
import { Upload, X, Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImageUploadProps {
  onImageUpload: (imageDataUris: string[]) => void;
  currentImages: string[];
  clearImage: (index: number) => void;
  isLoading: boolean;
  openCamera: () => void;
}

export function ImageUpload({ onImageUpload, currentImages, clearImage, isLoading, openCamera }: ImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const dataUris: string[] = [];
      let validFilesCount = 0;

      Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
          toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: `File "${file.name}" is not an image.`,
          });
          return;
        }
        validFilesCount++;
        const reader = new FileReader();
        reader.onloadend = () => {
          dataUris.push(reader.result as string);
          if (dataUris.length === validFilesCount) { // Ensure all valid files are read
            onImageUpload(dataUris);
          }
        };
        reader.onerror = () => {
          toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: `Could not read file "${file.name}".`,
          });
        };
        reader.readAsDataURL(file);
      });
      // Clear the input value to allow re-uploading the same file(s)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-border/50">
      <CardHeader>
        <CardTitle>Upload Marksheets</CardTitle>
        <CardDescription>You can upload multiple images or use your device camera.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <Input
            id="marksheet-upload"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple // Allow multiple file selection
            disabled={isLoading}
          />
          <Button
            onClick={handleButtonClick}
            variant="outline"
            className="w-full border-dashed border-2 border-border h-32 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/10 hover:border-accent hover:text-accent transition-all duration-300 ease-in-out group"
            disabled={isLoading}
          >
            <Upload className="h-10 w-10 mb-2 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="font-semibold">Click or Drag to Upload Files</span>
            <span className="text-xs mt-1">Supports JPG, PNG, GIF, WEBP</span>
          </Button>
          <Button
            onClick={openCamera}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            <Camera className="mr-2 h-5 w-5" /> Use Camera
          </Button>
        </div>

        {currentImages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-2 text-foreground">Image Queue ({currentImages.length}):</h3>
            <ScrollArea className="h-[200px] w-full rounded-md border p-3 bg-muted/20">
              <div className="space-y-3">
                {currentImages.map((imageUri, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-md border bg-background shadow-sm">
                    <div className="flex items-center gap-2">
                       <Image
                        src={imageUri}
                        alt={`Preview ${index + 1}`}
                        width={40}
                        height={40}
                        className="rounded object-cover aspect-square"
                        data-ai-hint="marksheet document"
                      />
                      <span className="text-sm text-muted-foreground truncate">Image {index + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => clearImage(index)}
                      className="text-muted-foreground hover:text-destructive"
                      disabled={isLoading}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
