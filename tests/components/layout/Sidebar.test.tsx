/**
 * Sidebar Component Tests
 * Tests the sidebar navigation component including collapsible functionality and navigation
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('Sidebar Component', () => {
  const defaultProps = {
    isCollapsed: false,
    onToggle: jest.fn(),
    isMobileOpen: false,
    onMobileToggle: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePathname.mockReturnValue('/')
  })

  test('renders sidebar with all navigation items', () => {
    render(<Sidebar {...defaultProps} />)

    // Check for navigation items
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Weeks')).toBeInTheDocument()
    expect(screen.getByText('Groups')).toBeInTheDocument()
    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.getByText('Schools')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  test('renders header with title when not collapsed', () => {
    render(<Sidebar {...defaultProps} />)

    expect(screen.getByText('Career Guidance')).toBeInTheDocument()
  })

  test('hides header title when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />)

    expect(screen.queryByText('Career Guidance')).not.toBeInTheDocument()
  })

  test('renders mobile menu button', () => {
    render(<Sidebar {...defaultProps} />)

    const mobileButton = screen.getByLabelText('Toggle mobile menu')
    expect(mobileButton).toBeInTheDocument()
  })

  test('calls onToggle when collapse/expand button is clicked', () => {
    const onToggle = jest.fn()
    render(<Sidebar {...defaultProps} onToggle={onToggle} />)

    const toggleButton = screen.getByLabelText('Collapse sidebar')
    fireEvent.click(toggleButton)

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  test('calls onMobileToggle when mobile menu button is clicked', () => {
    const onMobileToggle = jest.fn()
    render(<Sidebar {...defaultProps} onMobileToggle={onMobileToggle} />)

    const mobileButton = screen.getByLabelText('Toggle mobile menu')
    fireEvent.click(mobileButton)

    expect(onMobileToggle).toHaveBeenCalledTimes(1)
  })

  test('shows correct toggle button icon when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />)

    const toggleButton = screen.getByLabelText('Expand sidebar')
    expect(toggleButton).toBeInTheDocument()
  })

  test('shows correct toggle button icon when expanded', () => {
    render(<Sidebar {...defaultProps} isCollapsed={false} />)

    const toggleButton = screen.getByLabelText('Collapse sidebar')
    expect(toggleButton).toBeInTheDocument()
  })

  test('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/weeks')
    render(<Sidebar {...defaultProps} />)

    const weeksLink = screen.getByRole('link', { name: /weeks/i })
    expect(weeksLink).toHaveClass('bg-glass-light', 'border', 'border-glass', 'text-white')
  })

  test('applies inactive styles to non-active navigation items', () => {
    mockUsePathname.mockReturnValue('/weeks')
    render(<Sidebar {...defaultProps} />)

    const homeLink = screen.getByRole('link', { name: /home/i })
    expect(homeLink).toHaveClass('text-gray-300')
    expect(homeLink).not.toHaveClass('bg-glass-light')
  })

  test('navigation links have correct href attributes', () => {
    render(<Sidebar {...defaultProps} />)

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /weeks/i })).toHaveAttribute('href', '/weeks')
    expect(screen.getByRole('link', { name: /groups/i })).toHaveAttribute('href', '/groups')
    expect(screen.getByRole('link', { name: /team/i })).toHaveAttribute('href', '/team')
    expect(screen.getByRole('link', { name: /schools/i })).toHaveAttribute('href', '/schools')
    expect(screen.getByRole('link', { name: /admin/i })).toHaveAttribute('href', '/admin')
  })

  test('applies correct CSS classes when collapsed', () => {
    const { container } = render(<Sidebar {...defaultProps} isCollapsed={true} />)

    const sidebar = container.querySelector('.fixed.left-0.top-0')
    expect(sidebar).toHaveClass('w-16')
  })

  test('applies correct CSS classes when expanded', () => {
    const { container } = render(<Sidebar {...defaultProps} isCollapsed={false} />)

    const sidebar = container.querySelector('.fixed.left-0.top-0')
    expect(sidebar).toHaveClass('w-64')
  })

  test('applies correct CSS classes when mobile menu is open', () => {
    const { container } = render(<Sidebar {...defaultProps} isMobileOpen={true} />)

    const sidebar = container.querySelector('.fixed.left-0.top-0')
    expect(sidebar).toHaveClass('translate-x-0')
  })

  test('applies correct CSS classes when mobile menu is closed', () => {
    const { container } = render(<Sidebar {...defaultProps} isMobileOpen={false} />)

    const sidebar = container.querySelector('.fixed.left-0.top-0')
    expect(sidebar).toHaveClass('-translate-x-full')
  })

  test('renders footer with version info when not collapsed', () => {
    render(<Sidebar {...defaultProps} />)

    expect(screen.getByText('Career Guidance Project')).toBeInTheDocument()
    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
  })

  test('hides footer when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />)

    expect(screen.queryByText('Career Guidance Project')).not.toBeInTheDocument()
    expect(screen.queryByText('v1.0.0')).not.toBeInTheDocument()
  })

  test('navigation items show tooltips when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />)

    const homeLink = screen.getByRole('link', { name: /home/i })
    expect(homeLink).toHaveAttribute('title', 'Home')
  })

  test('navigation items do not show tooltips when expanded', () => {
    render(<Sidebar {...defaultProps} isCollapsed={false} />)

    const homeLink = screen.getByRole('link', { name: /home/i })
    expect(homeLink).not.toHaveAttribute('title')
  })

  test('renders all navigation icons', () => {
    render(<Sidebar {...defaultProps} />)

    // Check that each navigation item has an icon (svg element)
    const navigationItems = ['Home', 'Weeks', 'Groups', 'Team', 'Schools', 'Admin']
    
    navigationItems.forEach(item => {
      const link = screen.getByRole('link', { name: new RegExp(item, 'i') })
      const icon = link.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  test('navigation items have proper accessibility attributes', () => {
    render(<Sidebar {...defaultProps} />)

    const homeLink = screen.getByRole('link', { name: /home/i })
    expect(homeLink).toHaveAttribute('href')
    
    const toggleButton = screen.getByLabelText('Collapse sidebar')
    expect(toggleButton).toHaveAttribute('aria-label')
    
    const mobileButton = screen.getByLabelText('Toggle mobile menu')
    expect(mobileButton).toHaveAttribute('aria-label')
  })
})