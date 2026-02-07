import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, ChevronRight } from 'lucide-react';
import api from '../services/api';

export default function Patients() {
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = true;

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await api.get('/patients/');
            setPatients(response.data);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this patient?')) {
            try {
                await api.delete(`/patients/${id}`);
                setPatients(patients.filter(p => p.id !== id));
            } catch (error) {
                console.error('Error deleting patient:', error);
            }
        }
    };

    const filteredPatients = patients.filter(patient =>
        patient.full_name && patient.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="patients-page">
            <header className="page-header">
                <div className="header-content">
                    <div>
                        <h1 className="page-title">Patients</h1>
                        <p className="page-subtitle">Manage your patient records.</p>
                    </div>
                    <Link to="/patients/new" className="btn btn-primary">
                        <Plus size={20} />
                        Add Patient
                    </Link>
                </div>
            </header>

            <div className="search-bar">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Search patients by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input search-input"
                />
            </div>

            {loading ? (
                <p>Loading patients...</p>
            ) : (
                <div className="patients-grid">
                    {filteredPatients.map(patient => (
                        <div key={patient.id} className="card patient-card">
                            <div className="patient-info">
                                <h3>{patient.full_name}</h3>
                                <div className="patient-meta">
                                    <span>DOB: {patient.date_of_birth}</span>
                                    <span>Height: {patient.height_cm}cm</span>
                                    <span>{patient.gender}</span>
                                </div>
                            </div>
                            <div className="patient-actions">
                                <Link to={`/patients/${patient.id}`} className="btn-icon" title="View Details">
                                    <ChevronRight size={20} />
                                </Link>
                                <button onClick={() => handleDelete(patient.id)} className="btn-icon delete-btn" title="Delete">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredPatients.length === 0 && (
                        <div className="no-results">
                            <p>No patients found.</p>
                        </div>
                    )}
                </div>
            )}

            <style>{`
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .search-bar {
          position: relative;
          margin-bottom: var(--spacing-xl);
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-secondary);
        }

        .search-input {
          padding-left: 40px;
        }

        .patients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-md);
        }

        .patient-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: transform var(--transition-fast);
        }
        
        .patient-card:hover {
          transform: translateY(-2px);
          border-color: var(--color-primary);
        }

        .patient-info h3 {
          font-size: 1.125rem;
          margin-bottom: var(--spacing-xs);
          color: var(--color-text-main);
        }

        .patient-meta {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-md);
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .patient-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .btn-icon {
          background: none;
          border: none;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon:hover {
          background-color: var(--color-gray-100);
          color: var(--color-primary);
        }

        .delete-btn:hover {
          color: #ef4444; /* Red for delete */
          background-color: #fee2e2;
        }

        .no-results {
          grid-column: 1 / -1;
          text-align: center;
          padding: var(--spacing-2xl);
          color: var(--color-text-secondary);
        }
      `}</style>
        </div>
    );
}
