import { vi } from 'vitest'

// Mock do localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock do fetch
globalThis.fetch = vi.fn()

// Mock do console.error para evitar ruído nos testes
console.error = vi.fn()