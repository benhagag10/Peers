import { Fragment, useState, useCallback, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, User } from 'lucide-react';
import { useStore } from '../../store/useStore';
import TagInput from '../TagInput';
import ImageUpload from '../ImageUpload';

function AddPersonModal() {
  const { isAddPersonModalOpen, closeAddPersonModal, addPerson } = useStore();

  const [name, setName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [peeps, setPeeps] = useState('');
  const [stream, setStream] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Get all existing interests for suggestions
  const people = useStore((state) => state.people);
  const allInterests = Array.from(
    new Set(people.flatMap((p) => p.interests || []))
  ).sort();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isAddPersonModalOpen) {
      setName('');
      setAffiliation('');
      setPhotoUrl('');
      setPeeps('');
      setStream('');
      setInterests([]);
      setError('');
    }
  }, [isAddPersonModalOpen]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!name.trim()) {
        setError('Name is required');
        return;
      }

      // Get the position from the store (set by double-click) or use default
      const state = useStore.getState() as { _newPersonPosition?: { x: number; y: number } };
      const position = state._newPersonPosition || {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      };

      addPerson({
        name: name.trim(),
        affiliation: affiliation.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        peeps: peeps.trim() || undefined,
        stream: stream.trim() || undefined,
        interests: interests.length > 0 ? interests : undefined,
        position,
      });

      // Clear the stored position
      useStore.setState((s) => ({ ...s, _newPersonPosition: undefined }));

      closeAddPersonModal();
    },
    [name, affiliation, photoUrl, peeps, stream, interests, addPerson, closeAddPersonModal]
  );

  return (
    <Transition appear show={isAddPersonModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeAddPersonModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl
                bg-gray-900/95 backdrop-blur-xl border border-white/10
                shadow-[0_25px_60px_rgba(0,0,0,0.5)] transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/20">
                      <User className="w-4 h-4 text-indigo-400" />
                    </div>
                    Add Person
                  </Dialog.Title>
                  <button
                    onClick={closeAddPersonModal}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1.5">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2.5 text-white placeholder-white/30
                        bg-white/5 border border-white/10 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                        transition-all"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label htmlFor="affiliation" className="block text-sm font-medium text-white/70 mb-1.5">
                      Affiliation
                    </label>
                    <input
                      id="affiliation"
                      type="text"
                      value={affiliation}
                      onChange={(e) => setAffiliation(e.target.value)}
                      placeholder="MIT, Stanford, etc."
                      className="w-full px-3 py-2.5 text-white placeholder-white/30
                        bg-white/5 border border-white/10 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                        transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="stream" className="block text-sm font-medium text-white/70 mb-1.5">
                      Stream
                    </label>
                    <input
                      id="stream"
                      type="text"
                      value={stream}
                      onChange={(e) => setStream(e.target.value)}
                      placeholder="e.g., Machine Learning, NLP, Vision"
                      className="w-full px-3 py-2.5 text-white placeholder-white/30
                        bg-white/5 border border-white/10 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                        transition-all"
                    />
                    <p className="mt-1.5 text-xs text-white/40">
                      People with the same stream will be automatically connected
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Interests
                    </label>
                    <TagInput
                      tags={interests}
                      onChange={setInterests}
                      placeholder="Type interest and press space..."
                      suggestions={allInterests}
                    />
                    <p className="mt-1.5 text-xs text-white/40">
                      People with shared interests will be automatically connected
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Photo
                    </label>
                    <ImageUpload value={photoUrl} onChange={setPhotoUrl} />
                  </div>

                  <div>
                    <label htmlFor="peeps" className="block text-sm font-medium text-white/70 mb-1.5">
                      Peeps
                    </label>
                    <input
                      id="peeps"
                      type="url"
                      value={peeps}
                      onChange={(e) => setPeeps(e.target.value)}
                      placeholder="https://peeps.com/johndoe"
                      className="w-full px-3 py-2.5 text-white placeholder-white/30
                        bg-white/5 border border-white/10 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                        transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeAddPersonModal}
                      className="px-4 py-2.5 text-sm font-medium text-white/70
                        bg-white/5 border border-white/10 rounded-xl
                        hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2.5 text-sm font-medium text-white
                        bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl
                        hover:from-indigo-400 hover:to-purple-500
                        shadow-[0_0_20px_rgba(99,102,241,0.3)]
                        hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]
                        transition-all"
                    >
                      Add Person
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default AddPersonModal;
