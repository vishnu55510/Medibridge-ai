import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { UploadCloud, File, Loader2, CheckCircle } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface UploadRecordProps {
  user: User;
}

export default function UploadRecord({ user }: UploadRecordProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      // 1. Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          // Extract just the base64 part
          resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
      });

      // 2. Process with Gemini to extract structured data
      const prompt = `
        You are an expert medical data extractor. Analyze this medical document (prescription, lab result, clinical note, etc.).
        Extract the following information and return it strictly as a JSON object:
        {
          "type": "prescription" | "lab_result" | "clinical_note" | "other",
          "date": "YYYY-MM-DD" (if found, else null),
          "doctorName": "Name of doctor" (if found, else null),
          "summary": "A brief 1-2 sentence summary of what this document is",
          "extractedData": {
             // For prescriptions: list of medications with dosage, frequency, instructions
             // For lab results: list of tests and values
             // For clinical notes: key findings, conditions, recommendations
             // Put all detailed extracted information here in a structured format
          }
        }
        Return ONLY the JSON. No markdown formatting, no backticks.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type
              }
            }
          ]
        },
        config: {
          responseMimeType: 'application/json'
        }
      });

      const extractedJson = JSON.parse(response.text || '{}');

      // 3. Save to Firestore
      const recordsRef = collection(db, 'users', user.uid, 'records');
      await addDoc(recordsRef, {
        userId: user.uid,
        type: extractedJson.type || 'other',
        date: extractedJson.date || new Date().toISOString().split('T')[0],
        doctorName: extractedJson.doctorName || 'Unknown',
        summary: extractedJson.summary || 'No summary available',
        extractedData: JSON.stringify(extractedJson.extractedData || {}),
        createdAt: serverTimestamp()
      });

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to process document");
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/records`);
    } finally {
      setIsUploading(false);
    }
  }, [user.uid]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Medical Record</h2>
      <p className="text-sm text-slate-500 mb-6">
        Upload a photo of a prescription, lab result, or clinical note. Our AI will extract the structured data automatically.
      </p>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="flex flex-col items-center text-indigo-600">
            <Loader2 className="h-10 w-10 animate-spin mb-3" />
            <p className="font-medium">Analyzing document with AI...</p>
          </div>
        ) : uploadSuccess ? (
          <div className="flex flex-col items-center text-emerald-600">
            <CheckCircle className="h-10 w-10 mb-3" />
            <p className="font-medium">Record processed successfully!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-500">
            <UploadCloud className="h-10 w-10 mb-3 text-slate-400" />
            <p className="font-medium text-slate-700 mb-1">
              Drag & drop a file here
            </p>
            <p className="text-xs">or click to select a file</p>
            <p className="text-xs mt-4 text-slate-400">Supports JPG, PNG, PDF</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
