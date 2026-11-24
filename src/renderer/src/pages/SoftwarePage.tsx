import { useState, type JSX } from 'react'

import Card from '../components/ui/Card'
import TextField from '../components/ui/TextField'
import SelectField from '../components/ui/SelectField'

import type { SoftwareResource } from '../types/resources'

type SoftwarePageProps = {
  software: SoftwareResource[]
}

export default function SoftwarePage({ software }: SoftwarePageProps): JSX.Element {
  const categoryOptions = [
    { value: 'all', label: 'All categories' },
    ...Array.from(new Set(software.map((item) => item.category))).map((category) => ({
      value: category,
      label: category
    }))
  ]

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  // Keep your existing filtering logic and JSX below.

  const filteredSoftware = software.filter((item) => {
    const query = search.trim().toLowerCase()

    const matchesCategory = category === 'all' || item.category === category

    const matchesSearch =
      item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)

    return matchesCategory && matchesSearch
  })

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">SOFTWARE RESOURCES</p>
        <h1>Useful Software</h1>
        <p className="page-description">Find and download Software to help fulfill office tasks</p>
      </header>

      <div className="resource-filters">
        <TextField
          label="Search software"
          type="search"
          placeholder="Search for an application..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <SelectField
          label="Category"
          options={categoryOptions}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
      </div>

      <div className="software-grid">
        {filteredSoftware.map((item) => (
          <Card key={item.id} title={item.name} description={item.description}>
            <span className="resource-category">{item.category}</span>

            <a
              className="resource-action"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Website ↗
            </a>
          </Card>
        ))}
      </div>

      {filteredSoftware.length === 0 && (
        <p className="resource-muted">No software matches your search.</p>
      )}
    </div>
  )
}
