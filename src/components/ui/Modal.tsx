import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ModalContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

interface ModalProps {
  children: ReactNode;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export function ModalProvider({ children, ...props }: ModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const contextValue = { isOpen, open, close, toggle };

  if (!isOpen) return null;

  return (
    <ModalContext.Provider value={contextValue}>
      <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby={props.title ? 'modal-title' : undefined} aria-describedby={props.description ? 'modal-description' : undefined}>
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            aria-hidden="true"
            onClick={props.closeOnOverlayClick !== false ? close : undefined}
          />
          <div
            className={`
              relative w-full max-h-[90vh] overflow-hidden rounded-xl bg-white dark:bg-dark-900 shadow-xl transform transition-all
              ${props.size === 'sm' ? 'max-w-sm' : ''}
              ${props.size === 'md' ? 'max-w-md' : ''}
              ${props.size === 'lg' ? 'max-w-lg' : ''}
              ${props.size === 'xl' ? 'max-w-xl' : ''}
              ${props.size === 'full' ? 'max-w-4xl' : ''}
            `}
          >
            {(props.title || props.description) && (
              <div className="flex items-start justify-between p-4 border-b border-dark-200 dark:border-dark-700">
                <div>
                  {props.title && (
                    <h2 id="modal-title" className="text-lg font-semibold text-dark-900 dark:text-dark-100">
                      {props.title}
                    </h2>
                  )}
                  {props.description && (
                    <p id="modal-description" className="mt-1 text-sm text-dark-500 dark:text-dark-400">
                      {props.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={close}
                  className="p-1 rounded-lg text-dark-400 hover:text-dark-600 dark:hover:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

export function ModalTrigger({ children }: { children: (props: { open: () => void }) => ReactNode }) {
  const { open } = useModal();
  return children({ open });
}

export function ModalClose({ children }: { children: (props: { close: () => void }) => ReactNode }) {
  const { close } = useModal();
  return children({ close });
}