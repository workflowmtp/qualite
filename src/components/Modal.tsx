'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ModalSize = 'default' | 'large';

interface ModalContextType {
  openModal: (content: ReactNode, size?: ModalSize) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType>({
  openModal: () => {},
  closeModal: () => {},
});

export function useModal() {
  return useContext(ModalContext);
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode | null>(null);
  const [visible, setVisible] = useState(false);
  const [size, setSize] = useState<ModalSize>('default');

  const openModal = useCallback((node: ReactNode, sz?: ModalSize) => {
    setContent(node);
    setSize(sz || 'default');
    setVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setVisible(false);
    setContent(null);
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {visible && (
        <div
          className="modal-overlay show"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={size === 'large' ? { maxWidth: 720, width: '90vw' } : undefined}
          >
            {content}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}
