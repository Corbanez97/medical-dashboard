import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Activity, FileText, Scale, Thermometer,
  Plus, Trash2, Database, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../services/api';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // Data States
  const [patient, setPatient] = useState(null);
  const [labs, setLabs] = useState([]);
  const [bio, setBio] = useState([]);
  const [anthro, setAnthro] = useState([]);
  const [subjective, setSubjective] = useState([]);
  const [labDefs, setLabDefs] = useState([]);

  // Raw Data States (for the "Table View of GET Requests")
  const [rawResponses, setRawResponses] = useState({});

  // Form States
  const [patientForm, setPatientForm] = useState({});
  const [newLab, setNewLab] = useState({ test_definition_id: '', value: '', collection_date: '', unit: '' });
  const [newBio, setNewBio] = useState({ date: '', weight_kg: '', bmi: '', body_fat_percent: '', fat_mass_kg: '', muscle_mass_kg: '' });
  const [newAnthro, setNewAnthro] = useState({ date: '', waist_cm: '', abdomen_cm: '', hips_cm: '' });
  const [newSubj, setNewSubj] = useState({ date: '', metric_name: 'Energy', score: 5, notes: '' });

  useEffect(() => {
    fetchAllData();
  }, [id]);

  const fetchAllData = async () => {
    try {
      const endpoints = {
        patient: `/patients/${id}`,
        labs: `/patients/${id}/lab-results/`,
        bio: `/patients/${id}/bioimpedance/`,
        anthro: `/patients/${id}/anthropometry/`,
        subjective: `/patients/${id}/subjective/`,
        definitions: `/lab-definitions/`
      };

      const responses = await Promise.all(
        Object.entries(endpoints).map(async ([key, url]) => {
          const res = await api.get(url);
          return { key, data: res.data };
        })
      );

      const dataMap = responses.reduce((acc, curr) => {
        acc[curr.key] = curr.data;
        return acc;
      }, {});

      setPatient(dataMap.patient);
      setPatientForm(dataMap.patient);
      setLabs(dataMap.labs);
      setBio(dataMap.bio);
      setAnthro(dataMap.anthro);
      setSubjective(dataMap.subjective);
      setLabDefs(dataMap.definitions);

      // Store raw responses for the "Raw Data" tab
      setRawResponses(dataMap);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePatient = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/patients/${id}`, patientForm);
      alert('Patient updated!');
      fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Failed to update.');
    }
  };

  const addLab = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lab-results/', { ...newLab, patient_id: id });
      setNewLab({ test_definition_id: '', value: '', collection_date: '', unit: '' });
      fetchAllData();
    } catch (err) { alert('Failed to add lab result'); }
  };

  const addBio = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bioimpedance/', { ...newBio, patient_id: id });
      setNewBio({ date: '', weight_kg: '', bmi: '', body_fat_percent: '', fat_mass_kg: '', muscle_mass_kg: '' });
      fetchAllData();
    } catch (err) { alert('Failed to add bioimpedance'); }
  };

  const addAnthro = async (e) => {
    e.preventDefault();
    try {
      await api.post('/anthropometry/', { ...newAnthro, patient_id: id });
      setNewAnthro({ date: '', waist_cm: '', abdomen_cm: '', hips_cm: '' });
      fetchAllData();
    } catch (err) { alert('Failed to add anthropometry'); }
  };

  const addSubj = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subjective/', { ...newSubj, patient_id: id });
      setNewSubj({ date: '', metric_name: 'Energy', score: 5, notes: '' });
      fetchAllData();
    } catch (err) { alert('Failed to add subjective entry'); }
  };

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!patient) return <div className="error-state">Patient not found</div>;

  const tabs = [
    { id: 'info', label: 'Info', icon: <FileText size={18} /> },
    { id: 'labs', label: 'Labs', icon: <FlaskConical size={18} /> },
    { id: 'bio', label: 'Bioimpedance', icon: <Scale size={18} /> },
    { id: 'anthro', label: 'Measurements', icon: <Activity size={18} /> },
    { id: 'subjective', label: 'Subjective', icon: <Thermometer size={18} /> },
    { id: 'raw', label: 'Raw Data', icon: <Database size={18} /> }
  ];

  return (
    <div className="patient-details-page">
      <header className="page-header">
        <button onClick={() => navigate('/patients')} className="back-btn">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="header-title-row">
          <div>
            <h1 className="page-title">{patient.full_name}</h1>
            <p className="page-subtitle">Patient ID: {patient.id}</p>
          </div>
          <button className="btn btn-primary" onClick={updatePatient}>
            <Save size={18} /> Save Info
          </button>
        </div>
      </header>

      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content animate-in">
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="card">
            <h3 className="card-title">Personal Information</h3>
            <form className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input value={patientForm.full_name || ''} onChange={e => setPatientForm({ ...patientForm, full_name: e.target.value })} className="input" />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" value={patientForm.date_of_birth || ''} onChange={e => setPatientForm({ ...patientForm, date_of_birth: e.target.value })} className="input" />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select value={patientForm.gender || 'Male'} onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })} className="input">
                  <option>Male</option><option>Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Height (cm)</label>
                <input type="number" value={patientForm.height_cm || ''} onChange={e => setPatientForm({ ...patientForm, height_cm: e.target.value })} className="input" />
              </div>
            </form>
          </div>
        )}

        {/* LABS TAB */}
        {activeTab === 'labs' && (
          <div className="content-wrapper">
            <div className="card form-card">
              <h3 className="card-title">Add Lab Result</h3>
              <form onSubmit={addLab} className="inline-form">
                <select className="input" required value={newLab.test_definition_id} onChange={e => setNewLab({ ...newLab, test_definition_id: e.target.value })}>
                  <option value="">Select Test...</option>
                  {labDefs.map(def => <option key={def.id} value={def.id}>{def.name} ({def.unit})</option>)}
                </select>
                <input type="number" step="0.01" placeholder="Value" className="input" required value={newLab.value} onChange={e => setNewLab({ ...newLab, value: e.target.value })} />
                <input type="date" className="input" required value={newLab.collection_date} onChange={e => setNewLab({ ...newLab, collection_date: e.target.value })} />
                <button type="submit" className="btn btn-primary"><Plus size={18} /></button>
              </form>
            </div>

            <div className="card">
              <h3 className="card-title">Lab History</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Test</th><th>Value</th><th>Unit</th></tr></thead>
                  <tbody>
                    {labs.length > 0 ? labs.map(l => {
                      const def = labDefs.find(d => d.id === l.test_definition_id);
                      return <tr key={l.id}><td>{l.collection_date}</td><td className="font-medium">{def?.name}</td><td>{l.value}</td><td>{def?.unit}</td></tr>
                    }) : <tr><td colspan="4" className="text-center text-muted">No lab results found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BIOIMPEDANCE TAB */}
        {activeTab === 'bio' && (
          <div className="content-wrapper">
            <div className="card form-card">
              <h3 className="card-title">Add Bioimpedance Scan</h3>
              <form onSubmit={addBio} className="inline-form">
                <input type="date" className="input" required value={newBio.date} onChange={e => setNewBio({ ...newBio, date: e.target.value })} />
                <input type="number" placeholder="Weight (kg)" className="input" required value={newBio.weight_kg} onChange={e => setNewBio({ ...newBio, weight_kg: e.target.value })} />
                <input type="number" placeholder="BMI" className="input" required value={newBio.bmi} onChange={e => setNewBio({ ...newBio, bmi: e.target.value })} />
                <input type="number" placeholder="Body Fat %" className="input" required value={newBio.body_fat_percent} onChange={e => setNewBio({ ...newBio, body_fat_percent: e.target.value })} />
                <input type="number" placeholder="Muscle (kg)" className="input" required value={newBio.muscle_mass_kg} onChange={e => setNewBio({ ...newBio, muscle_mass_kg: e.target.value })} />
                <input type="number" placeholder="Fat Mass (kg)" className="input" required value={newBio.fat_mass_kg} onChange={e => setNewBio({ ...newBio, fat_mass_kg: e.target.value })} />
                <button type="submit" className="btn btn-primary"><Plus size={18} /></button>
              </form>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Weight</th><th>BMI</th><th>Fat %</th><th>Muscle</th></tr></thead>
                  <tbody>{bio.map(b => <tr key={b.id}><td>{b.date}</td><td>{b.weight_kg}</td><td>{b.bmi}</td><td>{b.body_fat_percent}</td><td>{b.muscle_mass_kg}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ANTHROPOMETRY TAB */}
        {activeTab === 'anthro' && (
          <div className="content-wrapper">
            <div className="card form-card">
              <h3 className="card-title">Add Measurements</h3>
              <form onSubmit={addAnthro} className="inline-form">
                <input type="date" className="input" required value={newAnthro.date} onChange={e => setNewAnthro({ ...newAnthro, date: e.target.value })} />
                <input type="number" placeholder="Waist (cm)" className="input" value={newAnthro.waist_cm} onChange={e => setNewAnthro({ ...newAnthro, waist_cm: e.target.value })} />
                <input type="number" placeholder="Abdomen (cm)" className="input" value={newAnthro.abdomen_cm} onChange={e => setNewAnthro({ ...newAnthro, abdomen_cm: e.target.value })} />
                <input type="number" placeholder="Hips (cm)" className="input" value={newAnthro.hips_cm} onChange={e => setNewAnthro({ ...newAnthro, hips_cm: e.target.value })} />
                <button type="submit" className="btn btn-primary"><Plus size={18} /></button>
              </form>
            </div>
            <div className="card">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Waist</th><th>Abdomen</th><th>Hips</th></tr></thead>
                  <tbody>{anthro.map(a => <tr key={a.id}><td>{a.date}</td><td>{a.waist_cm}</td><td>{a.abdomen_cm}</td><td>{a.hips_cm}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBJECTIVE TAB */}
        {activeTab === 'subjective' && (
          <div className="content-wrapper">
            <div className="card form-card">
              <h3 className="card-title">Add Daily Log</h3>
              <form onSubmit={addSubj} className="inline-form">
                <input type="date" className="input" required value={newSubj.date} onChange={e => setNewSubj({ ...newSubj, date: e.target.value })} />
                <select className="input" value={newSubj.metric_name} onChange={e => setNewSubj({ ...newSubj, metric_name: e.target.value })}>
                  <option>Energy</option><option>Sleep Quality</option><option>Mood</option><option>Libido</option>
                </select>
                <input type="number" min="1" max="10" placeholder="Score (1-10)" className="input" required value={newSubj.score} onChange={e => setNewSubj({ ...newSubj, score: e.target.value })} />
                <input type="text" placeholder="Notes" className="input" value={newSubj.notes} onChange={e => setNewSubj({ ...newSubj, notes: e.target.value })} />
                <button type="submit" className="btn btn-primary"><Plus size={18} /></button>
              </form>
            </div>
            <div className="card">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Metric</th><th>Score</th><th>Notes</th></tr></thead>
                  <tbody>{subjective.map(s => <tr key={s.id}><td>{s.date}</td><td>{s.metric_name}</td><td>{s.score}</td><td>{s.notes}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* RAW DATA TAB */}
        {activeTab === 'raw' && (
          <div className="card">
            <h3 className="card-title flex-center gap-sm">
              <Database size={20} className="text-primary" />
              Backend Data Inspector
            </h3>
            <p className="text-secondary mb-lg">
              Below is the exact data returned by the backend API for this patient's profile.
            </p>

            <div className="json-viewer">
              {Object.entries(rawResponses).map(([key, data]) => (
                <div key={key} className="json-section">
                  <h4 className="json-label uppercase text-xs font-bold tracking-wider text-secondary mb-xs">
                    GET /patients/{id}/{key === 'patient' ? '' : key + '/'}
                  </h4>
                  <pre className="json-block">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .header-title-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: var(--spacing-sm); }
        .tabs-container { 
          display: flex; 
          gap: var(--spacing-sm); 
          border-bottom: 1px solid var(--color-border); 
          margin-bottom: var(--spacing-lg); 
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tab-btn { 
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-lg); 
          background: none; 
          border: none; 
          border-bottom: 2px solid transparent; 
          color: var(--color-text-secondary); 
          cursor: pointer; 
          white-space: nowrap;
          transition: all var(--transition-fast);
        }
        .tab-btn:hover { color: var(--color-primary); background-color: var(--color-gray-50); }
        .tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; background-color: var(--color-gray-50); }
        
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md); }
        .inline-form { display: flex; gap: var(--spacing-sm); flex-wrap: wrap; align-items: flex-end; }
        .inline-form .input { flex: 1; min-width: 140px; }
        
        .content-wrapper { display: flex; flex-direction: column; gap: var(--spacing-lg); }
        .form-card { background-color: var(--color-gray-50); border: 1px dashed var(--color-border); }
        
        /* JSON Viewer Styles */
        .json-viewer { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--spacing-md); }
        .json-section { background-color: #1e1e1e; padding: var(--spacing-md); border-radius: var(--radius-md); overflow: hidden; }
        .json-block { color: #d4d4d4; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.85rem; overflow-x: auto; white-space: pre-wrap; }
        .json-label { color: #9cdcfe; margin-bottom: var(--spacing-xs); display: block; }
        
        .animate-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        
        .text-muted { color: var(--color-text-secondary); font-style: italic; }
        
         /* Icon placeholders need the library if not present */
         /* Ensure lucide-react is installed */
      `}</style>
    </div>
  );
}

// Simple Icon Placeholders to prevent crash if Lucide isn't fully working in environment
// In a real app, these are imported from 'lucide-react'
function FlaskConical(props) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" /><path d="M8.5 2h7" /><path d="M7 16h10" /></svg> }
