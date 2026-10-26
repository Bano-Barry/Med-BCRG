import React, { useState, useEffect } from 'react';
import { CalendarDays, Bell, Activity, Plus, Clock, FileText, MoreHorizontal, X, Eye, Download, ShieldCheck, RefreshCw, Upload } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import { apiService, viewDocumentBlob, downloadDocumentBlob } from '../../services/api';
import { Appointment, MedicalDocument, PatientVitalsResponse } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useNotifications } from '../../hooks/useNotifications';

export const PatientPortalPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [openDocument, setOpenDocument] = useState<MedicalDocument | null>(null);
  const [isAllDocumentsOpen, setIsAllDocumentsOpen] = useState(false);
  const [isAppointmentPanelOpen, setIsAppointmentPanelOpen] = useState(false);
  const [isRenewPrescriptionPanelOpen, setIsRenewPrescriptionPanelOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [vitalsData, setVitalsData] = useState<PatientVitalsResponse | null>(null);
  const [successModal, setSuccessModal] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const loadPatientAppointments = async () => {
    try {
      const apts = await apiService.getMyPatientAppointments();
      if (apts && apts.length > 0) {
        setAppointments(apts);
      } else {
        const local = apiService.getAppointments();
        setAppointments(local);
      }
    } catch {
      setAppointments(apiService.getAppointments());
    }
  };

  useEffect(() => {
    if (location.pathname === '/patient/renouvellement') {
      setIsRenewPrescriptionPanelOpen(true);
    }
    // Fetch patient appointments from backend API
    loadPatientAppointments();

    // Fetch real patient vitals and documents from backend
    apiService.getMyVitals().then(res => {
      if (res) setVitalsData(res);
    });

    apiService.getMyDocuments().then(res => {
      if (res) setDocuments(res);
    });
  }, [location.pathname, isAppointmentPanelOpen]);

  const handleCloseRenew = () => {
    setIsRenewPrescriptionPanelOpen(false);
    if (location.pathname !== '/patient') navigate('/patient');
  };

  return (
    <div className="space-y-6 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Banner Patient */}
      <div className="bg-[#1b3b31] rounded-2xl p-8 relative overflow-hidden text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/30 bg-white/10 text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>EMPLOYÉ / PATIENT</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Mon Espace Santé</h1>
            <p className="text-white/80">
              Gérez vos rendez-vous, consultez vos informations médicales et téléchargez vos documents de suivi.
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex flex-col items-end gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 text-sm font-medium">
              <CalendarDays className="w-4 h-4" />
              <span>{formatDate(new Date().toISOString())}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rappels / Notifications */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 md:col-span-3 flex items-start gap-4">
          <div className="p-3 bg-slate-100 rounded-lg text-slate-500 shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-600">Aucune notification</h3>
            <p className="text-sm text-slate-500 mt-1">Vous n'avez pas de nouveaux rappels ou messages.</p>
          </div>
        </div>

        {/* Prochain Rendez-vous */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-[#1b3b31]" />
            <h2 className="font-semibold text-slate-800">Prochain Rendez-vous</h2>
          </div>

          {appointments.length > 0 ? (
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start p-4 bg-slate-50 rounded-lg">
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-center min-w-[80px]">
                <div className="text-xs font-bold text-red-500 uppercase">
                  {new Date(appointments[0].dateTime).toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
                <div className="text-2xl font-extrabold text-slate-800">
                  {new Date(appointments[0].dateTime).getDate()}
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-800">{appointments[0].reason.split(' - ')[0]}</h3>
                  <Badge variant={
                    appointments[0].status === 'PROGRAMME' ? 'warning' :
                      appointments[0].status === 'CONFIRME' ? 'success' :
                        appointments[0].status === 'ANNULE' ? 'danger' : 'default'
                  }>
                    {appointments[0].status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(appointments[0].dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  - {appointments[0].doctorName}
                </p>
              </div>
              <button
                onClick={() => setIsAppointmentPanelOpen(true)}
                className="text-sm text-[#1b3b31] font-medium hover:underline"
              >
                Gérer
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-slate-500 text-sm mb-3">Aucun rendez-vous à venir.</p>
              <button
                onClick={() => navigate('/patient/rendez-vous')}
                className="text-sm text-sky-600 font-medium hover:underline"
              >
                Prendre un nouveau rendez-vous
              </button>
            </div>
          )}
        </div>

        {/* Constantes / Suivi rapide */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-[#1b3b31]" />
            <h2 className="font-semibold text-slate-800">Dernières Constantes</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-sm text-slate-500">Tension Artérielle</span>
              <span className="font-semibold text-slate-800">{vitalsData?.summary?.bloodPressure || '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-sm text-slate-500">Poids</span>
              <span className="font-semibold text-slate-800">{vitalsData?.summary?.weightKg ? `${vitalsData.summary.weightKg} kg` : '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Dernière mesure</span>
              <span className="font-semibold text-slate-800 text-sm">
                {vitalsData?.summary?.measuredAt ? formatDate(vitalsData.summary.measuredAt) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Historique médical récent */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1b3b31]" />
              <h2 className="font-semibold text-slate-800">Suivi et Documents</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/patient/documents')} className="text-sm text-[#1b3b31] font-medium hover:underline">+ Ajouter un document</button>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {documents.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">Aucun document médical disponible pour le moment.</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{doc.title}</p>
                      <p className="text-xs text-slate-500">
                        {doc.documentType} • {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.viewUrl && (
                      <button
                        onClick={() => viewDocumentBlob(doc.viewUrl!)}
                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Prévisualiser"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {doc.downloadUrl && (
                      <button
                        onClick={() => downloadDocumentBlob(doc.downloadUrl!, `${doc.title}.pdf`)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Slide-over panel for Document */}
      {openDocument && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-stretch justify-end">
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
            {/* Header */}
            <div className="p-6 bg-[#1b3b31] text-white flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{openDocument.title}</h2>
                    <p className="text-white/70 text-sm">{formatDate(openDocument.createdAt)}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpenDocument(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center text-slate-500">
              <FileText className="w-16 h-16 text-slate-200 mb-4" />
              <p className="mb-2 font-medium text-slate-700">Aperçu du document PDF</p>
              <p className="text-sm max-w-[250px] mb-6">Ce document est disponible en lecture seule{openDocument.downloadUrl ? ' ou en téléchargement.' : '.'}</p>
              <div className="flex flex-col gap-2">
                {openDocument.viewUrl && (
                  <button
                    onClick={() => viewDocumentBlob(openDocument.viewUrl!)}
                    className="bg-[#1b3b31] hover:bg-[#142c24] text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ouvrir dans l'onglet
                  </button>
                )}
                {openDocument.downloadUrl && (
                  <button
                    onClick={() => downloadDocumentBlob(openDocument.downloadUrl!, `${openDocument.title}.pdf`)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le document
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over panel for All Documents */}
      {isAllDocumentsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-stretch justify-end">
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
            {/* Header */}
            <div className="p-6 bg-[#1b3b31] text-white flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-lg font-bold">Tous les documents</h2>
                <p className="text-white/70 text-sm">Historique complet de votre suivi</p>
              </div>
              <button onClick={() => setIsAllDocumentsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.title.toLowerCase().includes('ordonnance') ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{doc.title}</p>
                        <p className="text-xs text-slate-500">
                          {doc.documentType} • {formatDate(doc.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.viewUrl && (
                        <button
                          onClick={() => {
                            setIsAllDocumentsOpen(false);
                            viewDocumentBlob(doc.viewUrl!);
                          }}
                          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Prévisualiser"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {doc.downloadUrl && (
                        <button
                          onClick={() => downloadDocumentBlob(doc.downloadUrl!, `${doc.title}.pdf`)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over panel for Renew Prescription */}
      {isRenewPrescriptionPanelOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-stretch justify-end">
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
            {/* Header */}
            <div className="p-6 bg-[#1b3b31] text-white flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-lg font-bold">Renouvellement d'ordonnance</h2>
                <p className="text-white/70 text-sm">Demande sans consultation</p>
              </div>
              <button onClick={handleCloseRenew} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-sky-50 border border-sky-100 rounded-lg p-4 mb-4">
                <p className="text-sm text-sky-800">
                  Le renouvellement est réservé aux traitements chroniques déjà prescrits par notre service. La demande sera validée par un médecin.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Traitement concerné</label>
                <input type="text" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#1b3b31] text-sm" placeholder="Ex: Paracétamol, Amlodipine..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dernière ordonnance date du (approximatif)</label>
                <input type="date" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#1b3b31] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commentaires additionnels (optionnel)</label>
                <textarea rows={3} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#1b3b31] text-sm" placeholder="Avez-vous besoin d'un dosage différent ou d'autres précisions ?"></textarea>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50">
              <button
                onClick={handleCloseRenew}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleCloseRenew();
                  setSuccessModal({ isOpen: true, message: 'Demande envoyée au médecin.' });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1b3b31] hover:bg-[#122821] rounded-lg transition-colors shadow-sm"
              >
                Soumettre la demande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over panel for Manage Appointments */}
      {isAppointmentPanelOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-stretch justify-end">
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
            {/* Header */}
            <div className="p-6 bg-[#1b3b31] text-white flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-lg font-bold">Mes Rendez-vous</h2>
                <p className="text-white/70 text-sm">Gérer vos prochaines consultations</p>
              </div>
              <button onClick={() => setIsAppointmentPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 font-medium">Aucun rendez-vous à venir.</p>
                </div>
              ) : (
                appointments.map(apt => (
                  <div key={apt.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-sky-50 text-sky-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-sky-100">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(apt.dateTime).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })} • {new Date(apt.dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <Badge variant={
                        apt.status === 'PROGRAMME' ? 'warning' :
                          apt.status === 'CONFIRME' ? 'success' :
                            apt.status === 'ANNULE' ? 'danger' : 'default'
                      }>
                        {apt.status}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-bold text-slate-800">{apt.reason.split(' - ')[0]}</h3>
                      <p className="text-sm text-slate-500 mt-1">{apt.doctorName}</p>
                    </div>

                    {apt.status !== 'ANNULE' && (
                      <div className="flex gap-2 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setAppointmentToCancel(apt.id);
                          }}
                          className="flex-1 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm font-medium transition-colors border border-rose-100"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => {
                            setIsAppointmentPanelOpen(false);
                            navigate('/patient/rendez-vous');
                          }}
                          className="flex-1 py-2 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors border border-slate-200"
                        >
                          Nouveau
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Succès</h2>
            <p className="text-slate-600 text-sm mb-6">{successModal.message}</p>
            <button
              onClick={() => setSuccessModal({ isOpen: false, message: '' })}
              className="w-full px-4 py-3 bg-[#1b3b31] text-white rounded-xl font-medium hover:bg-[#142c24] transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {appointmentToCancel && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Annuler le rendez-vous</h2>
            <p className="text-slate-600 text-sm mb-6">Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setAppointmentToCancel(null)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                Non, conserver
              </button>
              <button
                onClick={async () => {
                  try {
                    await apiService.cancelPatientAppointment(appointmentToCancel, "Annulé par le patient");
                    showToast('Rendez-vous annulé', 'Votre rendez-vous a bien été annulé.', 'info');
                  } catch (e) {
                    apiService.updateAppointment(appointmentToCancel, { status: 'ANNULE' });
                  }
                  await loadPatientAppointments();
                  setAppointmentToCancel(null);
                }}
                className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors shadow-sm"
              >
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
