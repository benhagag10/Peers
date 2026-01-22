import { useMemo } from 'react';
import { X, Edit2, Trash2, ExternalLink, Link2, User } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getInitials, getAvatarColor } from '../../utils/avatar';
import { LINK_TYPE_LABELS, LINK_TYPE_COLORS } from '../../utils/constants';
import type { Link, Person } from '../../types';

// Generate stream-based connections for a specific person
function getStreamLinksForPerson(personId: string, people: Person[]): Link[] {
  const person = people.find(p => p.id === personId);
  if (!person?.stream) return [];

  const streamKey = person.stream.toLowerCase().trim();
  const streamLinks: Link[] = [];

  people.forEach((other) => {
    if (other.id === personId) return;
    if (other.stream?.toLowerCase().trim() === streamKey) {
      streamLinks.push({
        id: `stream-${personId}-${other.id}`,
        sourceId: personId,
        targetId: other.id,
        description: person.stream!,
        type: 'stream',
        createdAt: '',
        updatedAt: '',
      });
    }
  });

  return streamLinks;
}

// Generate interest-based connections for a specific person
function getInterestLinksForPerson(personId: string, people: Person[]): Link[] {
  const person = people.find(p => p.id === personId);
  if (!person?.interests?.length) return [];

  const interestLinks: Link[] = [];
  const seenPairs = new Set<string>();

  people.forEach((other) => {
    if (other.id === personId) return;
    if (!other.interests?.length) return;

    const sharedInterests = person.interests!.filter((interest) =>
      other.interests!.includes(interest)
    );

    sharedInterests.forEach((interest) => {
      const pairKey = [personId, other.id, interest].sort().join('-');
      if (!seenPairs.has(pairKey)) {
        seenPairs.add(pairKey);
        interestLinks.push({
          id: `interest-${personId}-${other.id}-${interest}`,
          sourceId: personId,
          targetId: other.id,
          description: interest,
          type: 'interest',
          createdAt: '',
          updatedAt: '',
        });
      }
    });
  });

  return interestLinks;
}

function DetailsPanel() {
  const {
    selectedPersonId,
    selectedLinkId,
    getPersonById,
    getLinkById,
    getLinksForPerson,
    clearSelection,
    openEditPersonModal,
    openEditLinkModal,
    openConfirmDialog,
    deletePerson,
    deleteLink,
    openAddLinkModal,
    people,
  } = useStore();

  const selectedPerson = selectedPersonId ? getPersonById(selectedPersonId) : undefined;
  const selectedLink = selectedLinkId ? getLinkById(selectedLinkId) : undefined;

  // Get all connections grouped by person (no duplicates)
  const groupedConnections = useMemo(() => {
    if (!selectedPersonId) return [];

    const manualLinks = getLinksForPerson(selectedPersonId);
    const streamLinks = getStreamLinksForPerson(selectedPersonId, people);
    const interestLinks = getInterestLinksForPerson(selectedPersonId, people);
    const allLinks = [...manualLinks, ...streamLinks, ...interestLinks];

    // Group by the other person's ID
    const grouped: Record<string, { personId: string; links: Link[] }> = {};

    allLinks.forEach((link) => {
      const otherPersonId = link.sourceId === selectedPersonId ? link.targetId : link.sourceId;
      if (!grouped[otherPersonId]) {
        grouped[otherPersonId] = { personId: otherPersonId, links: [] };
      }
      grouped[otherPersonId].links.push(link);
    });

    return Object.values(grouped);
  }, [selectedPersonId, getLinksForPerson, people]);

  const sourcePerson = selectedLink ? getPersonById(selectedLink.sourceId) : undefined;
  const targetPerson = selectedLink ? getPersonById(selectedLink.targetId) : undefined;

  // No selection - show empty state
  if (!selectedPerson && !selectedLink) {
    return (
      <div className="w-80 h-full border-l border-white/10 flex flex-col items-center justify-center text-center p-6
        bg-white/5 backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-white/30" />
        </div>
        <h3 className="text-sm font-medium mb-1 text-white/80">No selection</h3>
        <p className="text-xs text-white/40">
          Click on a person or connection to see details
        </p>
      </div>
    );
  }

  // Person selected
  if (selectedPerson) {
    const initials = getInitials(selectedPerson.name);
    const bgColor = getAvatarColor(selectedPerson.name);

    const handleDelete = () => {
      openConfirmDialog(
        `Are you sure you want to delete "${selectedPerson.name}"? This will also remove all their connections.`,
        () => deletePerson(selectedPerson.id)
      );
    };

    return (
      <div className="w-80 h-full border-l border-white/10 flex flex-col bg-white/5 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Person Details</h3>
          <button
            onClick={clearSelection}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Avatar and name */}
          <div className="p-6 flex flex-col items-center text-center border-b border-white/10">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-lg opacity-50"
                style={{ backgroundColor: bgColor }}
              />
              {selectedPerson.photoUrl ? (
                <img
                  src={selectedPerson.photoUrl}
                  alt={selectedPerson.name}
                  className="relative w-24 h-24 rounded-full object-cover ring-2 ring-white/20"
                />
              ) : (
                <div
                  className="relative w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-semibold ring-2 ring-white/20"
                  style={{ backgroundColor: bgColor }}
                >
                  {initials}
                </div>
              )}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">{selectedPerson.name}</h2>
            {selectedPerson.affiliations && selectedPerson.affiliations.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {selectedPerson.affiliations.map((affiliation) => (
                  <span
                    key={affiliation}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium
                      bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  >
                    {affiliation}
                  </span>
                ))}
              </div>
            )}
            {selectedPerson.peeps && (
              <a
                href={selectedPerson.peeps}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Peeps Profile
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 flex gap-2 border-b border-white/10">
            <button
              onClick={openEditPersonModal}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium
                text-white bg-white/10 rounded-xl hover:bg-white/15 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium
                text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Stream & Interests */}
          {(selectedPerson.stream || (selectedPerson.interests && selectedPerson.interests.length > 0)) && (
            <div className="p-4 space-y-4 border-b border-white/10">
              {selectedPerson.stream && (
                <div>
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Stream</label>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium
                      bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {selectedPerson.stream}
                    </span>
                  </div>
                </div>
              )}
              {selectedPerson.interests && selectedPerson.interests.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Interests</label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedPerson.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium
                          bg-pink-500/20 text-pink-300 border border-pink-500/30"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connections */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white">
                Connections ({groupedConnections.length})
              </h4>
              <button
                onClick={() => openAddLinkModal(selectedPerson.id)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                + Add
              </button>
            </div>

            {groupedConnections.length === 0 ? (
              <p className="text-sm text-white/40">No connections yet</p>
            ) : (
              <ul className="space-y-2">
                {groupedConnections.map(({ personId, links }) => {
                  const otherPerson = getPersonById(personId);

                  return (
                    <li
                      key={personId}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10
                        cursor-pointer transition-colors border border-white/5"
                      onClick={() => useStore.getState().selectPerson(personId)}
                    >
                      <div className="flex items-center gap-3">
                        {otherPerson?.photoUrl ? (
                          <img
                            src={otherPerson.photoUrl}
                            alt={otherPerson.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ring-1 ring-white/10"
                            style={{ backgroundColor: otherPerson ? getAvatarColor(otherPerson.name) : '#666' }}
                          >
                            {otherPerson ? getInitials(otherPerson.name) : '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {otherPerson?.name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {links.map((link) => (
                          <span
                            key={link.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                            style={{
                              backgroundColor: `${LINK_TYPE_COLORS[link.type]}20`,
                              color: LINK_TYPE_COLORS[link.type],
                              border: `1px solid ${LINK_TYPE_COLORS[link.type]}40`,
                            }}
                          >
                            {link.type === 'stream' || link.type === 'interest'
                              ? link.description
                              : LINK_TYPE_LABELS[link.type]}
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Link selected
  if (selectedLink) {
    const handleDelete = () => {
      openConfirmDialog(
        `Are you sure you want to delete this connection?`,
        () => deleteLink(selectedLink.id)
      );
    };

    return (
      <div className="w-80 h-full border-l border-white/10 flex flex-col bg-white/5 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Connection Details</h3>
          <button
            onClick={clearSelection}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Connection visualization */}
          <div className="p-6 flex items-center justify-center gap-4 border-b border-white/10">
            {sourcePerson && (
              <div className="flex flex-col items-center">
                {sourcePerson.photoUrl ? (
                  <img
                    src={sourcePerson.photoUrl}
                    alt={sourcePerson.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-white/20"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-medium ring-2 ring-white/20"
                    style={{ backgroundColor: getAvatarColor(sourcePerson.name) }}
                  >
                    {getInitials(sourcePerson.name)}
                  </div>
                )}
                <span className="mt-2 text-xs text-white/60 max-w-[80px] truncate">
                  {sourcePerson.name}
                </span>
              </div>
            )}

            <div className="flex flex-col items-center">
              <div
                className="w-10 h-0.5 rounded-full"
                style={{ backgroundColor: LINK_TYPE_COLORS[selectedLink.type] }}
              />
              <Link2
                className="w-5 h-5 my-2"
                style={{ color: LINK_TYPE_COLORS[selectedLink.type] }}
              />
              <div
                className="w-10 h-0.5 rounded-full"
                style={{ backgroundColor: LINK_TYPE_COLORS[selectedLink.type] }}
              />
            </div>

            {targetPerson && (
              <div className="flex flex-col items-center">
                {targetPerson.photoUrl ? (
                  <img
                    src={targetPerson.photoUrl}
                    alt={targetPerson.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-white/20"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-medium ring-2 ring-white/20"
                    style={{ backgroundColor: getAvatarColor(targetPerson.name) }}
                  >
                    {getInitials(targetPerson.name)}
                  </div>
                )}
                <span className="mt-2 text-xs text-white/60 max-w-[80px] truncate">
                  {targetPerson.name}
                </span>
              </div>
            )}
          </div>

          {/* Link details */}
          <div className="p-4 space-y-4 border-b border-white/10">
            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Type</label>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: LINK_TYPE_COLORS[selectedLink.type] }}
                />
                <span className="text-sm text-white">
                  {LINK_TYPE_LABELS[selectedLink.type]}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Description</label>
              <p className="text-sm text-white mt-1.5">{selectedLink.description}</p>
            </div>

            {selectedLink.url && (
              <div>
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">URL</label>
                <a
                  href={selectedLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 mt-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open link
                </a>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 flex gap-2">
            <button
              onClick={openEditLinkModal}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium
                text-white bg-white/10 rounded-xl hover:bg-white/15 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium
                text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default DetailsPanel;
