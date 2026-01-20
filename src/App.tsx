import { useCallback, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Header from './components/Header/Header';
import Canvas from './components/Canvas/Canvas';
import DetailsPanel from './components/DetailsPanel/DetailsPanel';
import AddPersonModal from './components/Modals/AddPersonModal';
import EditPersonModal from './components/Modals/EditPersonModal';
import AddLinkModal from './components/Modals/AddLinkModal';
import EditLinkModal from './components/Modals/EditLinkModal';
import ConfirmDialog from './components/Modals/ConfirmDialog';
import MeshGradient from './components/MeshGradient';
import { useStore } from './store/useStore';

function App() {
  const {
    selectedPersonId,
    selectedLinkId,
    clearSelection,
    deletePerson,
    deleteLink,
    openConfirmDialog,
    getPersonById,
    getLinkById,
    isLoading,
    isConnected,
    error,
    initializeStore,
    cleanupStore,
  } = useStore();

  // Initialize store on mount
  useEffect(() => {
    initializeStore();
    return () => cleanupStore();
  }, [initializeStore, cleanupStore]);

  // Global keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Escape to clear selection
      if (e.key === 'Escape') {
        clearSelection();
      }

      // Delete to delete selected item
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if user is typing in an input
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return;
        }

        if (selectedPersonId) {
          const person = getPersonById(selectedPersonId);
          if (person) {
            openConfirmDialog(
              `Are you sure you want to delete "${person.name}"? This will also remove all their connections.`,
              () => deletePerson(selectedPersonId)
            );
          }
        } else if (selectedLinkId) {
          const link = getLinkById(selectedLinkId);
          if (link) {
            openConfirmDialog('Are you sure you want to delete this connection?', () =>
              deleteLink(selectedLinkId)
            );
          }
        }
      }
    },
    [
      clearSelection,
      selectedPersonId,
      selectedLinkId,
      deletePerson,
      deleteLink,
      getPersonById,
      getLinkById,
      openConfirmDialog,
    ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Loading state
  if (isLoading) {
    return (
      <>
        <MeshGradient />
        <div className="w-full h-screen flex items-center justify-center">
          <div className="text-center glass rounded-2xl p-8">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
            </div>
            <p className="text-white/70 font-medium">Connecting to server...</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <MeshGradient />
        <div className="w-full h-screen flex items-center justify-center">
          <div className="text-center glass rounded-2xl p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400 text-3xl font-bold">!</span>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">
              Connection Error
            </h2>
            <p className="mb-6 text-white/60">{error}</p>
            <button
              onClick={() => initializeStore()}
              className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl font-medium
                hover:bg-indigo-400 transition-all duration-300
                shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <ReactFlowProvider>
      <MeshGradient />
      <div className="relative w-full h-screen flex flex-col">
        <Header />
        {/* Connection status indicator */}
        {!isConnected && (
          <div className="bg-amber-500/90 backdrop-blur-sm text-white text-center py-1.5 text-sm font-medium">
            Reconnecting to server...
          </div>
        )}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1">
            <Canvas />
          </div>
          <DetailsPanel />
        </div>
      </div>

      {/* Modals */}
      <AddPersonModal />
      <EditPersonModal />
      <AddLinkModal />
      <EditLinkModal />
      <ConfirmDialog />
    </ReactFlowProvider>
  );
}

export default App;
