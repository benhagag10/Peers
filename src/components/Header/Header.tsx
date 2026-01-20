import { useEffect } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';
import SearchBox from './SearchBox';

function Header() {
  const { openAddPersonModal } = useStore();

  // Global keyboard shortcut for adding person
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        openAddPersonModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openAddPersonModal]);

  return (
    <header className="h-16 px-6 flex items-center justify-between shrink-0
      bg-white/5 backdrop-blur-xl border-b border-white/10">
      {/* Logo / Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
          flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-white tracking-tight">
          Peeps
        </h1>
      </div>

      {/* Search and Add button */}
      <div className="flex items-center gap-4">
        <SearchBox />

        <button
          onClick={openAddPersonModal}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white
            bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl
            hover:from-indigo-400 hover:to-purple-500
            transition-all duration-300
            shadow-[0_0_20px_rgba(99,102,241,0.3)]
            hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]
            hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Person</span>
          <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-xs
            bg-white/20 rounded-md font-mono">
            ⌘N
          </kbd>
        </button>
      </div>
    </header>
  );
}

export default Header;
