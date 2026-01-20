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
    darkMode,
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
      <div className={`w-full h-screen flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4 ${darkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Connecting to server...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`w-full h-screen flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="text-center p-8">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Connection Error
          </h2>
          <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={() => initializeStore()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className={`w-full h-screen flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <Header />
        {/* Connection status indicator */}
        {!isConnected && (
          <div className="bg-yellow-500 text-white text-center py-1 text-sm">
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
