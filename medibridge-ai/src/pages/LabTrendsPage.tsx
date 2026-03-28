import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProfile } from '../contexts/ProfileContext';
import { MedicalRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

/**
 * LabTrendsPage Component
 * 
 * Provides a visual dashboard of medical lab results over time using Recharts
 * and leverages Google Gemini AI to analyze trends and correlate them with patient history.
 * 
 * @param {LabTrendsPageProps} props - Component props containing the current authenticated user.
 */
export default function LabTrendsPage({ user }: LabTrendsPageProps) {
  const { activeProfile } = useProfile();
  const [labRecords, setLabRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (!activeProfile) {
      setLabRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'users', user.uid, 'profiles', activeProfile.id, 'records'),
      where('type', '==', 'Lab Report')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MedicalRecord[];
      
      // Sort by date ascending for charts
      fetchedRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setLabRecords(fetchedRecords);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/profiles/${activeProfile.id}/records`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid, activeProfile]);

  const generateInsights = async () => {
    if (labRecords.length === 0) return;
    
    setLoadingInsights(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const labDataContext = labRecords.map(r => {
        let extracted = {};
        try {
          if (r.extractedData) extracted = JSON.parse(r.extractedData);
        } catch (e) {}
        return `Date: ${r.date}\nSummary: ${r.summary}\nData: ${JSON.stringify(extracted)}`;
      }).join('\n\n');

      const prompt = `Analyze the following lab reports for ${activeProfile?.name} and provide a brief, easy-to-understand summary of any trends, improvements, or areas of concern. Keep it under 150 words.\n\n${labDataContext}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `As a medical data assistant, analyze these lab trends for ${activeProfile?.name}. 
        Identify specific biomarker changes (e.g., rising/falling trends), provide clinical context for these values, 
        and suggest general lifestyle or monitoring questions for their next doctor visit. 
        
        DATA:
        ${labDataContext}
        
        RESPONSE FORMAT:
        - Key Observations: [3 bullet points]
        - Potential Trends: [Brief paragraph]
        - Recommended Questions for Doctor: [2-3 points]
        
        (Disclaimer: Always include a medical disclaimer that this is AI-generated and not professional medical advice.)`,
      });

      setInsights(response.text || 'No insights generated.');
    } catch (error) {
      console.error("Error generating insights:", error);
      setInsights("Failed to generate insights. Please try again later.");
    } finally {
      setLoadingInsights(false);
    }
  };

  // Extract common metrics for charting (e.g., Cholesterol, Blood Sugar)
  // This is a simplified example. In a real app, you'd need robust parsing of the extractedData JSON.
  const chartData = labRecords.map(record => {
    const dataPoint: any = { date: record.date };
    try {
      if (record.extractedData) {
        const parsed = JSON.parse(record.extractedData);
        // Look for common test names in the parsed data
        // This assumes the AI extracted tests into an array of objects like { name: "Cholesterol", value: "150", unit: "mg/dL" }
        if (parsed.tests && Array.isArray(parsed.tests)) {
          parsed.tests.forEach((test: any) => {
            if (test.name && test.value) {
              // Try to parse numeric value
              const numValue = parseFloat(test.value.replace(/[^0-9.]/g, ''));
              if (!isNaN(numValue)) {
                dataPoint[test.name] = numValue;
              }
            }
          });
        }
      }
    } catch (e) {}
    return dataPoint;
  }).filter(dp => Object.keys(dp).length > 1); // Only keep points with actual data

  // Extract unique metric names for charting logic
  const metrics = React.useMemo(() => {
    const set = new Set<string>();
    chartData.forEach(dp => {
      Object.keys(dp).forEach(key => {
        if (key !== 'date') set.add(key);
      });
    });
    return Array.from(set);
  }, [chartData]);

  if (!activeProfile) return <div>Please select a profile.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lab Trends & Insights</h1>
          <p className="text-slate-500">Track your health metrics over time</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : labRecords.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No lab reports found</h3>
          <p className="text-slate-500">Upload lab reports to see trends and insights.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* AI Insights Card */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-indigo-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                AI Trend Analysis
              </h2>
              <button 
                onClick={generateInsights}
                disabled={loadingInsights}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loadingInsights ? 'Analyzing...' : 'Generate Insights'}
              </button>
            </div>
            
            {insights ? (
              <div className="prose prose-sm max-w-none text-slate-700">
                <p>{insights}</p>
              </div>
            ) : (
              <p className="text-sm text-indigo-600/70 italic">
                Click "Generate Insights" to get an AI-powered summary of your lab trends.
              </p>
            )}
          </div>

          {/* Charts */}
          {chartData.length > 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Metric Trends</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#64748b" fontSize={12} tickMargin={10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    {metrics.map((metric, index) => {
                      // Generate a consistent color based on the metric name
                      const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                      const color = colors[index % colors.length];
                      return (
                        <Line 
                          key={metric} 
                          type="monotone" 
                          dataKey={metric} 
                          stroke={color} 
                          strokeWidth={2}
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
              <p className="text-slate-500">Not enough structured numeric data found in lab reports to generate charts.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
