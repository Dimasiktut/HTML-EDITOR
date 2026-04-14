import { useState, useMemo } from 'react';
import { BarChart3, RefreshCw, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { getSynonyms } from '@/lib/gemini.ts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils.ts';

interface WordAnalysisProps {
  html: string;
  onWordClick?: (word: string | null) => void;
}

export default function WordAnalysis({ html, onWordClick }: WordAnalysisProps) {
  const [loadingWord, setLoadingWord] = useState<string | null>(null);
  const [synonyms, setSynonyms] = useState<{ word: string; list: string[]; explanation?: string } | null>(null);
  const [activeWord, setActiveWord] = useState<string | null>(null);

  const text = useMemo(() => {
    // 1. First, replace all HTML tags with spaces to prevent word merging
    // e.g., "<h2>Hello</h2><p>World</p>" -> " Hello  World "
    const tagless = html.replace(/<[^>]+>/g, ' ');
    
    // 2. Use DOMParser to decode HTML entities (like &nbsp;, &lt;, etc.)
    const doc = new DOMParser().parseFromString(tagless, 'text/html');
    const decoded = doc.body.textContent || "";
    
    // 3. One more pass to remove any escaped tags that might have been decoded
    return decoded.replace(/<[^>]+>/g, ' ');
  }, [html]);

  const wordStats = useMemo(() => {
    // Clean text: remove punctuation and split by whitespace
    const words = text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"']/g, " ") // Added more punctuation and replace with space
      .split(/\s+/)
      .filter(w => {
        // Filter out:
        // - Short words (<= 3 chars)
        // - Common prepositions/conjunctions (stop words)
        // - Numbers
        const isNumber = /^\d+$/.test(w);
        const isStopWord = ['это', 'как', 'что', 'для', 'или', 'был', 'была', 'было', 'были', 'этот', 'эта', 'это', 'эти', 'with', 'this', 'that', 'from', 'have', 'been'].includes(w);
        return w.length > 3 && !isNumber && !isStopWord;
      });

    const counts: Record<string, number> = {};
    words.forEach(w => {
      counts[w] = (counts[w] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, count]) => count > 1); // Only show repetitions
  }, [text]);

  const handleGetSynonyms = async (word: string) => {
    // Toggle active word for highlighting
    const newActiveWord = activeWord === word ? null : word;
    setActiveWord(newActiveWord);
    if (onWordClick) onWordClick(newActiveWord);

    if (newActiveWord === null) return;

    setLoadingWord(word);
    try {
      const result = await getSynonyms(word, text.substring(0, 500));
      setSynonyms({ word, list: result.synonyms, explanation: result.explanation });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Analysis Error: ${message}`);
      console.error("Synonyms Error:", error);
    } finally {
      setLoadingWord(null);
    }
  };

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Word Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4">
          <div className="space-y-4">
            {wordStats.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Found {wordStats.length} repeated words. Click on a word to find synonyms and highlight occurrences.
                </p>
                <div className="flex flex-wrap gap-2">
                  {wordStats.map(([word, count]) => (
                    <Popover key={word}>
                      <PopoverTrigger
                        className={cn(
                          buttonVariants({ 
                            variant: activeWord === word ? "default" : "outline", 
                            size: "sm" 
                          }),
                          "h-7 px-2 text-xs gap-2 border-dashed hover:border-primary transition-colors",
                          activeWord === word && "border-solid"
                        )}
                        onClick={() => handleGetSynonyms(word)}
                      >
                        {word}
                        <Badge variant={activeWord === word ? "outline" : "secondary"} className="h-4 px-1 text-[10px]">
                          {count}
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Sparkles className="h-3 w-3 text-yellow-500" />
                              AI Suggestions
                            </h4>
                            <Badge variant="outline" className="text-[10px]">{word}</Badge>
                          </div>
                          
                          {loadingWord === word ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : synonyms && synonyms.word === word ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {synonyms.list.map(s => (
                                  <Badge key={s} variant="secondary" className="cursor-default">
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                              {synonyms.explanation && (
                                <p className="text-[10px] text-muted-foreground leading-tight italic">
                                  {synonyms.explanation}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No suggestions found.</p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2 opacity-50">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {text.length < 20 ? "Type more text to see analysis" : "No significant repetitions found"}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
