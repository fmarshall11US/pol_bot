"use client";

import { useState, useEffect, useRef } from "react";
import { Send, FileText, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import UnderwriterHints from "@/components/underwriter-hints";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: 'high' | 'medium' | 'low';
  relevantChunks?: any[];
}

interface Document {
  id: string;
  file_name: string;
  created_at: string;
}

export default function QAPage({ params }: { params: Promise<{ documentId: string }> }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [document, setDocument] = useState<Document | null>(null);
  const [documentId, setDocumentId] = useState<string>("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get documentId from params
  useEffect(() => {
    const getDocumentId = async () => {
      const resolvedParams = await params;
      setDocumentId(resolvedParams.documentId);
    };
    getDocumentId();
  }, [params]);

  // Fetch document info when documentId is available
  useEffect(() => {
    if (!documentId) return;
    
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        if (response.ok) {
          const doc = await response.json();
          setDocument(doc);
        }
      } catch (error) {
        console.error('Failed to fetch document:', error);
      }
    };

    fetchDocument();
  }, [documentId]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendQuestion = async () => {
    if (!currentQuestion.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentQuestion.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentQuestion("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          documentId: documentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        confidence: data.confidence,
        relevantChunks: data.relevantChunks,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting answer:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuestion();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8 overflow-hidden">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <a 
              href="/dashboard"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to Dashboard
            </a>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Document Q&A
            </h1>
          </div>
          {document && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{document.file_name}</Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Uploaded {new Date(document.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Ask questions about your document
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {/* Messages Area */}
            <ScrollArea className="flex-1 pr-4 overflow-hidden" ref={scrollAreaRef}>
              <div className="space-y-4 w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Start a conversation</p>
                    <p className="text-sm">
                      Ask questions about your insurance policy document.
                    </p>
                    <div className="mt-4 space-y-2 text-left max-w-md mx-auto">
                      <p className="text-xs font-medium">Example questions:</p>
                      <div className="space-y-1 text-xs">
                        <p>• "What is my deductible amount?"</p>
                        <p>• "What does this policy cover?"</p>
                        <p>• "How do I file a claim?"</p>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex w-full ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] min-w-0 rounded-lg px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}
                      style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        hyphens: 'auto'
                      }}
                    >
                      <p className="text-sm whitespace-pre-wrap chat-message">
                        {message.content}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className={`text-xs opacity-70`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                        {message.type === 'assistant' && message.confidence && (
                          <Badge 
                            variant={
                              message.confidence === 'high' ? 'default' :
                              message.confidence === 'medium' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {message.confidence} confidence
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="flex gap-2 mt-4">
              <Textarea
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your document..."
                className="flex-1 min-h-[80px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendQuestion}
                disabled={!currentQuestion.trim() || isLoading}
                size="icon"
                className="h-[80px] w-12"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Underwriter Hints Section */}
        {documentId && (
          <UnderwriterHints 
            documentId={documentId} 
            policyType="auto" // Could be determined from document metadata
          />
        )}
      </div>
    </div>
  );
}