# Testing Infrastructure

This directory contains all tests for the Career Guidance Website project.

## Setup

The testing infrastructure uses:
- **Jest** - Test runner and assertion library
- **React Testing Library** - React component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM elements
- **@testing-library/user-event** - User interaction simulation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── components/     # React component tests
├── lib/           # Utility function tests
├── api/           # API route tests
├── pages/         # Page component tests
└── README.md      # This file
```

## Sample Tests

- `tests/lib/utils.test.ts` - Basic Jest functionality verification
- `tests/components/sample.test.tsx` - React Testing Library setup verification

## Configuration

- `jest.config.js` - Jest configuration with Next.js integration
- `jest.setup.js` - Global test setup and mocks

## Writing Tests

Follow these patterns when writing tests:

### Component Tests
```tsx
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

test('renders component correctly', () => {
  render(<YourComponent />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

### Utility Tests
```ts
describe('utility function', () => {
  test('should return expected result', () => {
    expect(yourUtilityFunction(input)).toBe(expectedOutput)
  })
})
```