// src/hooks/useStableCallback.js
import { useCallback, useRef } from 'react';

/**
 * Creates a stable callback that doesn't change on every render
 * Use this for functions passed to useEffect dependencies
 */
export const useStableCallback = (callback, deps) => {
  const callbackRef = useRef(callback);
  
  // Update the callback ref when dependencies change
  useCallback(() => {
    callbackRef.current = callback;
  }, deps);
  
  // Return a stable function that always calls the latest callback
  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, []);
};

/**
 * Creates a stable value that only changes when dependencies change
 * Use this for objects/arrays passed to useEffect dependencies
 */
export const useStableValue = (value, deps) => {
  const valueRef = useRef(value);
  const depsRef = useRef(deps);
  
  // Check if dependencies have changed
  const hasChanged = depsRef.current.length !== deps.length || 
    depsRef.current.some((dep, index) => dep !== deps[index]);
  
  if (hasChanged) {
    valueRef.current = value;
    depsRef.current = deps;
  }
  
  return valueRef.current;
};


