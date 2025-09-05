/**
 * InfoBox Component Tests
 * Tests the InfoBox component including rendering, click interactions, and accessibility
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import InfoBox from '@/components/ui/InfoBox'

describe('InfoBox Component', () => {
  const defaultProps = {
    title: 'Test Title',
    value: '42',
    color: 'text-blue-400',
  }

  test('renders InfoBox with basic props', () => {
    render(<InfoBox {...defaultProps} />)

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  test('applies correct color class to value', () => {
    render(<InfoBox {...defaultProps} />)

    const valueElement = screen.getByText('42')
    expect(valueElement).toHaveClass('text-blue-400')
  })

  test('renders with custom icon', () => {
    const icon = <svg data-testid="custom-icon" />
    render(<InfoBox {...defaultProps} icon={icon} />)

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  test('renders without icon when not provided', () => {
    render(<InfoBox {...defaultProps} />)

    // Should not have any icon container
    const iconContainer = screen.queryByTestId('custom-icon')
    expect(iconContainer).not.toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(
      <InfoBox {...defaultProps} className="custom-class" />
    )

    const infoBox = container.firstChild
    expect(infoBox).toHaveClass('custom-class')
  })

  test('is clickable when onClick is provided', () => {
    const onClick = jest.fn()
    render(<InfoBox {...defaultProps} onClick={onClick} />)

    const infoBox = screen.getByRole('button')
    expect(infoBox).toBeInTheDocument()
    expect(infoBox).toHaveAttribute('tabIndex', '0')
  })

  test('is not clickable when onClick is not provided', () => {
    render(<InfoBox {...defaultProps} />)

    const infoBox = screen.queryByRole('button')
    expect(infoBox).not.toBeInTheDocument()
  })

  test('calls onClick when clicked', () => {
    const onClick = jest.fn()
    render(<InfoBox {...defaultProps} onClick={onClick} />)

    const infoBox = screen.getByRole('button')
    fireEvent.click(infoBox)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('calls onClick when Enter key is pressed', () => {
    const onClick = jest.fn()
    render(<InfoBox {...defaultProps} onClick={onClick} />)

    const infoBox = screen.getByRole('button')
    fireEvent.keyDown(infoBox, { key: 'Enter' })

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('calls onClick when Space key is pressed', () => {
    const onClick = jest.fn()
    render(<InfoBox {...defaultProps} onClick={onClick} />)

    const infoBox = screen.getByRole('button')
    fireEvent.keyDown(infoBox, { key: ' ' })

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('does not call onClick for other keys', () => {
    const onClick = jest.fn()
    render(<InfoBox {...defaultProps} onClick={onClick} />)

    const infoBox = screen.getByRole('button')
    fireEvent.keyDown(infoBox, { key: 'Tab' })
    fireEvent.keyDown(infoBox, { key: 'Escape' })

    expect(onClick).not.toHaveBeenCalled()
  })

  test('shows "Click to view details" text when clickable', () => {
    const onClick = jest.fn()
    render(<InfoBox {...defaultProps} onClick={onClick} />)

    expect(screen.getByText('Click to view details')).toBeInTheDocument()
  })

  test('does not show "Click to view details" text when not clickable', () => {
    render(<InfoBox {...defaultProps} />)

    expect(screen.queryByText('Click to view details')).not.toBeInTheDocument()
  })

  test('applies hover styles when clickable', () => {
    const onClick = jest.fn()
    const { container } = render(<InfoBox {...defaultProps} onClick={onClick} />)

    const infoBox = container.firstChild
    expect(infoBox).toHaveClass('cursor-pointer')
    expect(infoBox).toHaveClass('hover:shadow-glass-lg')
    expect(infoBox).toHaveClass('hover:bg-glass-dark')
    expect(infoBox).toHaveClass('transform')
    expect(infoBox).toHaveClass('hover:scale-105')
  })

  test('does not apply hover styles when not clickable', () => {
    const { container } = render(<InfoBox {...defaultProps} />)

    const infoBox = container.firstChild
    expect(infoBox).not.toHaveClass('cursor-pointer')
    expect(infoBox).not.toHaveClass('hover:shadow-glass-lg')
    expect(infoBox).not.toHaveClass('hover:bg-glass-dark')
    expect(infoBox).not.toHaveClass('transform')
    expect(infoBox).not.toHaveClass('hover:scale-105')
  })

  test('has proper glass morphism styling', () => {
    const { container } = render(<InfoBox {...defaultProps} />)

    const infoBox = container.firstChild
    expect(infoBox).toHaveClass('bg-glass')
    expect(infoBox).toHaveClass('backdrop-blur-md')
    expect(infoBox).toHaveClass('rounded-xl')
    expect(infoBox).toHaveClass('border')
    expect(infoBox).toHaveClass('border-glass')
    expect(infoBox).toHaveClass('shadow-glass')
  })

  test('renders with different color values', () => {
    const colors = ['text-red-400', 'text-green-500', 'text-purple-600']
    
    colors.forEach((color, index) => {
      const { unmount } = render(<InfoBox {...defaultProps} color={color} />)
      
      const valueElement = screen.getByText('42')
      expect(valueElement).toHaveClass(color)
      
      unmount() // Clean up between renders
    })
  })

  test('handles long titles and values gracefully', () => {
    const longTitle = 'This is a very long title that might wrap to multiple lines'
    const longValue = '1,234,567,890'
    
    render(
      <InfoBox 
        {...defaultProps} 
        title={longTitle}
        value={longValue}
      />
    )

    expect(screen.getByText(longTitle)).toBeInTheDocument()
    expect(screen.getByText(longValue)).toBeInTheDocument()
  })

  test('maintains accessibility standards', () => {
    const onClick = jest.fn()
    render(<InfoBox {...defaultProps} onClick={onClick} />)

    const infoBox = screen.getByRole('button')
    
    // Should be focusable
    expect(infoBox).toHaveAttribute('tabIndex', '0')
    
    // Should have proper role
    expect(infoBox).toHaveAttribute('role', 'button')
  })

  test('renders multiple InfoBoxes independently', () => {
    render(
      <div>
        <InfoBox title="Box 1" value="10" color="text-red-400" />
        <InfoBox title="Box 2" value="20" color="text-blue-400" onClick={() => {}} />
        <InfoBox title="Box 3" value="30" color="text-green-400" />
      </div>
    )

    expect(screen.getByText('Box 1')).toBeInTheDocument()
    expect(screen.getByText('Box 2')).toBeInTheDocument()
    expect(screen.getByText('Box 3')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()

    // Only Box 2 should be clickable
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})