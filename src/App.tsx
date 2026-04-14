/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Layout, 
  FileText, 
  Settings, 
  Share2, 
  Download, 
  Type as TypeIcon,
  Sparkles,
  Code as CodeIcon,
  Eye
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Button } from '@/components/ui/button.tsx';
import { TooltipProvider } from '@/components/ui/tooltip.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import Editor from '@/components/Editor.tsx';
import CodeEditor from '@/components/CodeEditor.tsx';
import Preview from '@/components/Preview.tsx';
import WordAnalysis from '@/components/WordAnalysis.tsx';
import AIChat from '@/components/AIChat.tsx';
import { MessageSquare } from 'lucide-react';

export default function App() {
  const [html, setHtml] = useState<string>(`
    <h2>Welcome to the Visual HTML Editor</h2>
    <p>This is a powerful tool for creating and analyzing web content. You can use the toolbar above to format your text and insert headings.</p>
    <h3>Why use this editor?</h3>
    <ul className="list-disc pl-5">
      <li>Providing a clean, visual interface for HTML editing.</li>
      <li>Inspecting your heading structure (H2, H3, H4).</li>
      <li>Analyzing word repetitions to improve your writing style.</li>
      <li>Suggesting synonyms using AI to make your text more diverse.</li>
    </ul>
    <h4>Try it out!</h4>
    <p>Start typing here and see the analysis update in real-time on the right sidebar.</p>
  `);
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-6 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-1.5 rounded-lg">
              <TypeIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">HTML Editor <span className="text-primary">&</span> Analyzer</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Export HTML
            </Button>
            <Button size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
            <Tabs defaultValue="visual" className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="grid w-[400px] grid-cols-4">
                  <TabsTrigger value="visual" className="gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Visual
                  </TabsTrigger>
                  <TabsTrigger value="code" className="gap-2">
                    <CodeIcon className="h-3.5 w-3.5" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="gap-2">
                    <MessageSquare className="h-3.5 w-3.5" />
                    AI Chat
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Autosaved
                  </div>
                </div>
              </div>

              <TabsContent value="visual" className="flex-1 mt-0 focus-visible:outline-none">
                <Editor content={html} onChange={setHtml} highlightedWord={highlightedWord} />
              </TabsContent>

              <TabsContent value="code" className="flex-1 mt-0 focus-visible:outline-none">
                <CodeEditor content={html} onChange={setHtml} />
              </TabsContent>
              
              <TabsContent value="preview" className="flex-1 mt-0 focus-visible:outline-none">
                <Preview html={html} />
              </TabsContent>

              <TabsContent value="chat" className="flex-1 mt-0 focus-visible:outline-none">
                <AIChat />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <aside className="w-80 border-l bg-muted/10 flex flex-col overflow-hidden">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b bg-white/50">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">Content Insights</h2>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Real-time analysis of your writing quality and structure.
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                <WordAnalysis html={html} onWordClick={setHighlightedWord} />
              </div>
              <div className="p-4 border-t bg-white/50">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Word Count</span>
                  <span className="font-medium">{html.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Readability</span>
                  <span className="font-medium text-green-600">Good</span>
                </div>
              </div>
            </div>
          </aside>
        </main>
        
        <Toaster position="bottom-right" />
      </div>
    </TooltipProvider>
  );
}


