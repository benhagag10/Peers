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
          <div className="fixed inset-0 bg-black/30" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Add Person
                  </Dialog.Title>
                  <button
                    onClick={closeAddPersonModal}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
                  )}

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label htmlFor="affiliation" className="block text-sm font-medium text-gray-700 mb-1">
                      Affiliation
                    </label>
                    <input
                      id="affiliation"
                      type="text"
                      value={affiliation}
                      onChange={(e) => setAffiliation(e.target.value)}
                      placeholder="MIT, Stanford, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="stream" className="block text-sm font-medium text-gray-700 mb-1">
                      Stream
                    </label>
                    <input
                      id="stream"
                      type="text"
                      value={stream}
                      onChange={(e) => setStream(e.target.value)}
                      placeholder="e.g., Machine Learning, NLP, Vision"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      People with the same stream will be automatically connected
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interests
                    </label>
                    <TagInput
                      tags={interests}
                      onChange={setInterests}
                      placeholder="Type interest and press space..."
                      suggestions={allInterests}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      People with shared interests will be automatically connected
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Photo
                    </label>
                    <ImageUpload value={photoUrl} onChange={setPhotoUrl} />
                  </div>

                  <div>
                    <label htmlFor="peeps" className="block text-sm font-medium text-gray-700 mb-1">
                      Peeps
                    </label>
                    <input
                      id="peeps"
                      type="url"
                      value={peeps}
                      onChange={(e) => setPeeps(e.target.value)}
                      placeholder="https://peeps.com/johndoe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeAddPersonModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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
