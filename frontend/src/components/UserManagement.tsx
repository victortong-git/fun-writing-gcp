import React, { useState, useEffect } from 'react'
import {
  getUsers,
  deleteUser,
  type User,
  type PaginationParams,
} from '../services/adminService'
import EditUserModal from './EditUserModal'
import './UserManagement.css'

interface UserManagementProps {
  onRefresh?: () => void
}

const UserManagement: React.FC<UserManagementProps> = ({ onRefresh }) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [currentPage, filterStatus])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')

      const params: PaginationParams = {
        page: currentPage,
        limit: 20,
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      if (filterStatus) {
        params.subscriptionStatus = filterStatus
      }

      const response = await getUsers(params)
      setUsers(response.data.users || [])
      setTotalPages(response.data.pagination.totalPages)
      setTotalUsers(response.data.pagination.total)
    } catch (err: any) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadUsers()
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      await deleteUser(userId)
      loadUsers()
      if (onRefresh) onRefresh()
    } catch (err: any) {
      alert(err.message || 'Failed to delete user')
    }
  }

  const handleModalClose = (updated: boolean) => {
    setShowEditModal(false)
    setSelectedUser(null)
    if (updated) {
      loadUsers()
      if (onRefresh) onRefresh()
    }
  }

  return (
    <div className="user-management">
      {/* Search and Filters */}
      <div className="user-management-header">
        <h2>User Management</h2>
        <p className="user-count">Total Users: {totalUsers}</p>
      </div>

      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            Search
          </button>
        </form>

        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setCurrentPage(1)
            }}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button onClick={loadUsers} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="users-table-container">
            {users.length === 0 ? (
              <div className="no-users">
                <p>No users found</p>
              </div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>AI Credits</th>
                    <th>Level</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Age Group</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name || 'N/A'}</td>
                      <td>{user.email}</td>
                      <td className="credits-cell">{user.aiCredits}</td>
                      <td>{user.level}</td>
                      <td>{user.totalScore}</td>
                      <td>
                        <span className={`status-badge ${user.subscriptionStatus}`}>
                          {user.subscriptionStatus}
                        </span>
                      </td>
                      <td>{user.ageGroup || 'N/A'}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="edit-btn"
                            title="Edit user"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="delete-btn"
                            title="Delete user"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>

              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

export default UserManagement
