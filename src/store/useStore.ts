import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, Person, Link, Viewport } from '../types';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { AUTOSAVE_DELAY } from '../utils/constants';
import { fetchAllData, peopleApi, linksApi } from '../lib/api';
import { initializeSocket, disconnectSocket, type SocketEventHandlers } from '../lib/socket';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// Save viewport to localStorage (viewport is user-specific, not shared)
function debouncedSaveViewport(viewport: Viewport) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    const state = useStore.getState();
    saveToStorage(state.people, state.links, viewport);
  }, AUTOSAVE_DELAY);
}

// Load initial data from localStorage (will be overwritten by API data)
const initialData = loadFromStorage();

// Load dark mode preference from localStorage
const getInitialDarkMode = () => {
  const stored = localStorage.getItem('darkMode');
  if (stored !== null) return stored === 'true';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Track pending operations to avoid duplicating socket events
const pendingOperations = new Set<string>();

interface StoreState extends AppState {
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  initializeStore: () => Promise<void>;
  cleanupStore: () => void;
  // Internal methods for socket updates (bypass API calls)
  _addPersonFromSocket: (person: Person) => void;
  _updatePersonFromSocket: (person: Person) => void;
  _deletePersonFromSocket: (id: string) => void;
  _addLinkFromSocket: (link: Link) => void;
  _updateLinkFromSocket: (link: Link) => void;
  _deleteLinkFromSocket: (id: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Initial state from storage (fallback until API loads)
  people: initialData.people,
  links: initialData.links,
  viewport: initialData.viewport,

  // Connection state
  isLoading: true,
  isConnected: false,
  error: null,

  // Dark mode
  darkMode: getInitialDarkMode(),

  // Selection state
  selectedPersonId: null,
  selectedLinkId: null,

  // Modal state
  isAddPersonModalOpen: false,
  isEditPersonModalOpen: false,
  isAddLinkModalOpen: false,
  isEditLinkModalOpen: false,
  isConfirmDialogOpen: false,
  confirmDialogAction: null,
  confirmDialogMessage: '',

  // Link creation state
  pendingLinkSourceId: null,

  // Initialize store: fetch data from API and set up socket
  initializeStore: async () => {
    try {
      set({ isLoading: true, error: null });

      // Fetch initial data from API
      const { people, links } = await fetchAllData();
      set({ people, links, isLoading: false });

      // Set up socket event handlers
      const handlers: SocketEventHandlers = {
        onPersonCreated: (person) => {
          // Skip if this was our own operation
          if (pendingOperations.has(`person:create:${person.id}`)) {
            pendingOperations.delete(`person:create:${person.id}`);
            return;
          }
          get()._addPersonFromSocket(person);
        },
        onPersonUpdated: (person) => {
          if (pendingOperations.has(`person:update:${person.id}`)) {
            pendingOperations.delete(`person:update:${person.id}`);
            return;
          }
          get()._updatePersonFromSocket(person);
        },
        onPersonDeleted: ({ id }) => {
          if (pendingOperations.has(`person:delete:${id}`)) {
            pendingOperations.delete(`person:delete:${id}`);
            return;
          }
          get()._deletePersonFromSocket(id);
        },
        onLinkCreated: (link) => {
          if (pendingOperations.has(`link:create:${link.id}`)) {
            pendingOperations.delete(`link:create:${link.id}`);
            return;
          }
          get()._addLinkFromSocket(link);
        },
        onLinkUpdated: (link) => {
          if (pendingOperations.has(`link:update:${link.id}`)) {
            pendingOperations.delete(`link:update:${link.id}`);
            return;
          }
          get()._updateLinkFromSocket(link);
        },
        onLinkDeleted: ({ id }) => {
          if (pendingOperations.has(`link:delete:${id}`)) {
            pendingOperations.delete(`link:delete:${id}`);
            return;
          }
          get()._deleteLinkFromSocket(id);
        },
        onConnect: () => {
          set({ isConnected: true });
        },
        onDisconnect: () => {
          set({ isConnected: false });
        },
      };

      initializeSocket(handlers);
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect to server',
      });
    }
  },

  // Cleanup on unmount
  cleanupStore: () => {
    disconnectSocket();
  },

  // Internal methods for socket updates
  _addPersonFromSocket: (person) => {
    set((state) => {
      // Avoid duplicates
      if (state.people.some((p) => p.id === person.id)) {
        return state;
      }
      return { people: [...state.people, person] };
    });
  },

  _updatePersonFromSocket: (person) => {
    set((state) => ({
      people: state.people.map((p) => (p.id === person.id ? person : p)),
    }));
  },

  _deletePersonFromSocket: (id) => {
    set((state) => ({
      people: state.people.filter((p) => p.id !== id),
      links: state.links.filter((l) => l.sourceId !== id && l.targetId !== id),
      selectedPersonId: state.selectedPersonId === id ? null : state.selectedPersonId,
    }));
  },

  _addLinkFromSocket: (link) => {
    set((state) => {
      // Avoid duplicates
      if (state.links.some((l) => l.id === link.id)) {
        return state;
      }
      return { links: [...state.links, link] };
    });
  },

  _updateLinkFromSocket: (link) => {
    set((state) => ({
      links: state.links.map((l) => (l.id === link.id ? link : l)),
    }));
  },

  _deleteLinkFromSocket: (id) => {
    set((state) => ({
      links: state.links.filter((l) => l.id !== id),
      selectedLinkId: state.selectedLinkId === id ? null : state.selectedLinkId,
    }));
  },

  // Actions - People
  addPerson: async (personData) => {
    const now = new Date().toISOString();
    const person: Person = {
      ...personData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    // Optimistically update local state
    set((state) => ({ people: [...state.people, person] }));

    // Mark operation as pending to skip socket echo
    pendingOperations.add(`person:create:${person.id}`);

    try {
      await peopleApi.create(person);
    } catch (error) {
      // Rollback on error
      console.error('Failed to create person:', error);
      pendingOperations.delete(`person:create:${person.id}`);
      set((state) => ({
        people: state.people.filter((p) => p.id !== person.id),
        error: 'Failed to save person',
      }));
    }
  },

  updatePerson: async (id, updates) => {
    const state = get();
    const existingPerson = state.people.find((p) => p.id === id);
    if (!existingPerson) return;

    const updatedPerson = {
      ...existingPerson,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update local state
    set((state) => ({
      people: state.people.map((p) => (p.id === id ? updatedPerson : p)),
    }));

    pendingOperations.add(`person:update:${id}`);

    try {
      await peopleApi.update(id, updatedPerson);
    } catch (error) {
      console.error('Failed to update person:', error);
      pendingOperations.delete(`person:update:${id}`);
      // Rollback
      set((state) => ({
        people: state.people.map((p) => (p.id === id ? existingPerson : p)),
        error: 'Failed to update person',
      }));
    }
  },

  deletePerson: async (id) => {
    const state = get();
    const existingPerson = state.people.find((p) => p.id === id);
    const existingLinks = state.links.filter(
      (l) => l.sourceId === id || l.targetId === id
    );

    if (!existingPerson) return;

    // Optimistically update local state
    set((state) => ({
      people: state.people.filter((p) => p.id !== id),
      links: state.links.filter((l) => l.sourceId !== id && l.targetId !== id),
      selectedPersonId: state.selectedPersonId === id ? null : state.selectedPersonId,
    }));

    pendingOperations.add(`person:delete:${id}`);
    existingLinks.forEach((l) => pendingOperations.add(`link:delete:${l.id}`));

    try {
      await peopleApi.delete(id);
    } catch (error) {
      console.error('Failed to delete person:', error);
      pendingOperations.delete(`person:delete:${id}`);
      existingLinks.forEach((l) => pendingOperations.delete(`link:delete:${l.id}`));
      // Rollback
      set((state) => ({
        people: [...state.people, existingPerson],
        links: [...state.links, ...existingLinks],
        error: 'Failed to delete person',
      }));
    }
  },

  // Actions - Links
  addLink: async (linkData) => {
    const now = new Date().toISOString();
    const link: Link = {
      ...linkData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    // Optimistically update local state
    set((state) => ({ links: [...state.links, link] }));

    pendingOperations.add(`link:create:${link.id}`);

    try {
      await linksApi.create(link);
    } catch (error) {
      console.error('Failed to create link:', error);
      pendingOperations.delete(`link:create:${link.id}`);
      set((state) => ({
        links: state.links.filter((l) => l.id !== link.id),
        error: 'Failed to save link',
      }));
    }
  },

  updateLink: async (id, updates) => {
    const state = get();
    const existingLink = state.links.find((l) => l.id === id);
    if (!existingLink) return;

    const updatedLink = {
      ...existingLink,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update local state
    set((state) => ({
      links: state.links.map((l) => (l.id === id ? updatedLink : l)),
    }));

    pendingOperations.add(`link:update:${id}`);

    try {
      await linksApi.update(id, updatedLink);
    } catch (error) {
      console.error('Failed to update link:', error);
      pendingOperations.delete(`link:update:${id}`);
      set((state) => ({
        links: state.links.map((l) => (l.id === id ? existingLink : l)),
        error: 'Failed to update link',
      }));
    }
  },

  deleteLink: async (id) => {
    const state = get();
    const existingLink = state.links.find((l) => l.id === id);
    if (!existingLink) return;

    // Optimistically update local state
    set((state) => ({
      links: state.links.filter((l) => l.id !== id),
      selectedLinkId: state.selectedLinkId === id ? null : state.selectedLinkId,
    }));

    pendingOperations.add(`link:delete:${id}`);

    try {
      await linksApi.delete(id);
    } catch (error) {
      console.error('Failed to delete link:', error);
      pendingOperations.delete(`link:delete:${id}`);
      set((state) => ({
        links: [...state.links, existingLink],
        error: 'Failed to delete link',
      }));
    }
  },

  // Actions - Selection
  selectPerson: (id) => {
    set({ selectedPersonId: id, selectedLinkId: null });
  },

  selectLink: (id) => {
    set({ selectedLinkId: id, selectedPersonId: null });
  },

  clearSelection: () => {
    set({ selectedPersonId: null, selectedLinkId: null });
  },

  // Actions - Viewport (local only, not synced)
  setViewport: (viewport) => {
    set({ viewport });
    debouncedSaveViewport(viewport);
  },

  // Actions - Modals
  openAddPersonModal: () => set({ isAddPersonModalOpen: true }),
  closeAddPersonModal: () => set({ isAddPersonModalOpen: false }),

  openEditPersonModal: () => set({ isEditPersonModalOpen: true }),
  closeEditPersonModal: () => set({ isEditPersonModalOpen: false }),

  openAddLinkModal: (sourceId) => set({ isAddLinkModalOpen: true, pendingLinkSourceId: sourceId }),
  closeAddLinkModal: () => set({ isAddLinkModalOpen: false, pendingLinkSourceId: null }),

  openEditLinkModal: () => set({ isEditLinkModalOpen: true }),
  closeEditLinkModal: () => set({ isEditLinkModalOpen: false }),

  openConfirmDialog: (message, action) =>
    set({ isConfirmDialogOpen: true, confirmDialogMessage: message, confirmDialogAction: action }),
  closeConfirmDialog: () =>
    set({ isConfirmDialogOpen: false, confirmDialogMessage: '', confirmDialogAction: null }),

  // Actions - Link creation
  setPendingLinkSource: (id) => set({ pendingLinkSourceId: id }),

  // Actions - Dark mode
  toggleDarkMode: () => {
    set((state) => {
      const newDarkMode = !state.darkMode;
      localStorage.setItem('darkMode', String(newDarkMode));
      return { darkMode: newDarkMode };
    });
  },

  // Computed helpers
  getLinksForPerson: (personId) => {
    const state = get();
    return state.links.filter((l) => l.sourceId === personId || l.targetId === personId);
  },

  getPeopleConnectedTo: (personId) => {
    const state = get();
    const connectedIds = new Set<string>();
    state.links.forEach((l) => {
      if (l.sourceId === personId) connectedIds.add(l.targetId);
      if (l.targetId === personId) connectedIds.add(l.sourceId);
    });
    return state.people.filter((p) => connectedIds.has(p.id));
  },

  getPersonById: (id) => {
    const state = get();
    return state.people.find((p) => p.id === id);
  },

  getLinkById: (id) => {
    const state = get();
    return state.links.find((l) => l.id === id);
  },
}));
