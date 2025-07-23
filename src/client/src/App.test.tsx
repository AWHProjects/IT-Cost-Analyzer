import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the Login component
jest.mock('./components/Login', () => {
  return function MockLogin({ onLogin }: { onLogin: (user: any, token: string) => void }) {
    return (
      <div data-testid="login-component">
        <button onClick={() => onLogin({ id: 'test', name: 'Test User' }, 'test-token')}>
          Mock Login
        </button>
      </div>
    );
  };
});

test('renders IT Cost Analyzer app', () => {
  render(<App />);
  expect(screen.getByTestId('login-component')).toBeInTheDocument();
});
