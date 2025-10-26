import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW Server for Node.js environment (unit/integration tests)
 * This server intercepts HTTP requests in tests
 */
export const server = setupServer(...handlers);
