import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import NewPatient from './pages/NewPatient';
import LabDefinitions from './pages/LabDefinitions';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/new" element={<NewPatient />} />
          <Route path="patients/:id" element={<PatientDetails />} />
          <Route path="lab-definitions" element={<LabDefinitions />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
