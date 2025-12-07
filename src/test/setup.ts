import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});

// ✅ Mock do localStorage (necessário para testes que usam Google Docs Service)
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ✅ Mock do sessionStorage
Object.defineProperty(globalThis, "sessionStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock de variáveis de ambiente
vi.mock("process", () => ({
  env: {
    VITE_TODOIST_API_TOKEN: "test-token",
    VITE_GOOGLE_CLIENT_ID: "test-client-id",
    VITE_GOOGLE_CLIENT_SECRET: "test-client-secret",
  },
}));

// Mock do window.matchMedia
Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock do IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  disconnect() {
    /* Mock method - intentionally empty */
  }
  observe() {
    /* Mock method - intentionally empty */
  }
  takeRecords() {
    return [];
  }
  unobserve() {
    /* Mock method - intentionally empty */
  }
} as unknown as typeof IntersectionObserver;

// Mock do ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  disconnect() {
    /* Mock method - intentionally empty */
  }
  observe() {
    /* Mock method - intentionally empty */
  }
  unobserve() {
    /* Mock method - intentionally empty */
  }
} as unknown as typeof ResizeObserver;
