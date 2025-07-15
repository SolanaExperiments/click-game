// Extends the Window interface to include the Phantom wallet property
export {};

declare global {
  interface Window {
    phantom?: any; // Replace 'any' with a more specific type if available
  }
}
