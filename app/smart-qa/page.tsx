"use client";

import { useState } from "react";
import { Send, Brain, FileText, TrendingUp, Shield, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Source {
  document: string;
  section: string;
  content: string;
  similarity: number;
  relevance: string;
}

interface QAResponse {
  answer: string;
  expertAnswer?: string;
  sources: Source[];
  confidence: string;
  searchResults: number;
  documentsSearched: number;
  originalQuestion?: string;
  isExpertOverride?: boolean;
  hasAIContext?: boolean;
  overrideDetails?: {
    originalQuestion: string;
    timesUsed: number;
    similarity: number;
  };
}

export default function SmartQAPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<QAResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    correctedAnswer: "",
    expertExplanation: "",
    confidenceThreshold: 0.85,
    appliesToAllDocuments: false
  });
  const [overrideSaving, setOverrideSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await fetch("/api/smart-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to get answer");
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError("Failed to process your question. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-orange-100 text-orange-800';
      case 'Expert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOverrideClick = () => {
    if (response) {
      setOverrideForm({
        correctedAnswer: response.answer,
        expertExplanation: "",
        confidenceThreshold: 0.85,
        appliesToAllDocuments: false
      });
      setShowOverrideDialog(true);
    }
  };

  const handleOverrideSave = async () => {
    if (!response || !overrideForm.correctedAnswer.trim()) return;

    setOverrideSaving(true);
    try {
      const res = await fetch("/api/expert-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalQuestion: response.originalQuestion || question,
          originalAnswer: response.answer,
          correctedAnswer: overrideForm.correctedAnswer,
          expertExplanation: overrideForm.expertExplanation,
          expertId: "current-user", // TODO: Use actual user ID when auth is implemented
          confidenceThreshold: overrideForm.confidenceThreshold,
          appliesToAllDocuments: overrideForm.appliesToAllDocuments,
          documentIds: [] // TODO: Pass actual document IDs if needed
        })
      });

      if (!res.ok) {
        throw new Error("Failed to save override");
      }

      setShowOverrideDialog(false);
      // Show success message
      setError(""); // Clear any existing error
    } catch (err) {
      console.error("Override save error:", err);
      setError("Failed to save override. Please try again.");
    } finally {
      setOverrideSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Smart Insurance Q&A
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Ask any question about your insurance policies and get intelligent answers
          </p>
        </div>

        {/* Question Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Ask Your Question
            </CardTitle>
            <CardDescription>
              Ask natural questions like &quot;What is my collision deductible?&quot; or &quot;How long do I have to report a claim?&quot;
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to know about your insurance policies?"
                className="flex-1"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !question.trim()}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Response */}
        {response && (
          <div className="space-y-6">
            {/* Expert Answer (if available) */}
            {response.isExpertOverride && response.expertAnswer && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      Expert Answer
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-800">
                        Expert Verified
                      </Badge>
                      <Badge className="bg-purple-600 text-white">
                        expert confidence
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {response.overrideDetails && (
                      <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-purple-900">
                              This is an expert-verified answer
                            </p>
                            <p className="text-purple-700 mt-1">
                              Used {response.overrideDetails.timesUsed} times • 
                              {Math.round(response.overrideDetails.similarity * 100)}% match to original question
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="prose max-w-none">
                      <p className="text-gray-800 font-medium whitespace-pre-wrap">
                        {response.expertAnswer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI-Generated Answer (if expert answer exists, show as additional context) */}
            {response.hasAIContext ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Additional Context from AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {response.answer}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : !response.isExpertOverride && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Answer
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getConfidenceColor(response.confidence)}>
                        {response.confidence} confidence
                      </Badge>
                      <Badge variant="outline">
                        {response.searchResults} results
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleOverrideClick}
                        className="flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        Override
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {response.answer}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sources */}
            {response.sources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Sources from Your Policies
                  </CardTitle>
                  <CardDescription>
                    Information used to answer your question
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {response.sources.map((source, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {source.document}
                            </span>
                            <span className="text-gray-500 text-sm">
                              {source.section}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={getRelevanceColor(source.relevance)}
                            >
                              {source.relevance}
                            </Badge>
                            <Badge variant="outline">
                              {source.similarity}% match
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {source.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Searched {response.documentsSearched} documents
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Found {response.searchResults} relevant sections
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    {response.confidence} confidence answer
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Example Questions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Try These Example Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "What is my collision deductible?",
                "How long do I have to report a claim?",
                "What are my liability limits?",
                "What is covered under medical payments?",
                "Are rental cars covered?",
                "What exclusions apply to my policy?"
              ].map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-left h-auto p-3 justify-start"
                  onClick={() => setQuestion(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Override Dialog */}
        <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Override AI Answer with Expert Correction
              </DialogTitle>
              <DialogDescription>
                Provide an expert correction that will be used for similar future questions
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
              <div className="space-y-2">
                <Label>Original Question</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm">{response?.originalQuestion || question}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="correctedAnswer">Corrected Answer *</Label>
                <Textarea
                  id="correctedAnswer"
                  value={overrideForm.correctedAnswer}
                  onChange={(e) => setOverrideForm(prev => ({ ...prev, correctedAnswer: e.target.value }))}
                  placeholder="Enter the correct answer that should be shown for this and similar questions"
                  className="min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expertExplanation">Expert Explanation</Label>
                <Textarea
                  id="expertExplanation"
                  value={overrideForm.expertExplanation}
                  onChange={(e) => setOverrideForm(prev => ({ ...prev, expertExplanation: e.target.value }))}
                  placeholder="Explain why this correction is needed (optional)"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confidenceThreshold">Similarity Threshold</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="confidenceThreshold"
                    type="number"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={overrideForm.confidenceThreshold}
                    onChange={(e) => setOverrideForm(prev => ({ 
                      ...prev, 
                      confidenceThreshold: parseFloat(e.target.value) || 0.85 
                    }))}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">
                    Questions must be {Math.round(overrideForm.confidenceThreshold * 100)}% similar to trigger this override
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="appliesToAll"
                  checked={overrideForm.appliesToAllDocuments}
                  onChange={(e) => setOverrideForm(prev => ({ 
                    ...prev, 
                    appliesToAllDocuments: e.target.checked 
                  }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="appliesToAll" className="font-normal cursor-pointer">
                  Apply this override to questions across all documents
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowOverrideDialog(false)}
                disabled={overrideSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleOverrideSave}
                disabled={overrideSaving || !overrideForm.correctedAnswer.trim()}
              >
                {overrideSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </div>
                ) : (
                  "Save Override"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}