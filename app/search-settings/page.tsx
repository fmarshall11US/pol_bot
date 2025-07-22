"use client";

import { useState, useEffect } from "react";
import { Brain, Target, BarChart3, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface SearchSettings {
  similarityThreshold: number;
  maxResults: number;
  contextChunks: number;
}

export default function SearchSettingsPage() {
  const [settings, setSettings] = useState<SearchSettings>({
    similarityThreshold: 0.3,
    maxResults: 15,
    contextChunks: 5
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/search-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    
    try {
      const response = await fetch('/api/search-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        setMessage("✅ Settings saved successfully!");
      } else {
        const errorData = await response.json();
        setMessage(`❌ Error: ${errorData.error}`);
      }
    } catch {
      setMessage("❌ Failed to save settings");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const getThresholdDescription = (threshold: number) => {
    if (threshold >= 0.7) return { text: "Very Strict", color: "bg-red-100 text-red-800" };
    if (threshold >= 0.5) return { text: "Strict", color: "bg-orange-100 text-orange-800" };
    if (threshold >= 0.3) return { text: "Balanced", color: "bg-yellow-100 text-yellow-800" };
    if (threshold >= 0.1) return { text: "Lenient", color: "bg-blue-100 text-blue-800" };
    return { text: "Very Lenient", color: "bg-green-100 text-green-800" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  const thresholdDesc = getThresholdDescription(settings.similarityThreshold);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Search Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Tune the AI search accuracy and performance
          </p>
        </div>

        <div className="space-y-6">
          {/* Similarity Threshold */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Similarity Threshold
              </CardTitle>
              <CardDescription>
                How closely content must match your question (lower = more results, higher = more accurate)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="threshold">Threshold: {settings.similarityThreshold.toFixed(2)}</Label>
                <Badge className={thresholdDesc.color}>
                  {thresholdDesc.text}
                </Badge>
              </div>
              <Slider
                id="threshold"
                min={0.1}
                max={0.9}
                step={0.05}
                value={[settings.similarityThreshold]}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, similarityThreshold: value[0] }))
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>More Results</span>
                <span>More Accurate</span>
              </div>
              <div className="text-sm text-gray-600">
                <strong>Recommendation:</strong> Start with 0.3 for balanced results. 
                Increase to 0.5+ if getting too many irrelevant results. 
                Decrease to 0.2 if missing relevant content.
              </div>
            </CardContent>
          </Card>

          {/* Max Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Maximum Search Results
              </CardTitle>
              <CardDescription>
                How many chunks to search through (more = better context, slower response)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="maxResults" className="min-w-fit">Max Results:</Label>
                <Input
                  id="maxResults"
                  type="number"
                  min={5}
                  max={50}
                  value={settings.maxResults}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, maxResults: parseInt(e.target.value) || 15 }))
                  }
                  className="w-24"
                />
                <span className="text-sm text-gray-600">chunks</span>
              </div>
              <div className="text-sm text-gray-600">
                <strong>Recommendation:</strong> 15-20 for most cases. 
                Increase to 30+ for complex queries across multiple documents.
              </div>
            </CardContent>
          </Card>

          {/* Context Chunks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Context Chunks for AI
              </CardTitle>
              <CardDescription>
                How many of the best chunks to send to AI for generating answers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="contextChunks" className="min-w-fit">Context Chunks:</Label>
                <Input
                  id="contextChunks"
                  type="number"
                  min={1}
                  max={10}
                  value={settings.contextChunks}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, contextChunks: parseInt(e.target.value) || 5 }))
                  }
                  className="w-24"
                />
                <span className="text-sm text-gray-600">chunks</span>
              </div>
              <div className="text-sm text-gray-600">
                <strong>Recommendation:</strong> 3-5 for focused answers. 
                Increase to 7-10 for comprehensive analysis across policy sections.
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Apply Settings</p>
                  <p className="text-sm text-gray-600">
                    Changes will affect all future AI searches
                  </p>
                </div>
                <Button 
                  onClick={saveSettings} 
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Settings
                </Button>
              </div>
              {message && (
                <div className="mt-3 text-sm">
                  {message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Presets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSettings({
                    similarityThreshold: 0.2,
                    maxResults: 20,
                    contextChunks: 7
                  })}
                >
                  🔍 Find More
                  <div className="text-xs text-gray-500 ml-2">Broader search</div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSettings({
                    similarityThreshold: 0.3,
                    maxResults: 15,
                    contextChunks: 5
                  })}
                >
                  ⚖️ Balanced
                  <div className="text-xs text-gray-500 ml-2">Default settings</div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSettings({
                    similarityThreshold: 0.6,
                    maxResults: 10,
                    contextChunks: 3
                  })}
                >
                  🎯 Precise
                  <div className="text-xs text-gray-500 ml-2">High accuracy</div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

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