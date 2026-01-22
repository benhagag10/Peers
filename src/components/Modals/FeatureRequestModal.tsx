import { Fragment, useState, useCallback, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { X, Lightbulb, Send, MessageSquare, User, UserX } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { FeatureRequest } from '../../types';
import { featureRequestsApi } from '../../lib/api';
import { initializeSocket } from '../../lib/socket';

interface FeatureRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function FeatureRequestModal({ isOpen, onClose }: FeatureRequestModalProps) {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [requestText, setRequestText] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load feature requests when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRequests();

      // Set up socket listeners for real-time updates
      initializeSocket({
        onFeatureRequestCreated: (request) => {
          setRequests((prev) => {
            if (prev.some((r) => r.id === request.id)) return prev;
            return [request, ...prev];
          });
        },
        onFeatureRequestDeleted: ({ id }) => {
          setRequests((prev) => prev.filter((r) => r.id !== id));
        },
      });
    }
  }, [isOpen]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await featureRequestsApi.getAll();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load feature requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!requestText.trim()) {
        setError('Please describe your feature request');
        return;
      }

      if (!isAnonymous && !authorName.trim()) {
        setError('Please enter your name or choose anonymous');
        return;
      }

      setIsSubmitting(true);

      try {
        const newRequest: FeatureRequest = {
          id: uuidv4(),
          authorName: isAnonymous ? null : authorName.trim(),
          requestText: requestText.trim(),
          createdAt: new Date().toISOString(),
        };

        await featureRequestsApi.create(newRequest);

        // Reset form
        setAuthorName('');
        setRequestText('');
        setIsAnonymous(false);
      } catch (err) {
        console.error('Failed to submit feature request:', err);
        setError('Failed to submit. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [isAnonymous, authorName, requestText]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl
                bg-gray-900/95 backdrop-blur-xl border border-white/10
                shadow-[0_25px_60px_rgba(0,0,0,0.5)] transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                    </div>
                    Feature Requests
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>

                <Tab.Group>
                  <Tab.List className="flex border-b border-white/10">
                    <Tab
                      className={({ selected }) =>
                        `flex-1 px-4 py-3 text-sm font-medium transition-colors outline-none
                        ${selected
                          ? 'text-amber-400 border-b-2 border-amber-400 -mb-px'
                          : 'text-white/50 hover:text-white/70'
                        }`
                      }
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" />
                        Submit Request
                      </div>
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `flex-1 px-4 py-3 text-sm font-medium transition-colors outline-none
                        ${selected
                          ? 'text-amber-400 border-b-2 border-amber-400 -mb-px'
                          : 'text-white/50 hover:text-white/70'
                        }`
                      }
                    >
                      <div className="flex items-center justify-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        View All ({requests.length})
                      </div>
                    </Tab>
                  </Tab.List>

                  <Tab.Panels>
                    {/* Submit Request Panel */}
                    <Tab.Panel className="p-6">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                          <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                            {error}
                          </div>
                        )}

                        {/* Anonymous Toggle */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIsAnonymous(false)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                              border transition-all ${
                                !isAnonymous
                                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                              }`}
                          >
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium">With Name</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAnonymous(true)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                              border transition-all ${
                                isAnonymous
                                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                              }`}
                          >
                            <UserX className="w-4 h-4" />
                            <span className="text-sm font-medium">Anonymous</span>
                          </button>
                        </div>

                        {/* Name Input (hidden if anonymous) */}
                        {!isAnonymous && (
                          <div>
                            <label htmlFor="authorName" className="block text-sm font-medium text-white/70 mb-1.5">
                              Your Name
                            </label>
                            <input
                              id="authorName"
                              type="text"
                              value={authorName}
                              onChange={(e) => setAuthorName(e.target.value)}
                              placeholder="Enter your name"
                              className="w-full px-3 py-2.5 text-white placeholder-white/30
                                bg-white/5 border border-white/10 rounded-xl
                                focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                                transition-all"
                            />
                          </div>
                        )}

                        {/* Request Text */}
                        <div>
                          <label htmlFor="requestText" className="block text-sm font-medium text-white/70 mb-1.5">
                            Feature Request
                          </label>
                          <textarea
                            id="requestText"
                            value={requestText}
                            onChange={(e) => setRequestText(e.target.value)}
                            placeholder="Describe the feature you'd like to see..."
                            rows={4}
                            className="w-full px-3 py-2.5 text-white placeholder-white/30
                              bg-white/5 border border-white/10 rounded-xl resize-none
                              focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                              transition-all"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full px-4 py-2.5 text-sm font-medium text-white
                            bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl
                            hover:from-amber-400 hover:to-orange-500
                            shadow-[0_0_20px_rgba(245,158,11,0.3)]
                            hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]
                            transition-all disabled:opacity-50 disabled:cursor-not-allowed
                            flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                      </form>
                    </Tab.Panel>

                    {/* View All Panel */}
                    <Tab.Panel className="p-4 max-h-[400px] overflow-y-auto">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-amber-400" />
                        </div>
                      ) : requests.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
                          <p className="text-white/50 text-sm">No feature requests yet</p>
                          <p className="text-white/30 text-xs mt-1">Be the first to submit one!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {requests.map((request) => (
                            <div
                              key={request.id}
                              className="p-4 bg-white/5 border border-white/10 rounded-xl"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {request.authorName ? (
                                    <>
                                      <User className="w-4 h-4 text-indigo-400" />
                                      <span className="text-sm font-medium text-white">
                                        {request.authorName}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="w-4 h-4 text-white/40" />
                                      <span className="text-sm text-white/50 italic">
                                        Anonymous
                                      </span>
                                    </>
                                  )}
                                </div>
                                <span className="text-xs text-white/40">
                                  {formatDate(request.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-white/80 leading-relaxed">
                                {request.requestText}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default FeatureRequestModal;
