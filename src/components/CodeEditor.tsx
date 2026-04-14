import { Textarea } from '@/components/ui/textarea';

interface CodeEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function CodeEditor({ content, onChange }: CodeEditorProps) {
  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden bg-slate-950">
      <div className="flex items-center gap-2 p-2 border-b border-slate-800 bg-slate-900 text-slate-400 text-xs font-mono">
        <span>index.html</span>
      </div>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full p-4 bg-transparent text-slate-300 font-mono text-sm resize-none focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
}
