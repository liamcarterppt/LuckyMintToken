import { useState, useEffect, useCallback } from 'react';
import useDeviceFingerprint from './use-device-fingerprint';

interface ValidationPayload {
  nonce: string;
  timestamp: number;
  fingerprint: string;
  action: string;
  signature: string;
}

/**
 * Hook for generating cryptographic validation for requests
 * This helps prevent various attacks like:
 * - Replay attacks (through nonce and timestamp)
 * - Request forgery (through signatures)
 * - Session hijacking (through device fingerprinting)
 */
export function useRequestValidation() {
  const [serverSalt, setServerSalt] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const { fingerprint } = useDeviceFingerprint();
  
  // Get the server salt on component mount
  useEffect(() => {
    const fetchServerSalt = async () => {
      try {
        const response = await fetch('/api/security/salt');
        if (response.ok) {
          const data = await response.json();
          setServerSalt(data.salt);
        }
      } catch (error) {
        console.error('Failed to fetch server salt:', error);
      }
    };
    
    fetchServerSalt();
  }, []);
  
  // Generate a new nonce
  const generateNonce = useCallback(async (): Promise<string> => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const newNonce = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    setNonce(newNonce);
    return newNonce;
  }, []);
  
  // Generate HMAC signature for payload
  const generateSignature = useCallback(async (payload: string, secret: string): Promise<string> => {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);
    
    // Create crypto key from secret
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Sign the message
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      messageData
    );
    
    // Convert to hex string
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }, []);
  
  // Create a validated payload for API requests
  const createValidatedPayload = useCallback(async (
    action: string,
    data: any = {}
  ): Promise<ValidationPayload> => {
    // Generate a new nonce if we don't have one
    const currentNonce = nonce || await generateNonce();
    
    if (!fingerprint) {
      throw new Error('Device fingerprint not available');
    }
    
    if (!serverSalt) {
      throw new Error('Server salt not available');
    }
    
    // Create payload with nonce and timestamp
    const timestamp = Date.now();
    const payloadString = JSON.stringify({
      action,
      nonce: currentNonce,
      timestamp,
      fingerprint,
      data
    });
    
    // Generate signature using HMAC
    const signature = await generateSignature(payloadString, serverSalt);
    
    return {
      nonce: currentNonce,
      timestamp,
      fingerprint,
      action,
      signature
    };
  }, [nonce, fingerprint, serverSalt, generateNonce, generateSignature]);
  
  // Attach validation to any API request
  const secureRequest = useCallback(async (
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
    action: string,
    data: any = {}
  ) => {
    try {
      // Create validated payload
      const validationPayload = await createValidatedPayload(action, data);
      
      // Combine validation with actual data
      const requestBody = {
        ...data,
        _validation: validationPayload
      };
      
      // Make the request
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      // Generate a new nonce for next request (single use)
      await generateNonce();
      
      return await response.json();
    } catch (error) {
      console.error('Secure request failed:', error);
      throw error;
    }
  }, [createValidatedPayload, generateNonce]);
  
  return {
    secureRequest,
    createValidatedPayload,
    isReady: !!serverSalt && !!fingerprint
  };
}

export default useRequestValidation;