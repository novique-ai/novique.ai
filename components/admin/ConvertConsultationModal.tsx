'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Consultation {
  id: string
  name: string
  email: string
  phone?: string
  business_type?: string
  business_size?: string
  challenges?: string
}

interface ConvertConsultationModalProps {
  consultation: Consultation
  isOpen: boolean
  onClose: () => void
}

export function ConvertConsultationModal({
  consultation,
  isOpen,
  onClose,
}: ConvertConsultationModalProps) {
  const router = useRouter()
  const [isConverting, setIsConverting] = useState(false)
  const [isTest, setIsTest] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConvert = async () => {
    setIsConverting(true)
    setError(null)

    try {
      const response = await fetch(`/api/consultations/${consultation.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_test: isTest }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to convert consultation')
      }

      const result = await response.json()

      // Redirect to the new customer page
      router.push(`/admin/customers/${result.customerId}`)
    } catch (err: any) {
      console.error('Conversion error:', err)
      setError(err.message)
      setIsConverting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-2 border border-stroke-0 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="px-6 py-4 border-b border-stroke-0">
          <h2 className="text-xl font-semibold text-ink-0">
            Convert to Customer
          </h2>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-ink-1 mb-4">
            Convert this consultation request into a customer record. This will:
          </p>

          <ul className="list-disc list-inside space-y-2 mb-6 text-sm text-ink-1">
            <li>Create a new customer record in the CRM</li>
            <li>Transfer all consultation details</li>
            <li>Set initial stage to &quot;Proposal Development&quot;</li>
            <li>Create an initial interaction log entry</li>
            <li>Mark this consultation as &quot;converted&quot;</li>
          </ul>

          <div className="bg-surface-1 rounded-lg p-4 space-y-2 text-sm">
            <div>
              <span className="font-medium text-ink-1">Name:</span>{' '}
              <span className="text-ink-0">{consultation.name}</span>
            </div>
            <div>
              <span className="font-medium text-ink-1">Email:</span>{' '}
              <span className="text-ink-0">{consultation.email}</span>
            </div>
            {consultation.phone && (
              <div>
                <span className="font-medium text-ink-1">Phone:</span>{' '}
                <span className="text-ink-0">{consultation.phone}</span>
              </div>
            )}
            {consultation.business_type && (
              <div>
                <span className="font-medium text-ink-1">Business Type:</span>{' '}
                <span className="text-ink-0">{consultation.business_type}</span>
              </div>
            )}
            {consultation.business_size && (
              <div>
                <span className="font-medium text-ink-1">Business Size:</span>{' '}
                <span className="text-ink-0">{consultation.business_size}</span>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={isTest}
              onChange={(e) => setIsTest(e.target.checked)}
              className="h-4 w-4 rounded border-stroke-1 text-aqua accent-[#2be8c2] focus:ring-aqua/60"
            />
            <span className="text-sm text-ink-1">Test Customer</span>
          </label>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/25 rounded-md p-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-surface-1 border-t border-stroke-0 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isConverting}
            className="px-4 py-2 border border-stroke-1 rounded-md text-sm font-medium text-ink-1 bg-surface-2 hover:bg-surface-3/60 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={isConverting}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-semibold text-[#04110d] bg-aqua hover:bg-aqua-bright disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConverting ? 'Converting...' : 'Convert to Customer'}
          </button>
        </div>
      </div>
    </div>
  )
}
