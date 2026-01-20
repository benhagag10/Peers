import { Fragment, useState, useCallback, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { X, Link2, ChevronDown, Check, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { LINK_TYPES, LINK_TYPE_LABELS, LINK_TYPE_COLORS } from '../../utils/constants';
import type { LinkType } from '../../types';

function EditLinkModal() {
  const {
    isEditLinkModalOpen,
    closeEditLinkModal,
    selectedLinkId,
    getLinkById,
    getPersonById,
    updateLink,
    deleteLink,
    openConfirmDialog,
  } = useStore();

  const [description, setDescription] = useState('');
  const [type, setType] = useState<LinkType>('collaborator');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const link = selectedLinkId ? getLinkById(selectedLinkId) : undefined;
  const sourcePerson = link ? getPersonById(link.sourceId) : undefined;
  const targetPerson = link ? getPersonById(link.targetId) : undefined;

  // Populate form when modal opens
  useEffect(() => {
    if (isEditLinkModalOpen && link) {
      setDescription(link.description);
      setType(link.type);
      setUrl(link.url || '');
      setError('');
    }
  }, [isEditLinkModalOpen, link]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!description.trim()) {
        setError('Description is required');
        return;
      }

      if (!selectedLinkId) return;

      updateLink(selectedLinkId, {
        description: description.trim(),
        type,
        url: url.trim() || undefined,
      });

      closeEditLinkModal();
    },
    [description, type, url, selectedLinkId, updateLink, closeEditLinkModal]
  );

  const handleDelete = useCallback(() => {
    if (!selectedLinkId || !link) return;

    openConfirmDialog(
      `Are you sure you want to delete this connection between ${sourcePerson?.name || 'Unknown'} and ${targetPerson?.name || 'Unknown'}?`,
      () => {
        deleteLink(selectedLinkId);
        closeEditLinkModal();
      }
    );
  }, [selectedLinkId, link, sourcePerson, targetPerson, deleteLink, closeEditLinkModal, openConfirmDialog]);

  if (!link) return null;

  return (
    <Transition appear show={isEditLinkModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeEditLinkModal}>
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
                      <Link2 className="w-4 h-4 text-indigo-400" />
                    </div>
                    Edit Connection
                  </Dialog.Title>
                  <button
                    onClick={closeEditLinkModal}
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

                  {/* Connection info (read-only) */}
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl">
                    <span className="text-white/70">{sourcePerson?.name || 'Unknown'}</span>
                    <span className="text-white/30">→</span>
                    <span className="text-white/70">{targetPerson?.name || 'Unknown'}</span>
                  </div>

                  {/* Link type */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Type</label>
                    <Listbox value={type} onChange={setType}>
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-xl
                          bg-white/5 py-2.5 pl-3 pr-10 text-left border border-white/10
                          focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                          <span className="flex items-center gap-2 text-white">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: LINK_TYPE_COLORS[type] }}
                            />
                            {LINK_TYPE_LABELS[type]}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDown className="h-4 w-4 text-white/40" />
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto
                            rounded-xl bg-gray-800/95 backdrop-blur-xl py-1
                            shadow-lg border border-white/10 focus:outline-none">
                            {LINK_TYPES.map((linkType) => (
                              <Listbox.Option
                                key={linkType}
                                value={linkType}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-indigo-500/20 text-white' : 'text-white/70'
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`flex items-center gap-2 ${selected ? 'font-medium text-white' : 'font-normal'}`}>
                                      <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: LINK_TYPE_COLORS[linkType] }}
                                      />
                                      {LINK_TYPE_LABELS[linkType]}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-400">
                                        <Check className="h-4 w-4" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="edit-link-description" className="block text-sm font-medium text-white/70 mb-1.5">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="edit-link-description"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Co-authored paper on ML"
                      className="w-full px-3 py-2.5 text-white placeholder-white/30
                        bg-white/5 border border-white/10 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                        transition-all"
                      autoFocus
                    />
                  </div>

                  {/* URL (optional) */}
                  <div>
                    <label htmlFor="edit-link-url" className="block text-sm font-medium text-white/70 mb-1.5">
                      URL (optional)
                    </label>
                    <input
                      id="edit-link-url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2.5 text-white placeholder-white/30
                        bg-white/5 border border-white/10 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                        transition-all"
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                        text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl
                        hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeEditLinkModal}
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

export default EditLinkModal;
