import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import { MainLayout } from '../components/layout/MainLayout';

// Pages
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { PatientsPage } from '../pages/Patients/PatientsPage';
import { ConsultationsPage } from '../pages/Consultations/ConsultationsPage';
import { PharmaciePage } from '../pages/Pharmacie/PharmaciePage';
import { RendezVousPage } from '../pages/RendezVous/RendezVousPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';
import { NotFoundPage } from '../pages/NotFound/NotFoundPage';
import { LoginPage } from '../pages/Auth/LoginPage';
import { AdminPage } from '../pages/Admin/AdminPage';
import { UsersManagementPage } from '../pages/Admin/UsersManagementPage';
import { PatientPortalPage } from '../pages/Patient/PatientPortalPage';
import { PatientDocumentsPage } from '../pages/Patient/PatientDocumentsPage';
import { PatientRendezVousPage } from '../pages/Patient/PatientRendezVousPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="consultations" element={<ConsultationsPage />} />
        <Route path="pharmacie" element={<PharmaciePage />} />
        <Route path="rendez-vous" element={<RendezVousPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin" element={<Navigate to="/admin/stats" replace />} />
        <Route path="admin/stats" element={<AdminPage />} />
        <Route path="admin/users" element={<UsersManagementPage />} />
        <Route path="admin/settings" element={<AdminPage />} />
        <Route path="admin/campaigns" element={<AdminPage />} />
        <Route path="admin/logs" element={<AdminPage />} />
        
        {/* Patient Portal */}
        <Route path="patient" element={<PatientPortalPage />} />
        <Route path="patient/rendez-vous" element={<PatientRendezVousPage />} />
        <Route path="patient/suivi" element={<PatientPortalPage />} />
        <Route path="patient/renouvellement" element={<PatientPortalPage />} />
        <Route path="patient/documents" element={<PatientDocumentsPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
