"use client";

import { Shield, Database, Bug, Search, RefreshCw, Wrench, Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              System administration and maintenance tools
            </p>
          </div>
          <a href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </a>
        </div>

        {/* Admin Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Database Setup */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Database Setup
              </CardTitle>
              <CardDescription>
                Initialize or update database schema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/setup-database">
                <Button className="w-full" variant="outline">
                  Setup Database
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Debug Overrides */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-red-600" />
                Debug Overrides
              </CardTitle>
              <CardDescription>
                Test expert override matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/debug-overrides">
                <Button className="w-full" variant="outline">
                  Debug Overrides
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Test Search */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-green-600" />
                Test Search
              </CardTitle>
              <CardDescription>
                Test document search functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/test-search">
                <Button className="w-full" variant="outline">
                  Test Search
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Fix Embeddings */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-600" />
                Fix Embeddings
              </CardTitle>
              <CardDescription>
                Repair corrupted vector embeddings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/fix-embeddings">
                <Button className="w-full" variant="outline">
                  Fix Embeddings
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Reprocess Documents */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-purple-600" />
                Reprocess Documents
              </CardTitle>
              <CardDescription>
                Re-extract and process PDF content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/reprocess-documents">
                <Button className="w-full" variant="outline">
                  Reprocess Documents
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Search Settings */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Search Settings
              </CardTitle>
              <CardDescription>
                Configure search thresholds and parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/search-settings">
                <Button className="w-full" variant="outline">
                  Search Settings
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Expert Overrides */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Expert Overrides
              </CardTitle>
              <CardDescription>
                Manage expert-verified answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/override-management">
                <Button className="w-full" variant="outline">
                  Manage Overrides
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Admin Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• <strong>Database Setup:</strong> Run SQL scripts to initialize expert override system</p>
              <p>• <strong>Debug Overrides:</strong> Test why expert overrides might not be matching</p>
              <p>• <strong>Test Search:</strong> Verify document search and embedding functionality</p>
              <p>• <strong>Fix Embeddings:</strong> Repair documents with incorrect vector dimensions</p>
              <p>• <strong>Reprocess Documents:</strong> Re-extract text from PDFs and regenerate embeddings</p>
              <p>• <strong>Search Settings:</strong> Adjust similarity thresholds and search parameters</p>
              <p>• <strong>Expert Overrides:</strong> Create and manage expert-verified answers</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}