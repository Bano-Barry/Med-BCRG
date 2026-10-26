import React, { useState } from 'react';
import { Upload, FileText, ArrowLeft, ShieldCheck, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

export const PatientDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [docType, setDocType] = useState('LAB_RESULT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Fichier requis', 'Veuillez sélectionner un fichier (PDF, JPG, PNG).', 'error');
      return;
    }
    setIsUploading(true);
    const res = await apiService.uploadMyDocument(docType, selectedFile);
    setIsUploading(false);

    if (res.success) {
      setIsSuccessModalOpen(true);
      showToast('Document envoyé', 'Votre document a été importé dans votre dossier médical.', 'success');
    } else {
      showToast('Erreur', res.error || 'Échec de l\'envoi du document.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Banner */}
      <div className="bg-[#1b3b31] rounded-2xl p-8 relative overflow-hidden text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold mb-2">Soumettre un document</h1>
            <p className="text-white/80">
              Ajoutez vos résultats d'analyses de laboratoire, comptes rendus de spécialistes ou examens d'imagerie directement dans votre dossier médical.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-3 bg-amber-100 rounded-lg text-amber-600 shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Informations importantes</h3>
          <p className="text-slate-600 text-sm mt-1">
            Les documents soumis sont examinés par l'équipe médicale de la BCRG avant d'être intégrés définitivement à votre dossier. Assurez-vous que les documents soient bien lisibles.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Type de document</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-[#1b3b31] focus:ring-1 focus:ring-[#1b3b31] text-sm bg-slate-50 transition-all"
              >
                <option value="LAB_RESULT">Résultats d'analyses (Laboratoire)</option>
                <option value="IMAGING">Imagerie (Radio, IRM, Scanner)</option>
                <option value="SPECIALIST_REPORT">Compte rendu spécialiste externe</option>
                <option value="MEDICAL_CERTIFICATE">Certificat médical</option>
                <option value="OTHER">Autre document médical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date de l'examen</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-[#1b3b31] focus:ring-1 focus:ring-[#1b3b31] text-sm bg-slate-50 transition-all" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Commentaires additionnels (optionnel)</label>
            <textarea
              rows={3}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-[#1b3b31] focus:ring-1 focus:ring-[#1b3b31] text-sm bg-slate-50 transition-all"
              placeholder="Précisez la nature de l'examen ou tout détail utile pour le médecin..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Fichier à importer</label>
            <div className={`mt-2 flex justify-center px-6 pt-10 pb-12 border-2 ${selectedFile ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-300'} border-dashed rounded-2xl hover:border-[#1b3b31] hover:bg-slate-50 transition-all cursor-pointer group`}>
              <div className="space-y-2 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-[#1b3b31]/10 transition-colors">
                  <Upload className="mx-auto h-8 w-8 text-slate-400 group-hover:text-[#1b3b31] transition-colors" />
                </div>
                <div className="flex text-sm text-slate-600 justify-center mt-4">
                  <label htmlFor="file-upload" className="relative rounded-md font-bold text-[#1b3b31] hover:text-[#122821] cursor-pointer focus-within:outline-none">
                    <span>{selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un fichier'}</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2">ou glissez-déposez votre fichier ici</p>
                <p className="text-xs text-slate-400 mt-1">Formats acceptés : PDF, JPG, PNG (jusqu'à 10 MB)</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs text-slate-500 flex-1">
              Les données transférées sont chiffrées et soumises au secret médical professionnel.
            </p>
            <button
              type="button"
              onClick={() => navigate('/patient')}
              className="px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-3 text-sm font-semibold text-white bg-[#1b3b31] hover:bg-[#122821] rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Téléversement...' : 'Envoyer le document'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Succès</h2>
            <p className="text-slate-600 text-sm mb-6">Document soumis avec succès.</p>
          </div>
        </div>
      )}
    </div>
  );
};
