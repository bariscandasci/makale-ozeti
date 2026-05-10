import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import App from './App';
import { AuthProvider } from './context/AuthContext';
import api from './services/api';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
    },
  },
}));

describe('App', () => {
  let container;
  let root;

  beforeEach(() => {
    localStorage.clear();
    api.get.mockReset();
    api.post.mockReset();
    api.delete.mockReset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('renders the login screen for unauthenticated users', async () => {
    api.get.mockResolvedValue({ data: [] });

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={['/']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('Tekrar hoş geldin');
    expect(container.textContent).toContain('Hesabın yok mu?');
  });

  it('renders dashboard for authenticated users', async () => {
    localStorage.setItem('makale-ozeti-token', 'mock-token');
    api.get.mockImplementation((url) => {
      if (url === '/auth/profile') {
        return Promise.resolve({
          data: {
            id: 'user-1',
            email: 'test@test.com',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        });
      }

      if (url === '/history') {
        return Promise.resolve({ data: [] });
      }

      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={['/dashboard']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('Makale özetlerini güvenli SaaS panelinden yönet.');
    expect(container.textContent).toContain('test@test.com');
  });
});
