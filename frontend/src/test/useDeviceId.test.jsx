import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useDeviceId } from '../hooks/useDeviceId';

describe('useDeviceId hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates and persists a valid UUID in localStorage if none exists', () => {
    const { result } = renderHook(() => useDeviceId());
    expect(result.current).toBeTruthy();
    expect(result.current).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(localStorage.getItem('csm_anonymous_device_id')).toBe(result.current);
  });

  it('returns existing UUID from localStorage without generating a new one', () => {
    const existingId = '12345678-1234-4234-8234-123456789abc';
    localStorage.setItem('csm_anonymous_device_id', existingId);

    const { result } = renderHook(() => useDeviceId());
    expect(result.current).toBe(existingId);
  });
});
