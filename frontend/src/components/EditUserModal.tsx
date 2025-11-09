import React, { useState } from 'react'
import { updateUser, updateUserCredits, type User } from '../services/adminService'
import './EditUserModal.css'

interface EditUserModalProps {
  user: User
  onClose: (updated: boolean) => void
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    age: user.age || 0,
    ageGroup: user.ageGroup || '',
    subscriptionStatus: user.subscriptionStatus,
    isActive: user.isActive,
  })

  const [creditAction, setCreditAction] = useState<'set' | 'add' | 'subtract'>('set')
  const [creditAmount, setCreditAmount] = useState(user.aiCredits)
  const [activeTab, setActiveTab] = useState<'details' | 'credits'>('details')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
          ? parseInt(value) || 0
          : value,
    }))
  }

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await updateUser(user.id, formData)
      setSuccess('User details updated successfully!')
      setTimeout(() => onClose(true), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCredits = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await updateUserCredits(user.id, {
        aiCredits: creditAmount,
        action: creditAction,
      })
      setSuccess('Credits updated successfully!')
      setTimeout(() => onClose(true), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to update credits')
    } finally {
      setLoading(false)
    }
  }

  const calculateNewCredits = (): number => {
    if (creditAction === 'set') return creditAmount
    if (creditAction === 'add') return user.aiCredits + creditAmount
    if (creditAction === 'subtract') return Math.max(0, user.aiCredits - creditAmount)
    return user.aiCredits
  }

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit User</h2>
          <button className="close-btn" onClick={() => onClose(false)}>
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            User Details
          </button>
          <button
            className={`modal-tab ${activeTab === 'credits' ? 'active' : ''}`}
            onClick={() => setActiveTab('credits')}
          >
            AI Credits
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {activeTab === 'details' && (
            <form onSubmit={handleUpdateDetails}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="age">Age</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="3"
                    max="100"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ageGroup">Age Group</label>
                  <select
                    id="ageGroup"
                    name="ageGroup"
                    value={formData.ageGroup}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="">Select Age Group</option>
                    <option value="3-5">3-5</option>
                    <option value="5-7">5-7</option>
                    <option value="7-11">7-11</option>
                    <option value="11-14">11-14</option>
                    <option value="14-16">14-16</option>
                    <option value="16+">16+</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="subscriptionStatus">Subscription Status</label>
                  <select
                    id="subscriptionStatus"
                    name="subscriptionStatus"
                    value={formData.subscriptionStatus}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="info-message">
                <p><strong>Note:</strong> To manage AI Credits, please use the "AI Credits" tab above.</p>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <span>Active Account</span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'credits' && (
            <form onSubmit={handleUpdateCredits}>
              <div className="credits-info">
                <h3>Current Credits</h3>
                <p className="current-credits">{user.aiCredits}</p>
              </div>

              <div className="form-group">
                <label htmlFor="creditAction">Action</label>
                <select
                  id="creditAction"
                  value={creditAction}
                  onChange={(e) =>
                    setCreditAction(e.target.value as 'set' | 'add' | 'subtract')
                  }
                  disabled={loading}
                >
                  <option value="set">Set to specific amount</option>
                  <option value="add">Add credits</option>
                  <option value="subtract">Subtract credits</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="creditAmount">Amount</label>
                <input
                  type="number"
                  id="creditAmount"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                  min="0"
                  required
                  disabled={loading}
                />
              </div>

              <div className="credits-preview">
                <strong>New Balance:</strong>{' '}
                <span className="preview-amount">{calculateNewCredits()}</span>
              </div>

              <div className="quick-actions">
                <p>Quick Actions:</p>
                <div className="quick-action-buttons">
                  <button
                    type="button"
                    onClick={() => {
                      setCreditAction('add')
                      setCreditAmount(1000)
                    }}
                    className="quick-btn"
                    disabled={loading}
                  >
                    +1000
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreditAction('add')
                      setCreditAmount(5000)
                    }}
                    className="quick-btn"
                    disabled={loading}
                  >
                    +5000
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreditAction('set')
                      setCreditAmount(10000)
                    }}
                    className="quick-btn"
                    disabled={loading}
                  >
                    Set 10k
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreditAction('set')
                      setCreditAmount(0)
                    }}
                    className="quick-btn danger"
                    disabled={loading}
                  >
                    Reset to 0
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Credits'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditUserModal
