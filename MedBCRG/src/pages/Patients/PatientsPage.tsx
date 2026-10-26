import React, { useState, useEffect } from 'react';
import { Search, Plus, UserPlus, FileText, Users, MoreHorizontal, X, Eye, Download, Activity, HeartPulse, AlertCircle, Calendar, Stethoscope, Droplet, FolderOpen } from 'lucide-react';
import { Patient, PatientMedicalRecord } from '../../types';
import { apiService, fetchDocumentBlob, downloadDocumentBlob } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { PATIENT_CATEGORIES_LABEL } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

export const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Side panel state
  const [openPatient, setOpenPatient] = useState<Patient | null>(null);
  const [detailTab, setDetailTab] = useState<'infos' | 'historique' | 'documents'>('infos');
  const [medicalRecord, setMedicalRecord] = useState<PatientMedicalRecord | null>(null);
  const [patientConsultations, setPatientConsultations] = useState<any[]>([]);
  const [patientDocuments, setPatientDocuments] = useState<any[]>([]);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);

  // In-app Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    title: string;
    blobUrl?: string;
    downloadUrl?: string;
    isLoading: boolean;
    error?: string;
  } | null>(null);

  const handleOpenPreview = async (doc: { title: string; viewUrl?: string; downloadUrl?: string }) => {
    if (!doc.viewUrl) return;
    setPreviewDoc({
      isOpen: true,
      title: doc.title,
      downloadUrl: doc.downloadUrl,
      isLoading: true
    });

    const res = await fetchDocumentBlob(doc.viewUrl);
    if (res.success && res.blobUrl) {
      setPreviewDoc({
        isOpen: true,
        title: doc.title,
        blobUrl: res.blobUrl,
        downloadUrl: doc.downloadUrl,
        isLoading: false
      });
    } else {
      setPreviewDoc({
        isOpen: true,
        title: doc.title,
        downloadUrl: doc.downloadUrl,
        isLoading: false,
        error: res.error || "Impossible d'afficher le document."
      });
    }
  };

  const handleClosePreview = () => {
    if (previewDoc?.blobUrl) {
      URL.revokeObjectURL(previewDoc.blobUrl);
    }
    setPreviewDoc(null);
  };

  useEffect(() => {
    apiService.getPatients().then(setPatients);
  }, []);

  useEffect(() => {
    if (openPatient) {
      setIsLoadingRecord(true);
      Promise.all([
        apiService.getPatientMedicalRecord(openPatient.id),
        apiService.getPatientDocuments(openPatient.id)
      ]).then(async ([record, docs]) => {
        setMedicalRecord(record);
        let currentDocs = docs || [];

        let consults: any[] = (record?.consultations as any[]) || [];
        if (!consults || consults.length === 0) {
          const allConsults = await apiService.getConsultations();
          consults = allConsults.filter(c => c.patientId === openPatient.id || c.patientMatricule === openPatient.matricule);
        }
        setPatientConsultations(consults);

        // Génération automatique en arrière-plan des ordonnances pour les consultations terminées ou avec prescriptions
        const consultsWithPrescriptions = consults.filter((c: any) => (c.prescriptions && c.prescriptions.length > 0) || (c.prescriptionsCount && c.prescriptionsCount > 0) || c.status === 'COMPLETED' || c.status === 'TERMINEE');
        if (currentDocs.length === 0 && consultsWithPrescriptions.length > 0) {
          for (const c of consultsWithPrescriptions) {
            try {
              await apiService.generatePrescriptionPdf(c.id);
            } catch (e) {
              // Ignore background errors
            }
          }
          currentDocs = await apiService.getPatientDocuments(openPatient.id);
        }

        setPatientDocuments(currentDocs);
      }).catch(err => {
        console.error('Erreur chargement dossier médical complet:', err);
      }).finally(() => {
        setIsLoadingRecord(false);
      });
    } else {
      setMedicalRecord(null);
      setPatientConsultations([]);
      setPatientDocuments([]);
    }
  }, [openPatient]);

  const filteredPatients = patients.filter(p =>
    (p.firstName?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.lastName?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.matricule?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7 text-[#0f172a]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">Dossiers Médicaux</h1>
            <p className="text-slate-500 mt-1 text-sm">Gérez les dossiers médicaux du personnel BCRG et ayants-droit.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 rounded-t-2xl bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-lg outline-none text-sm transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[360px] pb-32">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-medium">Matricule</th>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Poste</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredPatients.map((patient, idx) => {
                const isNearBottom = idx >= Math.max(0, filteredPatients.length - 2);
                return (
                  <tr
                    key={patient.id}
                    onClick={() => setOpenPatient(patient)}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-700 group-hover:text-[#1b3b31]">
                      {patient.matricule}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{patient.firstName} {patient.lastName}</div>
                      <div className="text-xs text-slate-400">{patient.email || `${patient.matricule}@bcrg-guinee.org`}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span>{patient.jobTitle || patient.department || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setActiveMenu(activeMenu === patient.id ? null : patient.id)}
                          className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
                          title="Actions"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {activeMenu === patient.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
                            <div className={`absolute right-0 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 ${isNearBottom ? 'bottom-full mb-2' : 'top-full mt-1'
                              }`}>
                              <button
                                onClick={() => { setOpenPatient(patient); setDetailTab('infos'); setActiveMenu(null); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#1b3b31] flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                              >
                                <FileText className="w-4 h-4 text-[#1b3b31]" />
                                Ouvrir le dossier médical
                              </button>
                              <button
                                onClick={() => { setOpenPatient(patient); setDetailTab('documents'); setActiveMenu(null); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#1b3b31] flex items-center gap-2.5 transition-colors font-medium cursor-pointer border-t border-slate-100"
                              >
                                <FolderOpen className="w-4 h-4 text-[#1b3b31]" />
                                Consulter les documents
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Aucun patient trouvé correspondant à votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Detail Panel */}
      {openPatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-stretch justify-end">
          <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
            {/* Header */}
            <div className="p-6 bg-[#1b3b31] text-white flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                    {(openPatient.firstName || ' ')[0]}{(openPatient.lastName || ' ')[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{openPatient.firstName} {openPatient.lastName}</h2>
                    <p className="text-white/70 text-sm">Matricule: {openPatient.matricule}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpenPatient(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 shrink-0">
              {(['infos', 'historique', 'documents'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${detailTab === tab ? 'border-[#1b3b31] text-[#1b3b31]' : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {tab === 'infos' ? 'Informations' : tab === 'historique' ? 'Historique Médical' : 'Documents'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {isLoadingRecord ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                  <div className="w-8 h-8 border-3 border-[#1b3b31] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm">Récupération du dossier médical complet...</p>
                </div>
              ) : (
                <>
                  {/* TAB: Informations */}
                  {detailTab === 'infos' && (
                    <>
                      {/* Vitals Summary Card if available */}
                      {medicalRecord?.vitalSigns && medicalRecord.vitalSigns.length > 0 && (
                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <HeartPulse className="w-4 h-4 text-emerald-700" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Dernières constantes vitales enregistrées</h4>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white rounded-lg p-2.5 border border-emerald-100/60 shadow-sm">
                              <p className="text-[11px] text-slate-400 font-medium">Tension</p>
                              <p className="text-sm font-bold text-slate-800">{medicalRecord.vitalSigns[0].bloodPressure || '—'}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border border-emerald-100/60 shadow-sm">
                              <p className="text-[11px] text-slate-400 font-medium">Poids / Taille</p>
                              <p className="text-sm font-bold text-slate-800">
                                {medicalRecord.vitalSigns[0].weightKg ? `${medicalRecord.vitalSigns[0].weightKg} kg` : '—'}
                                {medicalRecord.vitalSigns[0].heightCm ? ` • ${medicalRecord.vitalSigns[0].heightCm} cm` : ''}
                              </p>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border border-emerald-100/60 shadow-sm">
                              <p className="text-[11px] text-slate-400 font-medium">Température</p>
                              <p className="text-sm font-bold text-slate-800">
                                {medicalRecord.vitalSigns[0].temperatureC ? `${medicalRecord.vitalSigns[0].temperatureC} °C` : '—'}
                              </p>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border border-emerald-100/60 shadow-sm">
                              <p className="text-[11px] text-slate-400 font-medium">IMC</p>
                              <p className="text-sm font-bold text-slate-800">
                                {medicalRecord.vitalSigns[0].bmi ? `${medicalRecord.vitalSigns[0].bmi} (${medicalRecord.vitalSigns[0].bmiLabel || 'Normal'})` : '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Sexe</p>
                          <p className="text-sm font-bold text-slate-800">{(medicalRecord?.gender || openPatient.gender) === 'M' ? 'Masculin' : 'Féminin'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Poste</p>
                          <p className="text-sm font-bold text-slate-800">{medicalRecord?.jobTitle || openPatient.jobTitle || '-'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Direction / Département</p>
                          <p className="text-sm font-bold text-slate-800">{medicalRecord?.department || openPatient.department || '-'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Téléphone</p>
                          <p className="text-sm font-bold text-slate-800">{medicalRecord?.user?.phone || openPatient.phone || '-'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Email</p>
                          <p className="text-sm font-bold text-slate-800 truncate">{medicalRecord?.user?.email || openPatient.email || '-'}</p>
                        </div>
                      </div>

                      {(medicalRecord?.bloodGroup || openPatient.bloodGroup) && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold">
                            {medicalRecord?.bloodGroup || openPatient.bloodGroup}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Groupe sanguin</p>
                            <p className="text-sm font-bold text-red-600">{medicalRecord?.bloodGroup || openPatient.bloodGroup}</p>
                          </div>
                        </div>
                      )}

                      {/* Allergies */}
                      {((medicalRecord?.allergies && medicalRecord.allergies.length > 0) || (openPatient.allergies && openPatient.allergies.length > 0)) && (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                          <p className="text-xs font-medium text-rose-500 uppercase tracking-wider mb-2">Allergies déclarées</p>
                          <div className="flex flex-wrap gap-2">
                            {medicalRecord?.allergies && medicalRecord.allergies.length > 0 ? (
                              medicalRecord.allergies.map(a => (
                                <div key={a.id} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs">
                                  <span className="font-bold text-rose-800">{a.substance}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${a.severity === 'SEVERE' ? 'bg-red-100 text-red-700' : 'bg-rose-100 text-rose-700'
                                    }`}>{a.severity}</span>
                                  {a.reactionDetails && <span className="text-slate-500 italic">({a.reactionDetails})</span>}
                                </div>
                              ))
                            ) : (
                              openPatient.allergies?.map((a, i) => (
                                <span key={i} className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full">{a}</span>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Antécédents / Histoire médicale */}
                      {(medicalRecord?.medicalHistory || (openPatient.chronicConditions && openPatient.chronicConditions.length > 0)) && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                          <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">Antécédents / Pathologies chroniques</p>
                          <p className="text-sm text-slate-800 font-medium">
                            {medicalRecord?.medicalHistory || openPatient.chronicConditions?.join(', ')}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* TAB: Historique */}
                  {detailTab === 'historique' && (
                    <div className="space-y-4">
                      {patientConsultations.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">Aucune consultation enregistrée pour ce patient.</p>
                      ) : (
                        patientConsultations.map(consult => (
                          <div key={consult.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-slate-800">{formatDate(consult.date)}</h4>
                                {consult.doctorName && <p className="text-xs text-slate-500">{consult.doctorName}</p>}
                              </div>
                              <Badge variant={consult.status === 'COMPLETED' || consult.status === 'TERMINEE' ? 'success' : 'warning'}>
                                {consult.status === 'COMPLETED' ? 'TERMINEE' : consult.status}
                              </Badge>
                            </div>

                            {(consult.reason || consult.symptoms) && (
                              <p className="text-sm text-slate-600 font-medium mb-1">
                                <span className="font-semibold text-slate-700">Motif :</span> {consult.reason || consult.symptoms}
                              </p>
                            )}

                            {consult.diagnosis && (
                              <div className="bg-sky-50 rounded-lg p-2.5 my-2 border border-sky-100">
                                <span className="text-xs font-bold text-sky-700 block">Diagnostic :</span>
                                <span className="text-sm text-sky-800">{consult.diagnosis}</span>
                              </div>
                            )}

                            {consult.advice && (
                              <p className="text-xs text-slate-500 mt-1">
                                <span className="font-semibold text-slate-600">Conseils :</span> {consult.advice}
                              </p>
                            )}

                            {consult.glycemia && consult.glycemia.performed && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 rounded text-xs font-medium border border-amber-200">
                                <Droplet className="w-3.5 h-3.5 text-amber-600" />
                                <span>Glycémie : {consult.glycemia.value} {consult.glycemia.unit}</span>
                              </div>
                            )}

                            {consult.prescriptionsCount > 0 && (
                              <div className="mt-2 text-xs text-slate-500 font-medium">
                                💊 {consult.prescriptionsCount} médicament(s) prescrit(s)
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}

              {/* TAB: Documents */}
              {detailTab === 'documents' && (
                <div className="space-y-4">
                  {patientDocuments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                      <p className="font-medium text-slate-600">Aucun document médical</p>
                      <p className="text-xs text-slate-400 mt-1">Les ordonnances et documents médicaux s'afficheront ici automatiquement.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                      {patientDocuments.map(doc => (
                        <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-[#1b3b31]">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{doc.title}</p>
                              <p className="text-xs text-slate-500">{doc.documentType} • {formatDate(doc.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.viewUrl && (
                              <button
                                onClick={() => handleOpenPreview({ title: doc.title, viewUrl: doc.viewUrl, downloadUrl: doc.downloadUrl })}
                                className="p-2 text-slate-400 hover:text-[#1b3b31] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Visualiser en ligne (PDF)"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {doc.downloadUrl && (
                              <button
                                onClick={() => downloadDocumentBlob(doc.downloadUrl, `${doc.title}.pdf`)}
                                className="p-2 text-slate-400 hover:text-[#1b3b31] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Télécharger le document"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* In-app Document Preview Modal (No external tab) */}
      {previewDoc && previewDoc.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1b3b31] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{previewDoc.title}</h3>
                  <p className="text-xs text-emerald-100/70">Aperçu du document médical (PDF en ligne)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewDoc.downloadUrl && (
                  <button
                    onClick={() => downloadDocumentBlob(previewDoc.downloadUrl!, `${previewDoc.title}.pdf`)}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Télécharger ce document"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger</span>
                  </button>
                )}
                <button
                  onClick={handleClosePreview}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-slate-100 min-h-[520px] flex items-center justify-center p-0 relative overflow-hidden">
              {previewDoc.isLoading && (
                <div className="text-center py-16">
                  <div className="w-10 h-10 border-4 border-slate-300 border-t-[#1b3b31] rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-semibold text-slate-800 text-sm">Chargement du document PDF en cours...</p>
                  <p className="text-xs text-slate-500 mt-1">Récupération sécurisée depuis le serveur médical</p>
                </div>
              )}

              {!previewDoc.isLoading && previewDoc.error && (
                <div className="text-center p-8 max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 m-6">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-1">Document introuvable sur le serveur</h4>
                  <p className="text-sm text-slate-600 mb-4">{previewDoc.error}</p>
                  <p className="text-xs text-slate-400 mb-6">
                    L'enregistrement du document est présent dans la base de données, mais le fichier PDF n'est plus accessible sur le stockage du serveur.
                  </p>
                  <button
                    onClick={handleClosePreview}
                    className="px-4 py-2 bg-[#1b3b31] hover:bg-[#142c24] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Fermer l'aperçu
                  </button>
                </div>
              )}

              {!previewDoc.isLoading && !previewDoc.error && previewDoc.blobUrl && (
                <iframe
                  src={previewDoc.blobUrl}
                  title={previewDoc.title}
                  className="w-full h-[76vh] border-0"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
