import { useEffect, useState, useRef } from 'react';
import { Plus, Sparkles, Lightbulb, Globe, Lock, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import SearchBox from './SearchBox';
import FeatureRequestModal from '../Modals/FeatureRequestModal';

function Header() {
  const { openAddPersonModal } = useStore();
  const [isFeatureRequestModalOpen, setIsFeatureRequestModalOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  // Close mode dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) {
        setIsModeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
            flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Peeps
          </h1>
        </div>

        {/* Mode Selector */}
        <div ref={modeDropdownRef} className="relative">
          <button
            onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium
              bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg
              hover:bg-emerald-500/30 transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isModeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isModeDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-48
              bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl
              shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50">
              <button
                onClick={() => setIsModeDropdownOpen(false)}
                className="w-full px-4 py-3 flex items-center gap-3
                  bg-emerald-500/10 border-l-2 border-emerald-500"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <div className="text-sm font-medium text-white">Public</div>
                  <div className="text-xs text-white/50">Anyone can edit</div>
                </div>
              </button>
              <div
                className="w-full px-4 py-3 flex items-center gap-3
                  opacity-50 cursor-not-allowed border-l-2 border-transparent"
              >
                <Lock className="w-4 h-4 text-white/40" />
                <div className="text-left">
                  <div className="text-sm font-medium text-white/60">Private</div>
                  <div className="text-xs text-white/40">Coming soon</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search and buttons */}
      <div className="flex items-center gap-3">
        <SearchBox />

        <button
          onClick={() => setIsFeatureRequestModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-white
            bg-white/5 border border-white/10 rounded-xl
            hover:bg-white/10 hover:border-white/20
            transition-all duration-300"
          title="Feature Requests"
        >
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Requests</span>
        </button>

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

      <FeatureRequestModal
        isOpen={isFeatureRequestModalOpen}
        onClose={() => setIsFeatureRequestModalOpen(false)}
      />
    </header>
  );
}

export default Header;
