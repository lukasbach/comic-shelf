export const formatKeyEvent = (e: KeyboardEvent | React.KeyboardEvent): string => {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('ctrl');
  
  // Only add shift if it's a multi-character key (like ArrowRight, Tab) 
  // or if it's a single-character key where case matters (letters),
  // or for Space which is often combined with Shift.
  // For symbols like '+', '?', shift is already reflected in e.key.
  if (e.shiftKey && (e.key.length > 1 || e.key.toLowerCase() !== e.key.toUpperCase() || e.key === ' ')) {
    parts.push('shift');
  }
  
  if (e.altKey) parts.push('alt');
  if (e.metaKey) parts.push('meta');
  
  // Don't record modifier-only presses
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    // Normalization for common keys
    let key = e.key;
    if (key === ' ') key = 'Space';
    
    parts.push(key);
  }
  
  return parts.join('+');
};

export const getDisplayKey = (keyString: string): string => {
  if (!keyString) return '';
  return keyString
    .split('+')
    .map(part => {
      if (part === 'ctrl') return 'Ctrl';
      if (part === 'shift') return 'Shift';
      if (part === 'alt') return 'Alt';
      if (part === 'meta') return 'Meta';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' + ');
};
