import { useState, useEffect, useCallback } from 'react';

interface DeviceInfo {
  fingerprint: string;
  components: {
    userAgent: string;
    language: string;
    colorDepth: number;
    screenResolution: string;
    timeZone: string;
    sessionStorage: boolean;
    localStorage: boolean;
    cpuCores: number;
    touchSupport: boolean;
    fonts: string; // Hash of font list
    canvas: string; // Hash of canvas fingerprint
    webgl: string; // Hash of WebGL fingerprint
    plugins: string; // Hash of plugin list
    hardwareConcurrency: number;
    deviceMemory: number;
  };
}

// Utility function to hash string
const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Function to get canvas fingerprint
const getCanvasFingerprint = async (): Promise<string> => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = 200;
    canvas.height = 50;
    
    // Draw text with specific styling
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#FF6F61';
    ctx.fillRect(10, 10, 150, 30);
    ctx.fillStyle = '#0C6291';
    ctx.fillText('LuckyMint Token 👑', 15, 15);
    
    // Add some shapes
    ctx.beginPath();
    ctx.arc(170, 25, 15, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    // Get image data and hash it
    const dataUrl = canvas.toDataURL();
    return await hashString(dataUrl);
  } catch (e) {
    console.error('Canvas fingerprinting error:', e);
    return '';
  }
};

// Function to get WebGL fingerprint
const getWebGLFingerprint = async (): Promise<string> => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    
    // Get WebGL parameters - ensure correct type casting
    let params = '';
    
    // Type assertion to WebGLRenderingContext
    const webGL = gl as WebGLRenderingContext;
    
    // Now we can safely access the WebGL properties
    params += webGL.getParameter(webGL.VENDOR) || '';
    params += webGL.getParameter(webGL.RENDERER) || '';
    params += webGL.getParameter(webGL.VERSION) || '';
    params += webGL.getParameter(webGL.SHADING_LANGUAGE_VERSION) || '';
    
    const extensions = webGL.getSupportedExtensions();
    if (extensions) {
      params += extensions.join('');
    }
    
    return await hashString(params);
  } catch (e) {
    console.error('WebGL fingerprinting error:', e);
    return '';
  }
};

// Function to get available fonts
const getFonts = async (): Promise<string> => {
  // Limited set of fonts to check
  const fontList = [
    'Arial', 'Courier New', 'Georgia', 'Times New Roman', 
    'Verdana', 'Tahoma', 'Impact', 'Comic Sans MS',
    'Roboto', 'Open Sans', 'Helvetica'
  ];
  
  // Check which fonts are available
  const detectedFonts: string[] = [];
  
  for (const font of fontList) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      
      canvas.width = 100;
      canvas.height = 20;
      
      // Try to use the font
      ctx.font = `12px "${font}", monospace`;
      ctx.fillText('abcdefghijklm', 5, 15);
      
      // Default font (monospace)
      const defaultText = ctx.getImageData(0, 0, 100, 20);
      
      // Reset canvas
      ctx.clearRect(0, 0, 100, 20);
      
      // Test font
      ctx.font = `12px monospace`;
      ctx.fillText('abcdefghijklm', 5, 15);
      
      // Test font characters
      const fontText = ctx.getImageData(0, 0, 100, 20);
      
      // Compare the two, if different, the font was used
      let different = false;
      for (let i = 0; i < defaultText.data.length; i++) {
        if (defaultText.data[i] !== fontText.data[i]) {
          different = true;
          break;
        }
      }
      
      if (different) {
        detectedFonts.push(font);
      }
    } catch (e) {
      console.error(`Font detection error for ${font}:`, e);
    }
  }
  
  return await hashString(detectedFonts.join(','));
};

// Function to get plugin info
const getPlugins = async (): Promise<string> => {
  if (!navigator.plugins) return '';
  
  const plugins: string[] = [];
  for (let i = 0; i < navigator.plugins.length; i++) {
    const plugin = navigator.plugins[i];
    plugins.push(plugin.name);
  }
  
  return await hashString(plugins.join(','));
};

export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const generateFingerprint = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Collect data for fingerprinting
      const canvasHash = await getCanvasFingerprint();
      const webglHash = await getWebGLFingerprint();
      const fontsHash = await getFonts();
      const pluginsHash = await getPlugins();
      
      // Create device info object
      const info: DeviceInfo = {
        fingerprint: '',
        components: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          colorDepth: window.screen.colorDepth,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          sessionStorage: !!window.sessionStorage,
          localStorage: !!window.localStorage,
          cpuCores: navigator.hardwareConcurrency || 0,
          touchSupport: 'ontouchstart' in window,
          canvas: canvasHash,
          webgl: webglHash,
          fonts: fontsHash,
          plugins: pluginsHash,
          hardwareConcurrency: navigator.hardwareConcurrency || 0,
          deviceMemory: (navigator as any).deviceMemory || 0
        }
      };
      
      // Generate the final fingerprint hash
      const components = Object.values(info.components).join('|||');
      const fingerprintHash = await hashString(components);
      
      info.fingerprint = fingerprintHash;
      
      // Save results
      setDeviceInfo(info);
      setFingerprint(fingerprintHash);
      
      // Store for future use
      localStorage.setItem('device_fingerprint', fingerprintHash);
      
      return fingerprintHash;
    } catch (error) {
      console.error('Error generating fingerprint:', error);
      // Fallback to a simpler fingerprint if something fails
      const fallbackHash = await hashString(navigator.userAgent + navigator.language + window.screen.width + window.screen.height);
      setFingerprint(fallbackHash);
      return fallbackHash;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate fingerprint on component mount
  useEffect(() => {
    // Try to use cached fingerprint first
    const cachedFingerprint = localStorage.getItem('device_fingerprint');
    
    if (cachedFingerprint) {
      setFingerprint(cachedFingerprint);
      setIsLoading(false);
    } else {
      generateFingerprint();
    }
    
    // Re-generate after certain period or on significant events
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [generateFingerprint]);
  
  // Handle resize event for potential screen changes
  const handleResize = () => {
    // Only regenerate if the screen dimensions change significantly
    if (deviceInfo && (
      Math.abs(window.screen.width - parseInt(deviceInfo.components.screenResolution.split('x')[0])) > 100 ||
      Math.abs(window.screen.height - parseInt(deviceInfo.components.screenResolution.split('x')[1])) > 100
    )) {
      generateFingerprint();
    }
  };

  return { 
    fingerprint, 
    deviceInfo, 
    isLoading, 
    refreshFingerprint: generateFingerprint 
  };
}

export default useDeviceFingerprint;