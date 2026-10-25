import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// RTL only auto-cleans when vitest globals are on; they are not.
afterEach(cleanup);
