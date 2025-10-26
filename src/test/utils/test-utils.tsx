import { render } from '@testing-library/react';
import React from 'react';

/**
 * Custom render function that wraps components with necessary providers
 * Add your global providers here (e.g., Router, Theme, Zustand stores)
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: React.ReactElement,
  options?: Parameters<typeof render>[1]
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
