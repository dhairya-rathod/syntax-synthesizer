import React, { useMemo, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript'; // Load JS syntax

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  
  // Generate highlighted HTML string instead of manipulating DOM directly.
  // This prevents "NotFoundError: Failed to execute 'removeChild' on 'Node'" errors
  // caused by React trying to update nodes that Prism.js modified/removed.
  const highlightedCode = useMemo(() => {
    const grammar = Prism.languages.javascript || Prism.languages.plain;
    return Prism.highlight(code, grammar, 'javascript');
  }, [code]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Handle Tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      // Insert 2 spaces for tab
      const newValue = code.substring(0, start) + "  " + code.substring(end);
      onChange(newValue);
      
      // Move caret
      setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="code-overlay-container h-full font-mono rounded-xl overflow-hidden border border-slate-700 bg-slate-900/50 backdrop-blur shadow-inner relative">
      {/* Layer 1: Syntax Highlighting */}
      <pre 
        ref={preRef}
        className="editor-layer highlight-layer" 
        aria-hidden="true"
      >
        <code 
          className="language-javascript"
          dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }} 
        />
      </pre>

      {/* Layer 2: Editable Textarea */}
      <textarea
        ref={textareaRef}
        className="editor-layer input-layer"
        value={code}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        spellCheck="false"
        autoCapitalize="off"
        autoComplete="off"
      />
    </div>
  );
};

export default CodeEditor;