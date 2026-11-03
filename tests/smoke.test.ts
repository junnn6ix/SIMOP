import { describe, it, expect } from 'vitest';

describe('Smoke test', () => {
  it('environment variables load test defaults', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});

