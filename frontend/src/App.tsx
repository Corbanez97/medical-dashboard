import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SidebarLayout } from "./layout/SidebarLayout";
import { LabDefinitionsPage } from "./pages/LabDefinitionsPage";
import { PatientAnthropometryPage } from "./pages/PatientAnthropometryPage";
import { PatientBioimpedancePage } from "./pages/PatientBioimpedancePage";
import { PatientDashboardPage } from "./pages/PatientDashboardPage";
import { PatientLabsPage } from "./pages/PatientLabsPage";
import { PatientRouteLayout } from "./pages/PatientRouteLayout";
import { PatientsPage } from "./pages/PatientsPage";
import { PatientSubjectivePage } from "./pages/PatientSubjectivePage";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SidebarLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/patients" replace />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/lab-definitions" element={<LabDefinitionsPage />} />

            <Route path="/patients/:patientId" element={<PatientRouteLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PatientDashboardPage />} />
              <Route path="labs" element={<PatientLabsPage />} />
              <Route path="bioimpedance" element={<PatientBioimpedancePage />} />
              <Route path="anthropometry" element={<PatientAnthropometryPage />} />
              <Route path="subjective" element={<PatientSubjectivePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/patients" replace />} />
          </Routes>
        </SidebarLayout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
