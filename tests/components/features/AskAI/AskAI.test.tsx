/**
 * AskAI Component Tests
 * Tests the AskAI floating button and popup functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AskAI from '@/components/features/AskAI/AskAI'

// Mock createPortal since Modal uses it
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}))

describe('AskAI Component', () => {
  beforeEach(() => {
    // Reset document.body for each test
    document.body.innerHTML = ''
  })

  test('renders floating AskAI button', () => {
    render(<AskAI />)

    const askAIButton = screen.getByLabelText('Open AI Assistant')
    expect(askAIButton).toBeInTheDocument()
    expect(askAIButton).toHaveTextContent('Ask AI')
  })

  test('floating button has correct styling classes', () => {
    render(<AskAI />)

    const askAIButton = screen.getByLabelText('Open AI Assistant')
    expect(askAIButton).toHaveClass('fixed', 'bottom-6', 'right-6', 'z-40')
    expect(askAIButton).toHaveClass('bg-gradient-to-r', 'from-purple-600', 'to-blue-600')
  })

  test('opens chat modal when button is clicked', () => {
    render(<AskAI />)

    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)

    expect(screen.getAllByText('AI Assistant')).toHaveLength(2) // One in header, one in content
    expect(screen.getByText(/Welcome! I'm here to help you with questions/)).toBeInTheDocument()
  })

  test('modal is not visible initially', () => {
    render(<AskAI />)

    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument()
  })

  test('closes chat modal when close button is clicked', () => {
    render(<AskAI />)

    // Open modal
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)

    // Close modal
    const closeButton = screen.getByLabelText('Close chat')
    fireEvent.click(closeButton)

    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument()
  })

  test('toggles fullscreen mode', () => {
    render(<AskAI />)

    // Open modal
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)

    // Toggle fullscreen
    const fullscreenButton = screen.getByLabelText('Enter fullscreen')
    fireEvent.click(fullscreenButton)

    // Check if fullscreen button text changed
    expect(screen.getByLabelText('Exit fullscreen')).toBeInTheDocument()

    // Toggle back
    fireEvent.click(screen.getByLabelText('Exit fullscreen'))
    expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument()
  })

  test('modal has correct structure and content', () => {
    render(<AskAI />)

    // Open modal
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)

    // Check header
    expect(screen.getAllByText('AI Assistant')).toHaveLength(2) // One in header, one in content
    
    // Check welcome message
    expect(screen.getByText(/Welcome! I'm here to help you with questions/)).toBeInTheDocument()
    
    // Check placeholder message
    expect(screen.getByText('Chat functionality coming soon...')).toBeInTheDocument()
    
    // Check input field
    expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
  })

  test('input and send button are disabled', () => {
    render(<AskAI />)

    // Open modal
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)

    const input = screen.getByPlaceholderText('Type your message here...')
    const sendButton = input.nextElementSibling

    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  test('modal applies correct CSS classes in normal mode', () => {
    const { container } = render(<AskAI />)

    // Open modal
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)

    const modalContainer = container.querySelector('.fixed.z-50')
    expect(modalContainer).toHaveClass('bottom-6', 'right-6', 'w-96', 'h-[500px]')
  })

  test('modal applies correct CSS classes in fullscreen mode', () => {
    const { container } = render(<AskAI />)

    // Open modal
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)

    // Toggle fullscreen
    const fullscreenButton = screen.getByLabelText('Enter fullscreen')
    fireEvent.click(fullscreenButton)

    const modalContainer = container.querySelector('.fixed.z-50')
    expect(modalContainer).toHaveClass('inset-0')
  })

  test('renders backdrop in fullscreen mode', () => {
    const { container } = render(<AskAI />)

    // Open modal
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)

    // Should not have backdrop in normal mode
    let backdrop = container.querySelector('.absolute.inset-0.bg-black.bg-opacity-50')
    expect(backdrop).not.toBeInTheDocument()

    // Toggle fullscreen
    const fullscreenButton = screen.getByLabelText('Enter fullscreen')
    fireEvent.click(fullscreenButton)

    // Should have backdrop in fullscreen mode
    backdrop = container.querySelector('.absolute.inset-0.bg-black.bg-opacity-50')
    expect(backdrop).toBeInTheDocument()
  })

  test('closes modal when backdrop is clicked in fullscreen mode', () => {
    const { container } = render(<AskAI />)

    // Open modal
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)

    // Toggle fullscreen
    const fullscreenButton = screen.getByLabelText('Enter fullscreen')
    fireEvent.click(fullscreenButton)

    // Click backdrop
    const backdrop = container.querySelector('.absolute.inset-0.bg-black.bg-opacity-50')
    if (backdrop) {
      fireEvent.click(backdrop)
    }

    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument()
  })

  test('resets fullscreen state when modal is closed', () => {
    render(<AskAI />)

    // Open modal
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)

    // Toggle fullscreen
    const fullscreenButton = screen.getByLabelText('Enter fullscreen')
    fireEvent.click(fullscreenButton)

    // Close modal
    const closeButton = screen.getByLabelText('Close chat')
    fireEvent.click(closeButton)

    // Reopen modal
    fireEvent.click(askAIButton)

    // Should be back to normal mode
    expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument()
  })

  test('has proper accessibility attributes', () => {
    render(<AskAI />)

    // Check floating button accessibility
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    expect(askAIButton).toHaveAttribute('aria-label', 'Open AI Assistant')

    // Open modal and check modal accessibility
    fireEvent.click(askAIButton)

    const closeButton = screen.getByLabelText('Close chat')
    expect(closeButton).toHaveAttribute('aria-label', 'Close chat')

    const fullscreenButton = screen.getByLabelText('Enter fullscreen')
    expect(fullscreenButton).toHaveAttribute('aria-label', 'Enter fullscreen')
  })

  test('renders AI icon in floating button', () => {
    const { container } = render(<AskAI />)

    const askAIButton = screen.getByLabelText('Open AI Assistant')
    const icon = askAIButton.querySelector('svg')
    
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass('w-5', 'h-5')
  })

  test('renders icons in modal header buttons', () => {
    render(<AskAI />)

    // Open modal
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)

    // Check fullscreen button icon
    const fullscreenButton = screen.getByLabelText('Enter fullscreen')
    expect(fullscreenButton.querySelector('svg')).toBeInTheDocument()

    // Check close button icon
    const closeButton = screen.getByLabelText('Close chat')
    expect(closeButton.querySelector('svg')).toBeInTheDocument()
  })

  test('renders send button icon in input area', () => {
    render(<AskAI />)

    // Open modal
    const askAIButton = screen.getByLabelText('Open AI Assistant')
    fireEvent.click(askAIButton)

    const input = screen.getByPlaceholderText('Type your message here...')
    const sendButton = input.nextElementSibling as HTMLElement
    
    expect(sendButton.querySelector('svg')).toBeInTheDocument()
  })
})