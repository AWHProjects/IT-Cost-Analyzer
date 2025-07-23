import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import Login from '../../src/client/src/components/Login';

// Mock the API service
jest.mock('../../src/client/src/services/api', () => ({
  __esModule: true,
  default: {
    auth: {
      login: jest.fn(),
      register: jest.fn(),
    },
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Get the mocked API
const mockApi = require('../../src/client/src/services/api').default;

describe('Login Component', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form correctly', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    expect(screen.getByText('IT Cost Analyzer')).toBeInTheDocument();
    expect(screen.getByText('Monitor and optimize your SaaS spending')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('should switch to register mode when clicking register tab', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    const registerTab = screen.getByText('Register');
    fireEvent.click(registerTab);
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const mockResponse = {
      success: true,
      data: {
        token: 'mock-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
    };

    mockApi.auth.login.mockResolvedValueOnce(mockResponse);

    render(<Login onLogin={mockOnLogin} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApi.auth.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    }));
    expect(mockOnLogin).toHaveBeenCalledWith({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    }, 'mock-token');
  });

  it('should handle login error', async () => {
    const mockResponse = {
      success: false,
      message: 'Invalid credentials',
    };

    mockApi.auth.login.mockResolvedValueOnce(mockResponse);

    render(<Login onLogin={mockOnLogin} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should handle successful registration', async () => {
    const mockResponse = {
      success: true,
      data: {
        token: 'mock-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
    };

    mockApi.auth.register.mockResolvedValueOnce(mockResponse);

    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to register mode
    const registerTab = screen.getByText('Register');
    fireEvent.click(registerTab);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const orgInput = screen.getByLabelText(/organization name/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(orgInput, { target: { value: 'Test Org' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApi.auth.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        department: 'Test Org',
      });
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
    expect(mockOnLogin).toHaveBeenCalled();
  });

  it('should handle registration error', async () => {
    const mockResponse = {
      success: false,
      message: 'User already exists',
    };

    mockApi.auth.register.mockResolvedValueOnce(mockResponse);

    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to register mode
    const registerTab = screen.getByText('Register');
    fireEvent.click(registerTab);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeInTheDocument();
    });

    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should show loading state during form submission', async () => {
    // Mock a delayed response
    const mockResponse = {
      success: true,
      data: {
        token: 'mock-token',
        user: { id: 'user-123' },
      },
    };

    mockApi.auth.login.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
    );

    render(<Login onLogin={mockOnLogin} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Check for loading state
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalled();
    });
  });

  it('should handle API errors', async () => {
    mockApi.auth.login.mockRejectedValueOnce(new Error('Network error'));

    render(<Login onLogin={mockOnLogin} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should switch back to login mode from register mode', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to register mode
    const registerTab = screen.getByText('Register');
    fireEvent.click(registerTab);
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    
    // Switch back to login mode
    const loginTab = screen.getByText('Login');
    fireEvent.click(loginTab);
    
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should display demo credentials in login mode', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    expect(screen.getByText('Demo Credentials:')).toBeInTheDocument();
    expect(screen.getByText('Email: admin@acme.com')).toBeInTheDocument();
    expect(screen.getByText('Password: password123')).toBeInTheDocument();
  });

  it('should not display demo credentials in register mode', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to register mode
    const registerTab = screen.getByText('Register');
    fireEvent.click(registerTab);
    
    expect(screen.queryByText('Demo Credentials:')).not.toBeInTheDocument();
  });

  it('should handle single name in registration', async () => {
    const mockResponse = {
      success: true,
      data: {
        token: 'mock-token',
        user: { id: 'user-123' },
      },
    };

    mockApi.auth.register.mockResolvedValueOnce(mockResponse);

    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to register mode
    const registerTab = screen.getByText('Register');
    fireEvent.click(registerTab);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(nameInput, { target: { value: 'John' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApi.auth.register).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: '',
        department: '',
      });
    });
  });
});