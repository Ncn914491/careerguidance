/**
 * HomePage Component Tests
 * Tests the homepage component including info boxes and modal interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '@/components/features/HomePage/HomePage'

// Mock the child components
jest.mock('@/components/ui/InfoBox', () => {
  return function MockInfoBox({ title, value, color, onClick, icon }: any) {
    return (
      <div 
        data-testid={`info-box-${title.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
      >
        <h3>{title}</h3>
        <p className={color}>{value}</p>
        {icon && <div data-testid="icon">{icon}</div>}
        {onClick && <div>Click to view details</div>}
      </div>
    )
  }
})

jest.mock('@/components/ui/Modal', () => {
  return function MockModal({ isOpen, onClose, title, children }: any) {
    if (!isOpen) return null
    return (
      <div data-testid="modal">
        <div data-testid="modal-header">
          <h2>{title}</h2>
          <button data-testid="modal-close" onClick={onClose}>Close</button>
        </div>
        <div data-testid="modal-content">{children}</div>
      </div>
    )
  }
})

jest.mock('@/components/features/HomePage/SchoolsList', () => {
  return function MockSchoolsList() {
    return <div data-testid="schools-list">Schools List Component</div>
  }
})

jest.mock('@/components/features/HomePage/TeamPopup', () => {
  return function MockTeamPopup() {
    return <div data-testid="team-popup">Team Popup Component</div>
  }
})

describe('HomePage Component', () => {
  test('renders welcome section', () => {
    render(<HomePage />)

    expect(screen.getByText('Welcome to Career Guidance Project')).toBeInTheDocument()
    expect(screen.getByText(/A comprehensive platform showcasing our educational outreach activities/)).toBeInTheDocument()
  })

  test('renders all info boxes with correct data', () => {
    render(<HomePage />)

    // Check all info boxes are rendered
    expect(screen.getByTestId('info-box-schools-visited')).toBeInTheDocument()
    expect(screen.getByTestId('info-box-team-members')).toBeInTheDocument()
    expect(screen.getByTestId('info-box-students-taught')).toBeInTheDocument()
    expect(screen.getByTestId('info-box-total-visits')).toBeInTheDocument()

    // Check info box content
    expect(screen.getByText('Schools Visited')).toBeInTheDocument()
    expect(screen.getByText('5+')).toBeInTheDocument()
    expect(screen.getByText('Team Members')).toBeInTheDocument()
    expect(screen.getByText('11')).toBeInTheDocument()
    expect(screen.getByText('Students Taught')).toBeInTheDocument()
    expect(screen.getByText('500+')).toBeInTheDocument()
    expect(screen.getByText('Total Visits')).toBeInTheDocument()
    expect(screen.getByText('15+')).toBeInTheDocument()
  })

  test('info boxes have correct colors', () => {
    render(<HomePage />)

    expect(screen.getByText('5+')).toHaveClass('text-blue-400')
    expect(screen.getByText('11')).toHaveClass('text-green-400')
    expect(screen.getByText('500+')).toHaveClass('text-purple-400')
    expect(screen.getByText('15+')).toHaveClass('text-orange-400')
  })

  test('schools and team info boxes are clickable', () => {
    render(<HomePage />)

    const schoolsBox = screen.getByTestId('info-box-schools-visited')
    const teamBox = screen.getByTestId('info-box-team-members')

    expect(schoolsBox).toHaveAttribute('role', 'button')
    expect(teamBox).toHaveAttribute('role', 'button')
    expect(schoolsBox).toHaveTextContent('Click to view details')
    expect(teamBox).toHaveTextContent('Click to view details')
  })

  test('students and visits info boxes are not clickable', () => {
    render(<HomePage />)

    const studentsBox = screen.getByTestId('info-box-students-taught')
    const visitsBox = screen.getByTestId('info-box-total-visits')

    expect(studentsBox).not.toHaveAttribute('role', 'button')
    expect(visitsBox).not.toHaveAttribute('role', 'button')
    expect(studentsBox).not.toHaveTextContent('Click to view details')
    expect(visitsBox).not.toHaveTextContent('Click to view details')
  })

  test('opens schools modal when schools info box is clicked', () => {
    render(<HomePage />)

    const schoolsBox = screen.getByTestId('info-box-schools-visited')
    fireEvent.click(schoolsBox)

    expect(screen.getByTestId('modal')).toBeInTheDocument()
    expect(screen.getByText('Schools Visited')).toBeInTheDocument()
    expect(screen.getByTestId('schools-list')).toBeInTheDocument()
  })

  test('opens team modal when team info box is clicked', () => {
    render(<HomePage />)

    const teamBox = screen.getByTestId('info-box-team-members')
    fireEvent.click(teamBox)

    expect(screen.getByTestId('modal')).toBeInTheDocument()
    expect(screen.getByText('Team Members')).toBeInTheDocument()
    expect(screen.getByTestId('team-popup')).toBeInTheDocument()
  })

  test('closes schools modal when close button is clicked', () => {
    render(<HomePage />)

    // Open modal
    const schoolsBox = screen.getByTestId('info-box-schools-visited')
    fireEvent.click(schoolsBox)

    expect(screen.getByTestId('modal')).toBeInTheDocument()

    // Close modal
    const closeButton = screen.getByTestId('modal-close')
    fireEvent.click(closeButton)

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  test('closes team modal when close button is clicked', () => {
    render(<HomePage />)

    // Open modal
    const teamBox = screen.getByTestId('info-box-team-members')
    fireEvent.click(teamBox)

    expect(screen.getByTestId('modal')).toBeInTheDocument()

    // Close modal
    const closeButton = screen.getByTestId('modal-close')
    fireEvent.click(closeButton)

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  test('can open and close different modals independently', () => {
    render(<HomePage />)

    // Open schools modal
    const schoolsBox = screen.getByTestId('info-box-schools-visited')
    fireEvent.click(schoolsBox)

    expect(screen.getByText('Schools Visited')).toBeInTheDocument()
    expect(screen.getByTestId('schools-list')).toBeInTheDocument()

    // Close schools modal
    fireEvent.click(screen.getByTestId('modal-close'))
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()

    // Open team modal
    const teamBox = screen.getByTestId('info-box-team-members')
    fireEvent.click(teamBox)

    expect(screen.getByText('Team Members')).toBeInTheDocument()
    expect(screen.getByTestId('team-popup')).toBeInTheDocument()
  })

  test('renders quick actions section', () => {
    render(<HomePage />)

    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('View Latest Week')).toBeInTheDocument()
    expect(screen.getByText('Join Group Chat')).toBeInTheDocument()
    expect(screen.getByText('Ask AI Assistant')).toBeInTheDocument()
  })

  test('quick action buttons have correct descriptions', () => {
    render(<HomePage />)

    expect(screen.getByText('Check out the most recent program content')).toBeInTheDocument()
    expect(screen.getByText('Connect with other participants')).toBeInTheDocument()
    expect(screen.getByText('Get help with your questions')).toBeInTheDocument()
  })

  test('info boxes render with icons', () => {
    render(<HomePage />)

    // Each info box should have an icon
    const infoBoxes = [
      'info-box-schools-visited',
      'info-box-team-members', 
      'info-box-students-taught',
      'info-box-total-visits'
    ]

    infoBoxes.forEach(boxId => {
      const box = screen.getByTestId(boxId)
      expect(box.querySelector('[data-testid="icon"]')).toBeInTheDocument()
    })
  })

  test('handles multiple rapid clicks on info boxes', () => {
    render(<HomePage />)

    const schoolsBox = screen.getByTestId('info-box-schools-visited')
    
    // Click multiple times rapidly
    fireEvent.click(schoolsBox)
    fireEvent.click(schoolsBox)
    fireEvent.click(schoolsBox)

    // Should still only have one modal open
    expect(screen.getAllByTestId('modal')).toHaveLength(1)
  })

  test('students and visits info boxes do not trigger any action when clicked', () => {
    render(<HomePage />)

    const studentsBox = screen.getByTestId('info-box-students-taught')
    const visitsBox = screen.getByTestId('info-box-total-visits')

    // Click on non-interactive boxes
    fireEvent.click(studentsBox)
    fireEvent.click(visitsBox)

    // No modal should open
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  test('renders with proper structure and layout classes', () => {
    const { container } = render(<HomePage />)

    // Check main container has space-y-6
    const mainContainer = container.firstChild
    expect(mainContainer).toHaveClass('space-y-6')

    // Check welcome section has glass styling
    const welcomeSection = container.querySelector('.bg-glass')
    expect(welcomeSection).toBeInTheDocument()
    expect(welcomeSection).toHaveClass('backdrop-blur-md', 'rounded-xl', 'border', 'border-glass')
  })

  test('modal passes correct props to Modal component', () => {
    render(<HomePage />)

    // Open schools modal
    const schoolsBox = screen.getByTestId('info-box-schools-visited')
    fireEvent.click(schoolsBox)

    // Check modal title
    expect(screen.getByText('Schools Visited')).toBeInTheDocument()
    
    // Open team modal (close schools first)
    fireEvent.click(screen.getByTestId('modal-close'))
    
    const teamBox = screen.getByTestId('info-box-team-members')
    fireEvent.click(teamBox)

    // Check modal title changed
    expect(screen.getByText('Team Members')).toBeInTheDocument()
  })
})