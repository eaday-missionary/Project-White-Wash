import { useState, type JSX } from 'react'

import { getCategoryOptions } from '../utils/resources'

import Card from '../components/ui/Card'
import TextField from '../components/ui/TextField'
import SelectField from '../components/ui/SelectField'

import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import ResourceEditor from '../components/editor/ResourceEditor'
import type { AppContent, SoftwareResource } from '../types/resources'

type SoftwarePageProps = {
  content: AppContent
  onSave: (content: AppContent) => Promise<void>
}

export default function SoftwarePage({ content, onSave }: SoftwarePageProps): JSX.Element {
  const { software } = content
  const [draft, setDraft] = useState<SoftwareResource | null | undefined>(undefined)
  const [tab, setTab] = useState('')
  const categoryOptions = getCategoryOptions(software)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const query = search.trim().toLowerCase()

  const filteredSoftware = software.filter((item) => {
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

      <div className="resource-add">
        <Button onClick={() => setDraft(null)}>Add software</Button>
      </div>
      {draft !== undefined && (
        <ResourceEditor
          key={draft?.id ?? 'new'}
          kind="software"
          item={draft}
          content={content}
          onSave={onSave}
          onClose={() => setDraft(undefined)}
        />
      )}
      <Tabs
        label="Software categories"
        value={tab}
        onChange={setTab}
        items={[...new Set(filteredSoftware.map((item) => item.category))].map((categoryName) => ({
          id: categoryName,
          label: categoryName,
          content: (
            <div className="software-grid">
              {filteredSoftware
                .filter((item) => item.category === categoryName)
                .map((item) => (
                  <Card
                    key={item.id}
                    title={item.name}
                    description={item.description}
                    action={
                      <Button variant="secondary" onClick={() => setDraft(item)}>
                        Edit
                      </Button>
                    }
                  >
                    <span className="resource-category">{item.category}</span>
                    {(item.links ?? [item.url]).map((link, index) => (
                      <a
                        key={index}
                        className="resource-action"
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {index === 0 ? 'Open Website' : `Website ${index + 1}`}
                      </a>
                    ))}
                  </Card>
                ))}
            </div>
          )
        }))}
      />

      {filteredSoftware.length === 0 && (
        <p className="resource-muted">No software matches your search.</p>
      )}
    </div>
  )
}
