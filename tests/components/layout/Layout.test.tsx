/**
 * Layout Component Tests
 * Tests the main layout component including sidebar integration and responsive behavior
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Layout from '@/components/layout/Layout'

// Mock the child components
jest.mock('@/components/layout/Sidebar', () => {
  return function MockSidebar({ isCollapsed, onToggle, isMobileOpen, onMobileToggle }: any) {
    return (
      <div data-testid="sidebar">
        <button 
          data-testid="sidebar-toggle" 
          onClick={onToggle}
        >
          {isCollapsed ? 'Expand' : 'Collapse'}
        </button>
        <button 
          data-testid="mobile-toggle" 
          onClick={onMobileToggle}
        >
          Mobile Menu
        </button>
        <div data-testid="sidebar-state">
          {isCollapsed ? 'collapsed' : 'expanded'}
        </div>
        <div data-testid="mobile-state">
          {isMobileOpen ? 'open' : 'closed'}
        </div>
      </div>
    )
  }
})

jest.mock('@/components/features/AskAI/AskAI', () => {
  return function MockAskAI() {
    return <div data-testid="ask-ai">AskAI Component</div>
  }
})

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('Layout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  test('renders layout with all components', () => {
    render(
      <Layout>
        <div data-testid="test-content">Test Content</div>
      </Layout>
    )

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('ask-ai')).toBeInTheDocument()
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  test('renders children content correctly', () => {
    render(
      <Layout>
        <h1>Homepage Content</h1>
        <p>This is the main content area</p>
      </Layout>
    )

    expect(screen.getByText('Homepage Content')).toBeInTheDocument()
    expect(screen.getByText('This is the main content area')).toBeInTheDocument()
  })

  test('sidebar starts in expanded state by default', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('expanded')
  })

  test('toggles sidebar state when toggle button is clicked', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    const toggleButton = screen.getByTestId('sidebar-toggle')
    
    // Initially expanded
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('expanded')
    
    // Click to collapse
    fireEvent.click(toggleButton)
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('collapsed')
    
    // Click to expand
    fireEvent.click(toggleButton)
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('expanded')
  })

  test('persists sidebar state in localStorage', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    const toggleButton = screen.getByTestId('sidebar-toggle')
    
    // Click to collapse
    fireEvent.click(toggleButton)
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'true')
    
    // Click to expand
    fireEvent.click(toggleButton)
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'false')
  })

  test('loads sidebar state from localStorage on mount', () => {
    mockLocalStorage.getItem.mockReturnValue('true')
    
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('sidebar-collapsed')
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('collapsed')
  })

  test('handles mobile menu toggle', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    const mobileToggle = screen.getByTestId('mobile-toggle')
    
    // Initially closed
    expect(screen.getByTestId('mobile-state')).toHaveTextContent('closed')
    
    // Click to open
    fireEvent.click(mobileToggle)
    expect(screen.getByTestId('mobile-state')).toHaveTextContent('open')
    
    // Click to close
    fireEvent.click(mobileToggle)
    expect(screen.getByTestId('mobile-state')).toHaveTextContent('closed')
  })

  test('renders mobile overlay when mobile menu is open', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    const mobileToggle = screen.getByTestId('mobile-toggle')
    
    // Open mobile menu
    fireEvent.click(mobileToggle)
    
    // Check for overlay (it should be in the DOM)
    const overlay = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50')
    expect(overlay).toBeInTheDocument()
  })

  test('closes mobile menu when overlay is clicked', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    const mobileToggle = screen.getByTestId('mobile-toggle')
    
    // Open mobile menu
    fireEvent.click(mobileToggle)
    expect(screen.getByTestId('mobile-state')).toHaveTextContent('open')
    
    // Click overlay to close
    const overlay = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50')
    if (overlay) {
      fireEvent.click(overlay)
    }
    
    expect(screen.getByTestId('mobile-state')).toHaveTextContent('closed')
  })

  test('handles window resize to close mobile menu on large screens', async () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    const mobileToggle = screen.getByTestId('mobile-toggle')
    
    // Open mobile menu
    fireEvent.click(mobileToggle)
    expect(screen.getByTestId('mobile-state')).toHaveTextContent('open')
    
    // Simulate window resize to large screen
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    
    fireEvent(window, new Event('resize'))
    
    await waitFor(() => {
      expect(screen.getByTestId('mobile-state')).toHaveTextContent('closed')
    })
  })

  test('applies correct CSS classes based on sidebar state', () => {
    const { container } = render(
      <Layout>
        <div data-testid="main-content">Content</div>
      </Layout>
    )

    const toggleButton = screen.getByTestId('sidebar-toggle')
    const mainContent = container.querySelector('main')
    
    // Initially expanded - should have lg:ml-64
    expect(mainContent?.parentElement).toHaveClass('lg:ml-64')
    
    // Collapse sidebar
    fireEvent.click(toggleButton)
    
    // Should now have lg:ml-16
    expect(mainContent?.parentElement).toHaveClass('lg:ml-16')
  })
})