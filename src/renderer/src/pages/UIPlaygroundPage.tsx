import { useState, type JSX } from 'react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import TextField from '../components/ui/TextField'
import SelectField from '../components/ui/SelectField'
import Tabs, { type TabItem } from '../components/ui/Tabs'
import Modal from '../components/ui/Modal'

const categories = [
  { value: 'all', label: 'All resources' },
  { value: 'training', label: 'Training' },
  { value: 'software', label: 'Software' }
]

const demoTabs: TabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    content: <p>This is the overview section.</p>
  },
  {
    id: 'details',
    label: 'Details',
    content: <p>Additional information appears here.</p>
  },
  {
    id: 'settings',
    label: 'Settings',
    content: <p>Configuration options could go here.</p>
  }
]

export default function UIPlaygroundPage(): JSX.Element {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedTab, setSelectedTab] = useState('overview')
  const [modalOpen, setModalOpen] = useState(false)

  function resetFields(): void {
    setSearch('')
    setCategory('all')
  }

  function resetEverything(): void {
    resetFields()
    setSelectedTab('overview')
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">DESIGN SYSTEM</p>
        <h1>UI Playground</h1>
        <p className="page-description">
          Test and experiment with reusable Project White Wash interface components.
        </p>
      </header>

      <div className="ui-demo-grid">
        <Card title="Buttons" description="Different styles for different actions.">
          <div className="ui-inline-actions">
            <Button onClick={() => setModalOpen(true)}>Open Dialog</Button>

            <Button variant="secondary" onClick={resetFields}>
              Reset Fields
            </Button>

            <Button variant="danger" onClick={resetEverything}>
              Reset Everything
            </Button>

            <Button disabled>Disabled</Button>
          </div>
        </Card>

        <Card title="Inputs & Dropdowns" description="Interactive form controls.">
          <TextField
            label="Search resources"
            type="search"
            placeholder="Type something..."
            hint="This is a demonstration search field."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <SelectField
            label="Resource category"
            options={categories}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />

          <p className="ui-preview-text">
            Search: {search || 'None'}
            {' | '}
            Category: {category}
          </p>
        </Card>

        <Card title="Tabs" description="Switch between related content.">
          <Tabs
            label="Demo sections"
            items={demoTabs}
            value={selectedTab}
            onChange={setSelectedTab}
          />
        </Card>

        <Card
          title="Reusable Containers"
          description="Consistent layouts throughout the application."
        >
          <p className="ui-preview-text">
            This entire section uses the reusable Card component. We can place buttons, inputs,
            tables, or other components inside these cards.
          </p>
        </Card>
      </div>

      <Modal open={modalOpen} title="Your dialog is working!" onClose={() => setModalOpen(false)}>
        <p>
          This is a reusable modal dialog. We can use it for confirmations, messages, and other
          interactions.
        </p>

        <Button onClick={() => setModalOpen(false)}>Got it!</Button>
      </Modal>
    </div>
  )
}
