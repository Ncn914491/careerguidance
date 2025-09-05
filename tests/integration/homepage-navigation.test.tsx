/**
 * Homepage and Navigation Integration Tests
 * Tests the complete integration between Layout, Sidebar, HomePage, and AskAI components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { usePathname } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { HomePage } from '@/components/features/HomePage'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

// Mock createPortal for Modal components
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}))

// Mock API calls
global.fetch = jest.fn()

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

describe('Homepage and Navigation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePathname.mockReturnValue('/')
    mockLocalStorage.getItem.mockReturnValue(null)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ([]),
    })
  })

  test('renders complete homepage with layout and navigation', () => {
    render(
      <Layout>
        <HomePage />
      </Layout>
    )

    // Check layout components
    expect(screen.getByText('Career Guidance')).toBeInTheDocument()
    expect(screen.getByLabelText('Open AI Assistant')).toBeInTheDocument()

    // Check navigation items
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /weeks/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /groups/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /team/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /schools/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()

    // Check homepage content
    expect(screen.getByText('Welcome to Career Guidance Project')).toBeInTheDocument()
    expect(screen.getByText('Schools Visited')).toBeInTheDocument()
    expect(screen.getByText('Team Members')).toBeInTheDocument()
    expect(screen.getByText('Students Taught')).toBeInTheDocument()
    expect(screen.getByText('Total Visits')).toBeInTheDocument()
  })

  test('sidebar collapse affects main content layout', () => {
    const { container } = render(
      <Layout>
        <HomePage />
      </Layout>
    )

    const toggleButton = screen.getByLabelText('Collapse sidebar')
    const mainContentArea = container.querySelector('main')?.parentElement

    // Initially expanded
    expect(mainContentArea).toHaveClass('lg:ml-64')

    // Collapse sidebar
    fireEvent.click(toggleButton)
    expect(mainContentArea).toHaveClass('lg:ml-16')

    // Expand sidebar
    fireEvent.click(screen.getByLabelText('Expand sidebar'))
    expect(mainContentArea).toHaveClass('lg:ml-64')
  })

  test('info box interactions work with modals', async () => {
    render(
      <Layout>
        <HomePage />
      </Layout>
    )

    // Click on Schools info box
    const schoolsInfoBox = screen.getByRole('button', { name: /schools visited/i })
    fireEvent.click(schoolsInfoBox)

    // Modal should open
    await waitFor(() => {
      expect(screen.getAllByText('Schools Visited')).toHaveLength(2) // One in info box, one in modal
    })

    // Close modal
    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)

    // Modal should close
    await waitFor(() => {
      expect(screen.getAllByText('Schools Visited')).toHaveLength(1) // Only in info box
    })
  })

  test('AskAI popup works independently of other components', () => {
    render(
      <Layout>
        <HomePage />
      </Layout>
    )

    // Open AskAI
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)

    expect(screen.getAllByText('AI Assistant')).toHaveLength(2) // One in header, one in content
    expect(screen.getByText(/Welcome! I'm here to help you with questions/)).toBeInTheDocument()

    // Close AskAI
    const closeButton = screen.getByLabelText('Close chat')
    fireEvent.click(closeButton)

    expect(screen.queryByText('Welcome! I\'m here to help you with questions about the career guidance program.')).not.toBeInTheDocument()
  })

  test('multiple modals can be opened and closed independently', async () => {
    render(
      <Layout>
        <HomePage />
      </Layout>
    )

    // Open AskAI
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)
    expect(screen.getAllByText('AI Assistant')).toHaveLength(2) // One in header, one in content

    // Open Schools modal
    const schoolsInfoBox = screen.getByRole('button', { name: /schools visited/i })
    fireEvent.click(schoolsInfoBox)

    await waitFor(() => {
      expect(screen.getAllByText('Schools Visited')).toHaveLength(2) // One in info box, one in modal
    })

    // Both should be open
    expect(screen.getAllByText('AI Assistant')).toHaveLength(2)

    // Close AskAI
    const closeAIButton = screen.getByLabelText('Close chat')
    fireEvent.click(closeAIButton)
    expect(screen.queryByText(/Welcome! I'm here to help you with questions/)).not.toBeInTheDocument()

    // Schools modal should still be open
    expect(screen.getAllByText('Schools Visited')).toHaveLength(2)
  })

  test('sidebar state persists during modal interactions', () => {
    render(
      <Layout>
        <HomePage />
      </Layout>
    )

    // Collapse sidebar
    const toggleButton = screen.getByLabelText('Collapse sidebar')
    fireEvent.click(toggleButton)

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'true')

    // Open and close a modal
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)
    
    const closeButton = screen.getByLabelText('Close chat')
    fireEvent.click(closeButton)

    // Sidebar should still be collapsed
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument()
  })

  test('navigation links have correct active states', () => {
    mockUsePathname.mockReturnValue('/')
    
    render(
      <Layout>
        <HomePage />
      </Layout>
    )

    const homeLink = screen.getByRole('link', { name: /home/i })
    const weeksLink = screen.getByRole('link', { name: /weeks/i })

    // Home should be active
    expect(homeLink).toHaveClass('bg-glass-light', 'border', 'border-glass', 'text-white')
    
    // Weeks should not be active
    expect(weeksLink).toHaveClass('text-gray-300')
    expect(weeksLink).not.toHaveClass('bg-glass-light')
  })

  test('mobile menu functionality works correctly', () => {
    render(
      <Layout>
        <HomePage />
      </Layout>
    )

    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu')
    
    // Open mobile menu
    fireEvent.click(mobileMenuButton)

    // Check if sidebar becomes visible (translate-x-0)
    const sidebar = document.querySelector('.fixed.left-0.top-0')
    expect(sidebar).toHaveClass('translate-x-0')

    // Close mobile menu
    fireEvent.click(mobileMenuButton)
    expect(sidebar).toHaveClass('-translate-x-full')
  })

  test('responsive behavior on window resize', async () => {
    render(
      <Layout>
        <HomePage />
      </Layout>
    )

    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu')
    
    // Open mobile menu
    fireEvent.click(mobileMenuButton)

    // Simulate window resize to large screen
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    
    fireEvent(window, new Event('resize'))

    // Mobile menu should close automatically
    await waitFor(() => {
      const sidebar = document.querySelector('.fixed.left-0.top-0')
      expect(sidebar).toHaveClass('-translate-x-full')
    })
  })

  test('keyboard navigation works for interactive elements', () => {
    render(
      <Layout>
        <HomePage />
      </Layout>
    )

    // Test info box keyboard interaction
    const schoolsInfoBox = screen.getByRole('button', { name: /schools visited/i })
    
    // Focus and press Enter
    schoolsInfoBox.focus()
    fireEvent.keyDown(schoolsInfoBox, { key: 'Enter' })

    // Modal should open - check for modal content instead of role
    expect(screen.getAllByText('Schools Visited')).toHaveLength(2)

    // Test modal close with Escape
    fireEvent.keyDown(document, { key: 'Escape' })
    
    // Modal should close
    expect(screen.getAllByText('Schools Visited')).toHaveLength(1)
  })

  test('all components render without console errors', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    render(
      <Layout>
        <HomePage />
      </Layout>
    )

    expect(consoleSpy).not.toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })
})