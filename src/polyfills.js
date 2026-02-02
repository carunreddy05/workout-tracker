// Browser compatibility polyfills for older devices
import 'core-js/stable';
import 'core-js/proposals/relative-indexing-method';

// Polyfill for CSS variables in older browsers
if (!window.CSS || !window.CSS.supports('color', 'oklch(1 0 0)')) {
  document.documentElement.classList.add('no-oklch');
  // Fallback: convert oklch to rgb for older browsers
  const originalGetComputedStyle = window.getComputedStyle;
  
  window.getComputedStyle = function(element, pseudoElement) {
    const styles = originalGetComputedStyle(element, pseudoElement);
    const computedStyle = Object.create(styles);
    
    // Convert oklch colors to hex/rgb fallback
    const convertOklch = (value) => {
      if (typeof value !== 'string') return value;
      
      // Simple oklch to RGB conversion for common values used in the app
      const oklchMap = {
        'oklch(1 0 0)': '#ffffff',           // white
        'oklch(0.145 0 0)': '#000000',       // black/dark
        'oklch(0.205 0 0)': '#0a0a0a',       // darker
        'oklch(0.985 0 0)': '#fcfcfc',       // almost white
        'oklch(0.97 0 0)': '#f5f5f5',        // light gray
        'oklch(0.922 0 0)': '#e5e5e5',       // gray
        'oklch(0.556 0 0)': '#8b8b8b',       // medium gray
        'oklch(0.708 0 0)': '#b5b5b5',       // lighter gray
        'oklch(0.577 0.245 27.325)': '#b91c1c', // red
        'oklch(0.6 0.118 184.704)': '#2563eb', // blue
        'oklch(0.398 0.07 227.392)': '#3b82f6', // lighter blue
        'oklch(0.646 0.222 41.116)': '#f97316', // orange
        'oklch(0.828 0.189 84.429)': '#fbbf24', // yellow
        'oklch(0.769 0.188 70.08)': '#ec4899',  // pink
        'oklch(0.269 0 0)': '#444444',       // dark gray
        'oklch(0.704 0.191 22.216)': '#dc2626', // darker red
      };
      
      return oklchMap[value] || value;
    };
    
    return new Proxy(styles, {
      get(target, prop) {
        const value = target[prop];
        if (typeof prop === 'string' && prop.startsWith('--')) {
          return convertOklch(value);
        }
        return convertOklch(String(value));
      }
    });
  };
}

if (!window.CSS || !window.CSS.supports('color', 'color-mix(in oklab, #000 50%, transparent)')) {
  document.documentElement.classList.add('no-color-mix');
}

// Add support for modern array methods
if (!Array.prototype.at) {
  Array.prototype.at = function(n) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += this.length;
    if (n < 0 || n >= this.length) return undefined;
    return this[n];
  };
}

// Add ResizeObserver polyfill if needed
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {
      // no-op for older browsers
    }
    unobserve() {
      // no-op for older browsers
    }
    disconnect() {
      // no-op for older browsers
    }
  };
}

console.log('Polyfills loaded for older browser compatibility');
