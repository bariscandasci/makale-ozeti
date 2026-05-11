import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import App from './App';
import { AuthProvider } from './context/AuthContext';

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
});
