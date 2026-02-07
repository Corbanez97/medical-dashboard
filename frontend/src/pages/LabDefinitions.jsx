import { useState, useEffect } from 'react';
import { Plus, FlaskConical, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function LabDefinitions() {
    const [definitions, setDefinitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newDef, setNewDef] = useState({
        name: '',
        category: '',
        unit: '',
        ref_min_male: '',
        ref_max_male: '',
        ref_min_female: '',
        ref_max_female: ''
    });

    useEffect(() => {
        fetchDefinitions();
    }, []);

    const fetchDefinitions = async () => {
        try {
            const response = await api.get('/lab-definitions/');
            setDefinitions(response.data);
        } catch (error) {
            console.error('Error fetching definitions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/lab-definitions/', newDef);
            setNewDef({
                name: '',
                category: '',
                unit: '',
                ref_min_male: '',
                ref_max_male: '',
                ref_min_female: '',
                ref_max_female: ''
            });
            setIsCreating(false);
            fetchDefinitions();
        } catch (error) {
            console.error('Error creating definition:', error);
            alert('Failed to create definition.');
        }
    };

    return (
        <div className="lab-definitions-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Lab Test Definitions</h1>
                    <p className="page-subtitle">Manage available laboratory tests and reference ranges.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setIsCreating(!isCreating)}
                >
                    <Plus size={20} />
                    {isCreating ? 'Cancel' : 'New Definition'}
                </button>
            </header>

            {isCreating && (
                <div className="card form-card mb-xl">
                    <h3 className="card-title">Add New Test Definition</h3>
                    <form onSubmit={handleCreate} className="definition-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Test Name</label>
                                <input
                                    className="input"
                                    required
                                    value={newDef.name}
                                    onChange={e => setNewDef({ ...newDef, name: e.target.value })}
                                    placeholder="e.g. Vitamin D"
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <input
                                    className="input"
                                    required
                                    value={newDef.category}
                                    onChange={e => setNewDef({ ...newDef, category: e.target.value })}
                                    placeholder="e.g. Vitamins"
                                />
                            </div>
                            <div className="form-group">
                                <label>Unit</label>
                                <input
                                    className="input"
                                    required
                                    value={newDef.unit}
                                    onChange={e => setNewDef({ ...newDef, unit: e.target.value })}
                                    placeholder="e.g. ng/mL"
                                />
                            </div>
                        </div>

                        <h4 className="section-subtitle">Reference Ranges (Optional)</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Min Male</label>
                                <input type="number" step="0.01" className="input" value={newDef.ref_min_male} onChange={e => setNewDef({ ...newDef, ref_min_male: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Max Male</label>
                                <input type="number" step="0.01" className="input" value={newDef.ref_max_male} onChange={e => setNewDef({ ...newDef, ref_max_male: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Min Female</label>
                                <input type="number" step="0.01" className="input" value={newDef.ref_min_female} onChange={e => setNewDef({ ...newDef, ref_min_female: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Max Female</label>
                                <input type="number" step="0.01" className="input" value={newDef.ref_max_female} onChange={e => setNewDef({ ...newDef, ref_max_female: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">Save Definition</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Unit</th>
                                <th>Male Range</th>
                                <th>Female Range</th>
                            </tr>
                        </thead>
                        <tbody>
                            {definitions.map(def => (
                                <tr key={def.id}>
                                    <td className="font-medium">
                                        <div className="flex-center gap-sm">
                                            <FlaskConical size={16} className="text-primary" />
                                            {def.name}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge">{def.category}</span>
                                    </td>
                                    <td>{def.unit}</td>
                                    <td>{def.ref_min_male} - {def.ref_max_male}</td>
                                    <td>{def.ref_min_female} - {def.ref_max_female}</td>
                                </tr>
                            ))}
                            {definitions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="text-center py-lg text-secondary">
                                        No definitions found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .mb-xl { margin-bottom: var(--spacing-xl); }
                .section-subtitle { 
                    font-size: 0.85rem; 
                    text-transform: uppercase; 
                    letter-spacing: 0.05em; 
                    color: var(--color-text-secondary);
                    margin: var(--spacing-md) 0 var(--spacing-sm);
                }
                .badge {
                    background-color: var(--color-gray-100);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    color: var(--color-text-secondary);
                }
                .flex-center { display: flex; align-items: center; }
                .gap-sm { gap: var(--spacing-sm); }
                .text-primary { color: var(--color-primary); }
                .text-secondary { color: var(--color-text-secondary); }
                .font-medium { font-weight: 500; }
                .text-center { text-align: center; }
                .py-lg { padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg); }
            `}</style>
        </div>
    );
}
