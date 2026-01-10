/**
 * Primitive Components Tests
 * Tests for Button, Badge, Spinner, Card, Input, Tabs components
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../../../src/renderer/components/primitives/Button/Button'
import { Badge } from '../../../src/renderer/components/primitives/Badge/Badge'
import { Spinner } from '../../../src/renderer/components/primitives/Spinner/Spinner'
import { Card } from '../../../src/renderer/components/primitives/Card/Card'
import { Input } from '../../../src/renderer/components/primitives/Input/Input'
import { Tabs } from '../../../src/renderer/components/primitives/Tabs/Tabs'

describe('Button', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('should render with default variant (primary)', () => {
    render(<Button>Primary</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-amber-500')
  })

  it('should render secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-[#f5f5f4]')
  })

  it('should render ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-transparent')
  })

  it('should render destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-red-50')
  })

  it('should handle different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button').className).toContain('text-xs')

    rerender(<Button size="md">Medium</Button>)
    expect(screen.getByRole('button').className).toContain('text-sm')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button').className).toContain('text-base')
  })

  it('should show spinner when loading', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('should be disabled when loading', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should render icon', () => {
    const icon = <span data-testid="icon">+</span>
    render(<Button icon={icon}>Add</Button>)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('should render icon only button', () => {
    const icon = <span data-testid="icon">+</span>
    render(<Button icon={icon} iconOnly />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('should call onClick handler', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Button</Button>)
    expect(screen.getByRole('button').className).toContain('custom-class')
  })
})

describe('Badge', () => {
  it('should render children', () => {
    render(<Badge>Status</Badge>)
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('should render default variant', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge.className).toContain('bg-gray-100')
  })

  it('should render success variant', () => {
    render(<Badge variant="success">Success</Badge>)
    const badge = screen.getByText('Success')
    expect(badge.className).toContain('bg-green-50')
  })

  it('should render warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>)
    const badge = screen.getByText('Warning')
    expect(badge.className).toContain('bg-amber-50')
  })

  it('should render error variant', () => {
    render(<Badge variant="error">Error</Badge>)
    const badge = screen.getByText('Error')
    expect(badge.className).toContain('bg-red-50')
  })

  it('should render info variant', () => {
    render(<Badge variant="info">Info</Badge>)
    const badge = screen.getByText('Info')
    expect(badge.className).toContain('bg-blue-50')
  })

  it('should render pill shape by default', () => {
    render(<Badge>Pill</Badge>)
    const badge = screen.getByText('Pill')
    expect(badge.className).toContain('rounded-full')
  })

  it('should render non-pill shape', () => {
    render(<Badge pill={false}>Square</Badge>)
    const badge = screen.getByText('Square')
    expect(badge.className).toContain('rounded-md')
  })

  it('should handle different sizes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>)
    expect(screen.getByText('Small').className).toContain('px-2')

    rerender(<Badge size="md">Medium</Badge>)
    expect(screen.getByText('Medium').className).toContain('px-2.5')
  })

  it('should apply custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>)
    expect(screen.getByText('Custom').className).toContain('custom-badge')
  })
})

describe('Spinner', () => {
  it('should render with aria-label', () => {
    render(<Spinner />)
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('should render default size (md)', () => {
    render(<Spinner />)
    const spinner = screen.getByLabelText('Loading')
    expect(spinner.getAttribute('class')).toContain('w-5')
  })

  it('should render small size', () => {
    render(<Spinner size="sm" />)
    const spinner = screen.getByLabelText('Loading')
    expect(spinner.getAttribute('class')).toContain('w-4')
  })

  it('should render large size', () => {
    render(<Spinner size="lg" />)
    const spinner = screen.getByLabelText('Loading')
    expect(spinner.getAttribute('class')).toContain('w-6')
  })

  it('should render default color (amber)', () => {
    render(<Spinner />)
    const spinner = screen.getByLabelText('Loading')
    expect(spinner.getAttribute('class')).toContain('text-amber-500')
  })

  it('should render white color', () => {
    render(<Spinner color="white" />)
    const spinner = screen.getByLabelText('Loading')
    expect(spinner.getAttribute('class')).toContain('text-white')
  })

  it('should render stone color', () => {
    render(<Spinner color="stone" />)
    const spinner = screen.getByLabelText('Loading')
    expect(spinner.getAttribute('class')).toContain('text-stone-500')
  })

  it('should have animate-spin class', () => {
    render(<Spinner />)
    const spinner = screen.getByLabelText('Loading')
    expect(spinner.getAttribute('class')).toContain('animate-spin')
  })

  it('should apply custom className', () => {
    render(<Spinner className="custom-spinner" />)
    const spinner = screen.getByLabelText('Loading')
    expect(spinner.getAttribute('class')).toContain('custom-spinner')
  })
})

describe('Card', () => {
  it('should render children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('should render with header title', () => {
    render(<Card header={{ title: 'Header Title' }}>Content</Card>)
    expect(screen.getByText('Header Title')).toBeInTheDocument()
  })

  it('should render with header subtitle', () => {
    render(
      <Card header={{ title: 'Title', subtitle: 'Subtitle' }}>Content</Card>
    )
    expect(screen.getByText('Subtitle')).toBeInTheDocument()
  })

  it('should render with header actions', () => {
    render(
      <Card header={{ title: 'Title', actions: <button>Action</button> }}>
        Content
      </Card>
    )
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<Card className="custom-card">Card</Card>)
    expect(container.firstChild?.className).toContain('custom-card')
  })

  it('should be clickable when onClick provided', () => {
    const onClick = vi.fn()
    render(<Card onClick={onClick}>Clickable</Card>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })

  it('should have hover styles when hover prop is true', () => {
    const { container } = render(<Card hover>Hoverable</Card>)
    expect(container.firstChild?.className).toContain('hover:shadow-md')
  })

  it('should handle different padding sizes', () => {
    const { container, rerender } = render(<Card padding="none">No padding</Card>)
    // Default padding
    rerender(<Card padding="sm">Small padding</Card>)
    expect(container.querySelector('.p-3')).toBeInTheDocument()

    rerender(<Card padding="lg">Large padding</Card>)
    expect(container.querySelector('.p-6')).toBeInTheDocument()
  })
})

describe('Input', () => {
  it('should render input element', () => {
    render(<Input value="" onChange={() => {}} placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('should render with label', () => {
    render(<Input value="" onChange={() => {}} label="Name" />)
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('should render with error message', () => {
    render(<Input value="" onChange={() => {}} error="Required field" />)
    expect(screen.getByText('Required field')).toBeInTheDocument()
  })

  it('should have error styling when error is present', () => {
    render(<Input value="" onChange={() => {}} error="Error" />)
    const input = screen.getByRole('textbox')
    expect(input.className).toContain('border-red-300')
  })

  it('should handle value changes', () => {
    const onChange = vi.fn()
    render(<Input value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } })
    expect(onChange).toHaveBeenCalledWith('test')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input value="" onChange={() => {}} disabled placeholder="Disabled" />)
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled()
  })

  it('should render with icon', () => {
    const icon = <span data-testid="input-icon">@</span>
    render(<Input value="" onChange={() => {}} icon={icon} />)
    expect(screen.getByTestId('input-icon')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<Input value="" onChange={() => {}} className="custom-input" />)
    expect(screen.getByRole('textbox').className).toContain('custom-input')
  })
})

describe('Tabs', () => {
  const tabs = [
    { key: 'tab1', label: 'Tab 1' },
    { key: 'tab2', label: 'Tab 2' },
    { key: 'tab3', label: 'Tab 3' },
  ]

  it('should render all tabs', () => {
    render(<Tabs tabs={tabs} activeKey="tab1" onChange={() => {}} />)
    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
    expect(screen.getByText('Tab 3')).toBeInTheDocument()
  })

  it('should have correct aria-selected for active tab', () => {
    render(<Tabs tabs={tabs} activeKey="tab2" onChange={() => {}} />)
    const activeTab = screen.getByRole('tab', { name: 'Tab 2' })
    expect(activeTab).toHaveAttribute('aria-selected', 'true')
  })

  it('should call onChange when tab clicked', () => {
    const onChange = vi.fn()
    render(<Tabs tabs={tabs} activeKey="tab1" onChange={onChange} />)
    fireEvent.click(screen.getByText('Tab 2'))
    expect(onChange).toHaveBeenCalledWith('tab2')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <Tabs tabs={tabs} activeKey="tab1" onChange={() => {}} className="custom-tabs" />
    )
    expect(container.firstChild?.className).toContain('custom-tabs')
  })

  it('should render tabs with icons', () => {
    const tabsWithIcons = [
      { key: 'tab1', label: 'Tab 1', icon: <span data-testid="icon1">*</span> },
    ]
    render(<Tabs tabs={tabsWithIcons} activeKey="tab1" onChange={() => {}} />)
    expect(screen.getByTestId('icon1')).toBeInTheDocument()
  })
})
