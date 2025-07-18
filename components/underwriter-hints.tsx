"use client";

import { useState } from "react";
import { Plus, Lightbulb, Save, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface UnderwriterHintsProps {
  documentId: string;
  policyType?: string;
}

interface Hint {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  underwriter_id: string;
  created_at: string;
}

const categories = [
  { value: "coverage_interpretation", label: "Coverage Interpretation" },
  { value: "exclusions", label: "Exclusions" },
  { value: "claims_handling", label: "Claims Handling" },
  { value: "policy_notes", label: "Policy Notes" },
  { value: "risk_assessment", label: "Risk Assessment" },
  { value: "regulatory_notes", label: "Regulatory Notes" },
  { value: "general", label: "General" },
];

export default function UnderwriterHints({ documentId, policyType }: UnderwriterHintsProps) {
  const [hints, setHints] = useState<Hint[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isGlobal, setIsGlobal] = useState(false);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !category) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/underwriter-hints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          policyType,
          title: title.trim(),
          content: content.trim(),
          category,
          tags,
          isGlobal,
        }),
      });

      if (response.ok) {
        const newHint = await response.json();
        setHints([newHint, ...hints]);
        
        // Reset form
        setTitle("");
        setContent("");
        setCategory("");
        setTags([]);
        setIsGlobal(false);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to save hint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Underwriter Knowledge
            </CardTitle>
            <CardDescription>
              Add insights and annotations to help others understand this policy better
            </CardDescription>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Hint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Underwriter Knowledge</DialogTitle>
                <DialogDescription>
                  Share your expertise to help others understand this policy better
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief description of your insight"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="content">Knowledge/Insight</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your detailed insights about this policy aspect..."
                    className="min-h-[120px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tags for easier searching"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="global"
                    checked={isGlobal}
                    onChange={(e) => setIsGlobal(e.target.checked)}
                  />
                  <Label htmlFor="global" className="text-sm">
                    Make this available for all similar policies (global knowledge)
                  </Label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Knowledge'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      {hints.length > 0 && (
        <CardContent>
          <div className="space-y-3">
            {hints.map(hint => (
              <div key={hint.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{hint.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {categories.find(c => c.value === hint.category)?.label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {hint.content}
                </p>
                <div className="flex items-center gap-2">
                  {hint.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  <span className="text-xs text-gray-500 ml-auto">
                    Added {new Date(hint.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}