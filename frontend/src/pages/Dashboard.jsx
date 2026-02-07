import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
    const [patientCount, setPatientCount] = useState(0);

    useEffect(() => {
        // Fetch real patient count
        api.get('/patients/')
            .then(res => setPatientCount(res.data.length))
            .catch(err => console.error("Failed to fetch patients", err));
    }, []);

    return (
        <div className="dashboard">
            <header className="page-header">
                <h1 className="page-title">Welcome, Dr. Tatsch</h1>
                <p className="page-subtitle">Medical Dashboard</p>
            </header>

            <div className="stats-grid">
                <div className="card stat-card">
                    <div className="stat-icon"><Users size={24} /></div>
                    <div>
                        <h3>Total Patients</h3>
                        <p className="stat-value">{patientCount}</p>
                    </div>
                </div>
            </div>

            <h2 className="section-title">Quick Actions</h2>
            <div className="actions-grid">
                <Link to="/patients/new" className="card action-card">
                    <div className="action-icon-wrapper">
                        <UserPlus size={32} />
                    </div>
                    <h3>New Patient</h3>
                    <p>Register a new patient.</p>
                </Link>

                <Link to="/patients" className="card action-card">
                    <div className="action-icon-wrapper">
                        <Users size={32} />
                    </div>
                    <h3>View Patients</h3>
                    <p>Search and manage patient records.</p>
                </Link>
            </div>

            <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-2xl);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background-color: var(--color-gold-100);
          color: var(--color-gold-600);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-main);
        }

        .section-title {
          font-size: 1.25rem;
          margin-bottom: var(--spacing-md);
          color: var(--color-gold-800);
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--spacing-lg);
        }

        .action-card {
          transition: all var(--transition-normal);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-2xl);
          cursor: pointer;
          border-color: transparent;
        }

        .action-card:hover {
          transform: translateY(-5px);
          border-color: var(--color-gold-200);
          box-shadow: var(--shadow-md);
        }

        .action-icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-full);
          background-color: var(--color-green-50); /* Subtle green for health */
          color: var(--color-green-500);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--spacing-md);
          transition: background-color var(--transition-fast);
        }

        .action-card:hover .action-icon-wrapper {
          background-color: var(--color-gold-100);
          color: var(--color-gold-600);
        }

        .action-card h3 {
          margin-bottom: var(--spacing-xs);
          color: var(--color-text-main);
        }

        .action-card p {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    );
}
