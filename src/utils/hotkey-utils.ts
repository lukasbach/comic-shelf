export const formatKeyEvent = (e: KeyboardEvent | React.KeyboardEvent): string => {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  if (e.metaKey) parts.push('meta');
  
  // Don't record modifier-only presses
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    // Normalization for common keys
    let key = e.key;
    if (key === ' ') key = 'Space';
    if (key === '+') key = '='; // Usually same physical key, standardizing to '=' if '+' is used but e.key returns '+' or '=' depending on shift
    // However the default settings use '+', so let's stick to what we get or normalize
    // Actually '+' is often shifted '='. 
    
    parts.push(key);
  }
  
  return parts.join('+');
};

export const getDisplayKey = (keyString: string): string => {
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
