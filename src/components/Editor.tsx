import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import { 
  Heading2, Heading3, Heading4, 
  Bold, Italic, List, ListOrdered, 
  Undo, Redo, Quote, Code, Sparkles, Loader2, X
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { getImprovementSuggestions } from '@/lib/gemini';
import { toast } from 'sonner';

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
  highlightedWord?: string | null;
}

export default function Editor({ content, onChange, highlightedWord }: EditorProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [2, 3, 4],
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      
      // Only show menu if there is a selection and it's not just a cursor
      if (from === to) {
        setMenuPos(null);
        setAiSuggestions([]);
        return;
      }

      // Calculate position for custom bubble menu
      const { view } = editor;
      try {
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          // Position menu above the selection
          setMenuPos({
            top: start.top - rect.top - 50,
            left: (start.left + end.left) / 2 - rect.left
          });
        }
      } catch (e) {
        // coordsAtPos might fail if selection is not visible
        setMenuPos(null);
      }
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    
    // Clear previous highlights
    editor.commands.unsetHighlight();

    if (highlightedWord) {
      const { state } = editor;
      const { doc } = state;
      
      // Collect all matches first
      const matches: { from: number; to: number }[] = [];
      doc.descendants((node, pos) => {
        if (node.isText && node.text) {
          const regex = new RegExp(`\\b${highlightedWord}\\b`, 'gi');
          let match;
          while ((match = regex.exec(node.text)) !== null) {
            matches.push({
              from: pos + match.index,
              to: pos + match.index + match[0].length
            });
          }
        }
      });

      // Apply highlights in a single transaction if possible, or sequentially
      if (matches.length > 0) {
        let chain = editor.chain();
        matches.forEach(m => {
          chain = chain.setTextSelection({ from: m.from, to: m.to }).setHighlight({ color: '#fef08a' });
        });
        // Restore selection to avoid jumping
        const currentSelection = editor.state.selection;
        chain.setTextSelection(currentSelection).run();
      }
    }
  }, [highlightedWord, editor]);

  if (!editor) return null;

  const handleAiImprove = async () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    
    if (!selectedText || selectedText.trim().length < 2) {
      toast.error("Please select some text first");
      return;
    }

    setAiLoading(true);
    try {
      const result = await getImprovementSuggestions(selectedText, editor.getText());
      setAiSuggestions(result.suggestions);
    } catch (error) {
      toast.error("Failed to get AI suggestions");
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    editor.chain().focus().insertContent(suggestion).run();
    setAiSuggestions([]);
    setMenuPos(null);
  };

  const MenuButton = ({ onClick, isActive = false, children, tooltip }: any) => (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        className={cn(
          buttonVariants({ variant: isActive ? 'default' : 'ghost', size: 'sm' }),
          "h-8 w-8 p-0"
        )}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );

  return (
    <div ref={containerRef} className="flex flex-col h-full border rounded-md overflow-hidden bg-white relative">
      {/* Custom Bubble Menu */}
      {menuPos && (
        <div 
          className="absolute z-50 flex flex-col items-center pointer-events-none"
          style={{ top: menuPos.top, left: menuPos.left, transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center gap-1 p-1 bg-white border rounded-lg shadow-xl pointer-events-auto">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs gap-2 text-primary hover:text-primary hover:bg-primary/10"
              onClick={handleAiImprove}
              disabled={aiLoading}
            >
              {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              AI Improve
            </Button>
            {aiSuggestions.length > 0 && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setAiSuggestions([]); setMenuPos(null); }}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {aiSuggestions.length > 0 && (
            <div className="mt-2 w-64 bg-white border rounded-lg shadow-2xl p-2 pointer-events-auto">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 px-1">AI Suggestions:</p>
              <div className="space-y-1 max-h-48 overflow-auto">
                {aiSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => applySuggestion(s)}
                    className="w-full text-left text-xs p-2 hover:bg-muted rounded transition-colors border border-transparent hover:border-primary/20"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 p-1 border-b bg-muted/30 flex-wrap">
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} tooltip="Heading 2">
          <Heading2 className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} tooltip="Heading 3">
          <Heading3 className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} isActive={editor.isActive('heading', { level: 4 })} tooltip="Heading 4">
          <Heading4 className="h-4 w-4" />
        </MenuButton>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} tooltip="Bold">
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} tooltip="Italic">
          <Italic className="h-4 w-4" />
        </MenuButton>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} tooltip="Bullet List">
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} tooltip="Ordered List">
          <ListOrdered className="h-4 w-4" />
        </MenuButton>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} tooltip="Blockquote">
          <Quote className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} tooltip="Code">
          <Code className="h-4 w-4" />
        </MenuButton>
        <div className="ml-auto flex gap-1">
          <MenuButton onClick={() => editor.chain().focus().undo().run()} tooltip="Undo">
            <Undo className="h-4 w-4" />
          </MenuButton>
          <MenuButton onClick={() => editor.chain().focus().redo().run()} tooltip="Redo">
            <Redo className="h-4 w-4" />
          </MenuButton>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 prose prose-sm max-w-none focus:outline-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
