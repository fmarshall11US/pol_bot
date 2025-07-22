"use client";

import { useState, useEffect } from "react";
import { Shield, Search, Edit3, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExpertOverride {
  id: string;
  original_question: string;
  original_answer: string;
  corrected_answer: string;
  expert_explanation: string;
  expert_id: string;
  confidence_threshold: number;
  is_active: boolean;
  applies_to_all_documents: boolean;
  times_used: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function OverrideManagementPage() {
  const [overrides, setOverrides] = useState<ExpertOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchOverrides();
  }, [showInactive]);

  const fetchOverrides = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/expert-overrides?active=${!showInactive}`);
      if (response.ok) {
        const data = await response.json();
        setOverrides(data);
      }
    } catch (error) {
      console.error('Failed to fetch overrides:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOverrideStatus = async (override: ExpertOverride) => {
    try {
      const response = await fetch('/api/expert-overrides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: override.id,
          isActive: !override.is_active,
          changedBy: 'current-user' // TODO: Use actual user ID
        })
      });

      if (response.ok) {
        fetchOverrides();
      }
    } catch (error) {
      console.error('Failed to toggle override:', error);
    }
  };

  const filteredOverrides = overrides.filter(override =>
    override.original_question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    override.corrected_answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Expert Override Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage expert corrections for AI answers
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search overrides..."
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-2"
          >
            {showInactive ? (
              <>
                <ToggleRight className="h-4 w-4" />
                Showing All
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4" />
                Active Only
              </>
            )}
          </Button>
          <a href="/smart-qa">
            <Button>
              Create New Override
            </Button>
          </a>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}

        {/* Overrides List */}
        {!loading && filteredOverrides.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No overrides found</p>
            </CardContent>
          </Card>
        )}

        {!loading && filteredOverrides.length > 0 && (
          <div className="grid gap-4">
            {filteredOverrides.map((override) => (
              <Card key={override.id} className={!override.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">
                        {override.original_question}
                      </CardTitle>
                      <CardDescription>
                        Created {new Date(override.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={override.is_active ? "default" : "secondary"}>
                        {override.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {override.applies_to_all_documents && (
                        <Badge variant="outline">Global</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Corrected Answer:</p>
                    <p className="text-sm">{override.corrected_answer}</p>
                  </div>
                  
                  {override.expert_explanation && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Expert Explanation:</p>
                      <p className="text-sm text-gray-600">{override.expert_explanation}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Threshold: {Math.round(override.confidence_threshold * 100)}%</span>
                      <span>Used {override.times_used} times</span>
                      {override.last_used_at && (
                        <span>Last used {new Date(override.last_used_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleOverrideStatus(override)}
                      >
                        {override.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <a href="/dashboard">
            <Button variant="outline">
              ← Back to Dashboard
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}