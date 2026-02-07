import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function NewPatient() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        date_of_birth: '',
        gender: 'Male',
        height_cm: ''
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/patients/', formData);
            navigate('/patients');
        } catch (error) {
            console.error('Error creating patient:', error);
            alert('Failed to create patient. Please check the console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="new-patient-page">
            <header className="page-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={20} /> Back
                </button>
                <h1 className="page-title">New Patient</h1>
            </header>

            <div className="card form-card">
                <form onSubmit={handleSubmit} className="patient-form">
                    <div className="form-group">
                        <label htmlFor="full_name">Full Name</label>
                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            className="input"
                            placeholder="e.g. John Doe"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="date_of_birth">Date of Birth</label>
                            <input
                                type="date"
                                id="date_of_birth"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                required
                                className="input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="gender">Gender</label>
                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="height_cm">Height (cm)</label>
                        <input
                            type="number"
                            step="0.01"
                            id="height_cm"
                            name="height_cm"
                            value={formData.height_cm}
                            onChange={handleChange}
                            required
                            className="input"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate('/patients')} className="btn btn-outline">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Patient'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
        .back-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          background: none;
          border: none;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-sm);
          padding: 0;
          font-weight: 500;
        }

        .back-btn:hover {
          color: var(--color-primary);
        }

        .form-card {
          max-width: 600px;
          margin: 0 auto;
        }

        .patient-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .form-group label {
          font-weight: 500;
          color: var(--color-text-main);
          font-size: 0.9rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--color-border);
        }
      `}</style>
        </div>
    );
}
