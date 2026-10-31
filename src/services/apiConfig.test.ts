import { describe, expect, it } from 'vitest';
import { createApiConfig } from './apiConfig';

describe('public backend configuration', () => {
  it('leaves an absent backend unconfigured', () => {
    expect(createApiConfig('  ').baseUrl).toBeNull();
  });
  it('preserves an API path and removes trailing slashes', () => {
    expect(createApiConfig(' https://example.test/api/ ').baseUrl).toBe('https://example.test/api');
  });
  it.each(['ftp://example.test', 'https://user:password@example.test', 'https://example.test?token=value', 'https://example.test#token', '/api'])('rejects invalid or credential-bearing configuration: %s', value => {
    expect(() => createApiConfig(value)).toThrow();
  });
});
