import { Textarea } from '@/components/ui/textarea.tsx';
import { Button } from '@/components/ui/button.tsx';
import { AlignLeft, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import prettier from 'prettier/standalone';
import parserHtml from 'prettier/plugins/html';

interface CodeEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function CodeEditor({ content, onChange }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const formatCode = async () => {
    try {
      const formatted = await prettier.format(content, {
        parser: 'html',
        plugins: [parserHtml],
        printWidth: 120,
        tabWidth: 2,
        useTabs: false,
      });
      
      // Collapse <p> tags to be on a single line
      const collapsed = formatted.replace(/<p>\s*\n\s*([\s\S]*?)\s*\n\s*<\/p>/g, (match, p1) => {
        return `<p>${p1.trim()}</p>`;
      });
      
      onChange(collapsed);
    } catch (error) {
      console.error('Formatting error:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden bg-slate-950">
      <div className="flex items-center justify-between p-2 border-b border-slate-800 bg-slate-900 text-slate-400">
        <div className="flex items-center gap-2 text-xs font-mono px-2">
          <span>index.html</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={formatCode}
            className="h-7 px-2 text-[10px] gap-1.5 hover:bg-slate-800 hover:text-slate-100"
          >
            <AlignLeft className="h-3 w-3" />
            Форматировать
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={copyToClipboard}
            className="h-7 px-2 text-[10px] gap-1.5 hover:bg-slate-800 hover:text-slate-100"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                Скопировано
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Копировать
              </>
            )}
          </Button>
        </div>
      </div>
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full p-4 bg-transparent text-slate-300 font-mono text-sm resize-none focus:outline-none border-none"
        spellCheck={false}
      />
    </div>
  );
}
