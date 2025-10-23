// src/utils/useEffectDebugger.js
import { useEffect, useRef } from 'react';

/**
 * Debug useEffect hooks to identify infinite re-render issues
 * Usage: useEffectDebugger(effect, deps, 'ComponentName')
 */
export const useEffectDebugger = (effect, deps, componentName = 'Component') => {
  const previousDeps = useRef();
  
  useEffect(() => {
    if (previousDeps.current) {
      const changedDeps = deps.filter((dep, index) => dep !== previousDeps.current[index]);
      
      if (changedDeps.length > 0) {
        console.log(`🔄 ${componentName} useEffect triggered by:`, changedDeps);
      }
    }
    
    previousDeps.current = deps;
    
    return effect();
  }, deps);
};

/**
 * Safe useEffect that prevents infinite loops
 * Only runs effect when dependencies actually change
 */
export const useSafeEffect = (effect, deps) => {
  const previousDeps = useRef();
  const hasChanged = !previousDeps.current || 
    deps.length !== previousDeps.current.length ||
    deps.some((dep, index) => dep !== previousDeps.current[index]);
  
  useEffect(() => {
    if (hasChanged) {
      previousDeps.current = deps;
      return effect();
    }
  }, deps);
};

/**
 * useEffect with cleanup that prevents memory leaks
 */
export const useCleanupEffect = (effect, deps) => {
  useEffect(() => {
    const cleanup = effect();
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, deps);
};

















