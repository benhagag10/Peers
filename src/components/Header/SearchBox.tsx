import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useReactFlow } from '@xyflow/react';
import { getInitials, getAvatarColor } from '../../utils/avatar';

function SearchBox() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { people, selectPerson } = useStore();
  const { setCenter } = useReactFlow();

  // Filter people by name or affiliation
  const filteredPeople = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return people.filter(
      (person) =>
        person.name.toLowerCase().includes(lowerQuery) ||
        person.affiliation?.toLowerCase().includes(lowerQuery)
    );
  }, [people, query]);

  // Handle selecting a person from search results
  const handleSelect = useCallback(
    (personId: string) => {
      const person = people.find((p) => p.id === personId);
      if (person) {
        selectPerson(personId);
        setCenter(person.position.x, person.position.y, { duration: 500, zoom: 1.5 });
        setQuery('');
        setIsOpen(false);
      }
    },
    [people, selectPerson, setCenter]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
      }
      if (e.key === 'Enter' && filteredPeople.length > 0) {
        handleSelect(filteredPeople[0].id);
      }
    },
    [filteredPeople, handleSelect]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search people... (⌘F)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-64 pl-10 pr-8 py-2.5 text-sm text-white
            bg-white/5 border border-white/10 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
            placeholder-white/40 backdrop-blur-sm
            transition-all duration-300"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full
              hover:bg-white/10 transition-colors"
          >
            <X className="w-3 h-3 text-white/40" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2
          bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-xl
          shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50">
          {filteredPeople.length === 0 ? (
            <div className="px-4 py-3 text-sm text-white/50">No people found</div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {filteredPeople.map((person) => (
                <li key={person.id}>
                  <button
                    onClick={() => handleSelect(person.id)}
                    className="w-full px-4 py-3 flex items-center gap-3
                      hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    {person.photoUrl ? (
                      <img
                        src={person.photoUrl}
                        alt={person.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center
                          text-white text-xs font-medium ring-2 ring-white/10"
                        style={{ backgroundColor: getAvatarColor(person.name) }}
                      >
                        {getInitials(person.name)}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">{person.name}</div>
                      {person.affiliation && (
                        <div className="text-xs text-white/50">{person.affiliation}</div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBox;
