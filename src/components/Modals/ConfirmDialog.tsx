import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/useStore';

function ConfirmDialog() {
  const { isConfirmDialogOpen, confirmDialogMessage, confirmDialogAction, closeConfirmDialog } =
    useStore();

  const handleConfirm = () => {
    if (confirmDialogAction) {
      confirmDialogAction();
    }
    closeConfirmDialog();
  };

  return (
    <Transition appear show={isConfirmDialogOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeConfirmDialog}>
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
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl
                bg-gray-900/95 backdrop-blur-xl border border-white/10
                shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-6 transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-white">
                      Confirm Delete
                    </Dialog.Title>
                    <p className="mt-2 text-sm text-white/60">{confirmDialogMessage}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2.5 text-sm font-medium text-white/70
                      bg-white/5 border border-white/10 rounded-xl
                      hover:bg-white/10 transition-colors"
                    onClick={closeConfirmDialog}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2.5 text-sm font-medium text-white
                      bg-red-500 rounded-xl hover:bg-red-400
                      shadow-[0_0_20px_rgba(239,68,68,0.3)]
                      hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]
                      transition-all"
                    onClick={handleConfirm}
                  >
                    Delete
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default ConfirmDialog;
