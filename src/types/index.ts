export type LinkType =
  | 'collaborator'
  | 'mentor'
  | 'student'
  | 'colleague'
  | 'friend'
  | 'advisor'
  | 'coauthor'
  | 'stream'
  | 'interest'
  | 'other';

export interface Person {
  id: string;
  name: string;
  affiliations?: string[];
  photoUrl?: string;
  peeps?: string;
  stream?: string;
  interests?: string[];
  position: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
}

export interface Link {
  id: string;
  sourceId: string;
  targetId: string;
  description: string;
  type: LinkType;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface FeatureRequest {
  id: string;
  authorName: string | null;
  requestText: string;
  createdAt: string;
}

export interface StoredData {
  version: 1;
  people: Person[];
  links: Link[];
  viewport: Viewport;
  lastModified: string;
}

export interface AppState {
  // Data
  people: Person[];
  links: Link[];
  viewport: Viewport;

  // Connection state
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;

  // Dark mode
  darkMode: boolean;

  // Selection state
  selectedPersonId: string | null;
  selectedLinkId: string | null;

  // Modal state
  isAddPersonModalOpen: boolean;
  isEditPersonModalOpen: boolean;
  isAddLinkModalOpen: boolean;
  isEditLinkModalOpen: boolean;
  isConfirmDialogOpen: boolean;
  confirmDialogAction: (() => void) | null;
  confirmDialogMessage: string;

  // Link creation state
  pendingLinkSourceId: string | null;

  // Actions - People
  addPerson: (person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePerson: (id: string, updates: Partial<Omit<Person, 'id' | 'createdAt'>>) => void;
  deletePerson: (id: string) => void;

  // Actions - Links
  addLink: (link: Omit<Link, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLink: (id: string, updates: Partial<Omit<Link, 'id' | 'createdAt'>>) => void;
  deleteLink: (id: string) => void;

  // Actions - Selection
  selectPerson: (id: string | null) => void;
  selectLink: (id: string | null) => void;
  clearSelection: () => void;

  // Actions - Viewport
  setViewport: (viewport: Viewport) => void;

  // Actions - Modals
  openAddPersonModal: () => void;
  closeAddPersonModal: () => void;
  openEditPersonModal: () => void;
  closeEditPersonModal: () => void;
  openAddLinkModal: (sourceId: string) => void;
  closeAddLinkModal: () => void;
  openEditLinkModal: () => void;
  closeEditLinkModal: () => void;
  openConfirmDialog: (message: string, action: () => void) => void;
  closeConfirmDialog: () => void;

  // Actions - Link creation
  setPendingLinkSource: (id: string | null) => void;

  // Actions - Dark mode
  toggleDarkMode: () => void;

  // Actions - Store initialization
  initializeStore: () => Promise<void>;
  cleanupStore: () => void;

  // Computed helpers
  getLinksForPerson: (personId: string) => Link[];
  getPeopleConnectedTo: (personId: string) => Person[];
  getPersonById: (id: string) => Person | undefined;
  getLinkById: (id: string) => Link | undefined;
}
