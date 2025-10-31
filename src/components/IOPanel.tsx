import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '../state/useStore';

export default function IOPanel() {
  const {
    gates,
    ui,
    currentLevel,
    moveGate,
  } = useStore();
  
  const previousGatesLengthRef = useRef(0);

  // Organize gates into a horizontal bar at the top of the canvas
  const organizeGatesToBar = useCallback(() => {
    if (!currentLevel) return;
    
    const inputGatesList = gates.filter(g => g.type === 'INPUT');
    const outputGatesList = gates.filter(g => g.type === 'OUTPUT');
    
    if (inputGatesList.length === 0 && outputGatesList.length === 0) return;
    
    const snap = ui.gridSnap;
    const barY = snap; // Top of canvas for the floating bar (32px for snap=32) - matches renderFloatingBar
    const horizontalSpacing = snap * 2.5; // Space between gates horizontally (80px for snap=32)
    const leftMargin = snap * 2; // Left margin for inputs
    const rightMargin = snap * 2; // Right margin for outputs
    
    // Position INPUT gates horizontally on the left side of the bar
    inputGatesList.forEach((gate, index) => {
      const x = leftMargin + index * horizontalSpacing;
      moveGate(gate.id, x, barY);
    });
    
    // Position OUTPUT gates horizontally on the right side of the bar
    if (currentLevel.grid) {
      const totalWidth = (currentLevel.grid.cols - 1) * snap;
      const rightStartX = totalWidth - rightMargin - (outputGatesList.length - 1) * horizontalSpacing;
      outputGatesList.forEach((gate, index) => {
        const x = rightStartX + index * horizontalSpacing;
        moveGate(gate.id, x, barY);
      });
    }
  }, [currentLevel, gates, ui.gridSnap, moveGate]);

  // Track the last level ID to detect level changes
  const lastLevelIdRef = useRef<string | undefined>(undefined);
  const hasOrganizedRef = useRef(false);
  
  // Organize gates when level loads or after reset
  useEffect(() => {
    if (!currentLevel) return;
    
    // Check if we have INPUT/OUTPUT gates
    const inputGatesList = gates.filter(g => g.type === 'INPUT');
    const outputGatesList = gates.filter(g => g.type === 'OUTPUT');
    
    if (inputGatesList.length === 0 && outputGatesList.length === 0) return;
    
    // Check if level changed - this is the key trigger
    const levelChanged = lastLevelIdRef.current !== currentLevel.id;
    
    // Always organize when level changes (including first load)
    if (levelChanged || !hasOrganizedRef.current) {
      lastLevelIdRef.current = currentLevel.id;
      hasOrganizedRef.current = true;
      
      // Organize immediately, then again after delays to ensure it sticks
      organizeGatesToBar();
      
      const timer1 = setTimeout(() => {
        organizeGatesToBar();
      }, 300);
      
      const timer2 = setTimeout(() => {
        organizeGatesToBar();
      }, 600);
      
      const timer3 = setTimeout(() => {
        organizeGatesToBar();
      }, 1000);
      
      previousGatesLengthRef.current = gates.length;
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
    
    // Also organize if this looks like a reset (all gates are IO and length decreased)
    const allGatesAreIO = gates.length > 0 && gates.every(g => g.type === 'INPUT' || g.type === 'OUTPUT');
    const wasReset = allGatesAreIO && previousGatesLengthRef.current > gates.length;
    
    if (wasReset) {
      const timer = setTimeout(() => {
        organizeGatesToBar();
        setTimeout(() => organizeGatesToBar(), 200);
      }, 200);
      
      previousGatesLengthRef.current = gates.length;
      return () => clearTimeout(timer);
    }
    
    previousGatesLengthRef.current = gates.length;
  }, [currentLevel?.id, gates.length, organizeGatesToBar]);

  // This component just organizes gates - no UI needed
  // The gates will be positioned on a floating bar on the canvas itself
  return null;
}

