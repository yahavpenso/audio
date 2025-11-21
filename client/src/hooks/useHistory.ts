import { useCallback, useRef, useState } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const historyRef = useRef<HistoryState<T>>(history);

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((prevHistory) => {
      const nextPresent = typeof newState === "function" 
        ? (newState as (prev: T) => T)(prevHistory.present)
        : newState;

      const nextHistory: HistoryState<T> = {
        past: [...prevHistory.past, prevHistory.present],
        present: nextPresent,
        future: [],
      };

      historyRef.current = nextHistory;
      return nextHistory;
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((prevHistory) => {
      if (prevHistory.past.length === 0) return prevHistory;

      const nextHistory: HistoryState<T> = {
        past: prevHistory.past.slice(0, -1),
        present: prevHistory.past[prevHistory.past.length - 1],
        future: [prevHistory.present, ...prevHistory.future],
      };

      historyRef.current = nextHistory;
      return nextHistory;
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prevHistory) => {
      if (prevHistory.future.length === 0) return prevHistory;

      const nextHistory: HistoryState<T> = {
        past: [...prevHistory.past, prevHistory.present],
        present: prevHistory.future[0],
        future: prevHistory.future.slice(1),
      };

      historyRef.current = nextHistory;
      return nextHistory;
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
