import { Fragment, useState, useCallback, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, User, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import TagInput from '../TagInput';
import ImageUpload from '../ImageUpload';

function EditPersonModal() {
  const {
    isEditPersonModalOpen,
    closeEditPersonModal,
    selectedPersonId,
    getPersonById,
    updatePerson,
    deletePerson,
    openConfirmDialog,
  } = useStore();

  const [name, setName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [peeps, setPeeps] = useState('');
  const [stream, setStream] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState('');

  const person = selectedPersonId ? getPersonById(selectedPersonId) : undefined;

  // Get all existing interests for suggestions
  const people = useStore((state) => state.people);
  const allInterests = Array.from(
    new Set(people.flatMap((p) => p.interests || []))
  ).sort();

  // Populate form when modal opens
  useEffect(() => {
    if (isEditPersonModalOpen && person) {
      setName(person.name);
      setAffiliation(person.affiliation || '');
      setPhotoUrl(person.photoUrl || '');
      setPeeps(person.peeps || '');
      setStream(person.stream || '');
      setInterests(person.interests || []);
      setError('');
    }
  }, [isEditPersonModalOpen, person]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!name.trim()) {
        setError('Name is required');
        return;
      }

      if (!selectedPersonId) return;

      updatePerson(selectedPersonId, {
        name: name.trim(),
        affiliation: affiliation.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        peeps: peeps.trim() || undefined,
        stream: stream.trim() || undefined,
        interests: interests.length > 0 ? interests : undefined,
      });

      closeEditPersonModal();
    },
    [name, affiliation, photoUrl, peeps, stream, interests, selectedPersonId, updatePerson, closeEditPersonModal]
  );

  const handleDelete = useCallback(() => {
    if (!selectedPersonId || !person) return;

    openConfirmDialog(
      `Are you sure you want to delete "${person.name}"? This will also remove all their connections.`,
      () => {
        deletePerson(selectedPersonId);
        closeEditPersonModal();
      }
    );
  }, [selectedPersonId, person, deletePerson, closeEditPersonModal, openConfirmDialog]);

  if (!person) return null;

  return (
    <Transition appear show={isEditPersonModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeEditPersonModal}>
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
                    Edit Person
                  </Dialog.Title>
                  <button
                    onClick={closeEditPersonModal}
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
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-affiliation" className="block text-sm font-medium text-gray-700 mb-1">
                      Affiliation
                    </label>
                    <input
                      id="edit-affiliation"
                      type="text"
                      value={affiliation}
                      onChange={(e) => setAffiliation(e.target.value)}
                      placeholder="MIT, Stanford, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-stream" className="block text-sm font-medium text-gray-700 mb-1">
                      Stream
                    </label>
                    <input
                      id="edit-stream"
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
                    <label htmlFor="edit-peeps" className="block text-sm font-medium text-gray-700 mb-1">
                      Peeps
                    </label>
                    <input
                      id="edit-peeps"
                      type="url"
                      value={peeps}
                      onChange={(e) => setPeeps(e.target.value)}
                      placeholder="https://peeps.com/johndoe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeEditPersonModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
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

export default EditPersonModal;
