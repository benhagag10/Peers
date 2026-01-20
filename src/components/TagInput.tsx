import { useState, useCallback, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

function TagInput({ tags, onChange, placeholder = 'Type and press space...', suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions that match input and aren't already added
  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  );

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim().toLowerCase();
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }
      setInput('');
      setShowSuggestions(false);
    },
    [tags, onChange]
  );

  const removeTag = useCallback(
    (index: number) => {
      onChange(tags.filter((_, i) => i !== index));
    },
    [tags, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === ' ' && input.trim()) {
        e.preventDefault();
        addTag(input);
      } else if (e.key === 'Backspace' && !input && tags.length > 0) {
        e.preventDefault();
        removeTag(tags.length - 1);
      } else if (e.key === 'Enter' && input.trim()) {
        e.preventDefault();
        addTag(input);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    },
    [input, tags, addTag, removeTag]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Don't allow spaces in the input - they trigger adding a tag
    if (!value.includes(' ')) {
      setInput(value);
      setShowSuggestions(value.length > 0);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-1.5 p-2.5 bg-white/5 border border-white/10 rounded-xl
          focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50
          min-h-[46px] cursor-text transition-all"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-500/20 text-pink-300
              border border-pink-500/30 rounded-full text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="hover:bg-pink-500/30 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => input && setShowSuggestions(true)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] outline-none text-sm bg-transparent text-white placeholder-white/30"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-gray-800/95 backdrop-blur-xl
          border border-white/10 rounded-xl shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.slice(0, 8).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addTag(suggestion);
              }}
              className="w-full px-3 py-2 text-left text-sm text-white/70 hover:bg-indigo-500/20
                hover:text-white transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <p className="mt-1.5 text-xs text-white/40">
        Press space to add, backspace to remove
      </p>
    </div>
  );
}

export default TagInput;
