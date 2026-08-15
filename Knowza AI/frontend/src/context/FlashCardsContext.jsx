import React, { createContext, useContext, useState, useCallback } from 'react';

const FlashCardsContext = createContext(null);

export const FlashCardsProvider = ({ children }) => {
  const [generatingFlashState, setGeneratingFlashState] = useState({
    isGenerating: false,
    topic: '',
    stepText: '',
  });
  const [completedFlashState, setCompletedFlashState] = useState(null); // { topic }

  const startFlashGeneration = useCallback((topic) => {
    setGeneratingFlashState({ isGenerating: true, topic, stepText: "Kartochkalar tayyorlanmoqda..." });
    setCompletedFlashState(null);
  }, []);

  const finishFlashGeneration = useCallback((topic) => {
    setGeneratingFlashState({ isGenerating: false, topic: '', stepText: '' });
    setCompletedFlashState({ isVisible: true, topic });
  }, []);

  const failFlashGeneration = useCallback(() => {
    setGeneratingFlashState({ isGenerating: false, topic: '', stepText: '' });
  }, []);

  return (
    <FlashCardsContext.Provider value={{
      generatingFlashState,
      completedFlashState,
      setCompletedFlashState,
      startFlashGeneration,
      finishFlashGeneration,
      failFlashGeneration,
    }}>
      {children}
    </FlashCardsContext.Provider>
  );
};

export const useFlashCards = () => {
  const ctx = useContext(FlashCardsContext);
  if (!ctx) throw new Error('useFlashCards must be used inside FlashCardsProvider');
  return ctx;
};
