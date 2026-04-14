import { useState, useEffect, useRef } from 'react';
import { Eye, Search, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PreviewProps {
  html: string;
}

export default function Preview({ html }: PreviewProps) {
  const [showHeadings, setShowHeadings] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showHeadings && previewRef.current) {
      const headings = previewRef.current.querySelectorAll('h2, h3, h4');
      headings.forEach((h) => {
        const heading = h as HTMLElement;
        heading.style.position = 'relative';
        heading.style.outline = '2px dashed #3b82f6';
        heading.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
        
        // Remove existing badge if any
        const existingBadge = heading.querySelector('.heading-badge');
        if (existingBadge) existingBadge.remove();
        
        const badge = document.createElement('span');
        badge.className = 'heading-badge';
        badge.textContent = heading.tagName;
        badge.style.position = 'absolute';
        badge.style.top = '-10px';
        badge.style.left = '0';
        badge.style.fontSize = '10px';
        badge.style.backgroundColor = '#3b82f6';
        badge.style.color = 'white';
        badge.style.padding = '2px 4px';
        badge.style.borderRadius = '4px';
        badge.style.fontWeight = 'bold';
        badge.style.zIndex = '10';
        badge.style.pointerEvents = 'none';
        
        heading.appendChild(badge);
      });
    } else if (previewRef.current) {
      const headings = previewRef.current.querySelectorAll('h2, h3, h4');
      headings.forEach((h) => {
        const heading = h as HTMLElement;
        heading.style.outline = 'none';
        heading.style.backgroundColor = 'transparent';
        const badge = heading.querySelector('.heading-badge');
        if (badge) badge.remove();
      });
    }
  }, [showHeadings, html]);

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden bg-white">
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Eye className="h-4 w-4" />
          Live Preview
        </div>
        <Button 
          variant={showHeadings ? "default" : "outline"} 
          size="sm" 
          onClick={() => setShowHeadings(!showHeadings)}
          className="h-8 gap-2"
        >
          <Search className="h-4 w-4" />
          {showHeadings ? "Hide Headings" : "Inspect Headings"}
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto p-8">
        <div 
          ref={previewRef}
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        
        {html.trim() === '' && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 opacity-50">
            <Info className="h-8 w-8" />
            <p>No content to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
