
import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  Settings, 
  LogOut, 
  Building2, 
  Plus, 
  QrCode, 
  Trash2, 
  Download, 
  Link as LinkIcon, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Company, Training, Assignment, Attendance, Instructor, TrainingItem } from '../types';
import SignaturePad from '../components/SignaturePad';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';

interface AdminDashboardProps {
  instructor: Instructor | null;
  setInstructor: (ins: Instructor) => void;
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  trainings: Training[];
  setTrainings: React.Dispatch<React.SetStateAction<Training[]>>;
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  attendances: Attendance[];
  setAttendances: React.Dispatch<React.SetStateAction<Attendance[]>>;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  instructor, setInstructor,
  companies, setCompanies,
  trainings, setTrainings,
  assignments, setAssignments,
  attendances, setAttendances,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'companies' | 'trainings' | 'registry'>('profile');
  const [editingInstructor, setEditingInstructor] = useState({
    name: instructor?.name || '',
    role: instructor?.role || '',
    signature: instructor?.signature || ''
  });
  const [shorteningId, setShorteningId] = useState<string | null>(null);

  const addCompany = () => {
    const nameInput = document.getElementById('comp-name') as HTMLInputElement;
    const cuitInput = document.getElementById('comp-cuit') as HTMLInputElement;
    if (!nameInput.value || !cuitInput.value) return;
    const company: Company = {
      id: crypto.randomUUID(),
      name: nameInput.value,
      cuit: cuitInput.value
    };
    setCompanies(prev => [...prev, company]);
    nameInput.value = '';
    cuitInput.value = '';
  };

  const [newTrainingTitle, setNewTrainingTitle] = useState('');
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [currentLinks, setCurrentLinks] = useState<TrainingItem[]>([]);

  const addLinkToCurrent = () => {
    if (!newLink.title || !newLink.url) return;
    setCurrentLinks(prev => [...prev, { ...newLink, id: crypto.randomUUID() }]);
    setNewLink({ title: '', url: '' });
  };

  const addTraining = () => {
    if (!newTrainingTitle || currentLinks.length === 0) return;
    const training: Training = {
      id: crypto.randomUUID(),
      title: newTrainingTitle,
      items: currentLinks
    };
    setTrainings(prev => [...prev, training]);
    setNewTrainingTitle('');
    setCurrentLinks([]);
  };

  const [filterCompany, setFilterCompany] = useState('');
  const [filterTraining, setFilterTraining] = useState('');

  const filteredAttendances = attendances.filter(att => {
    const matchCompany = filterCompany ? att.companyId === filterCompany : true;
    const matchTraining = filterTraining ? att.trainingId === filterTraining : true;
    return matchCompany && matchTraining;
  });

  const downloadQRAsFlyer = async (assignment: Assignment, trainingTitle: string, companyName: string) => {
    setShorteningId(assignment.id);
    const originalUrl = `${window.location.origin}${window.location.pathname}#/training/${assignment.trainingId}/${assignment.companyId}`;
    
    let finalUrl = originalUrl;
    try {
      const response = await fetch(`https://tinyurl.com/api-create?url=${encodeURIComponent(originalUrl)}`);
      if (response.ok) {
        finalUrl = await response.text();
      }
    } catch (error) {
      console.warn("Could not shorten URL, using original link", error);
    } finally {
      setShorteningId(null);
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Cabecera Azul Intenso
    doc.setFillColor(37, 99, 235); 
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text('ACCESO A CAPACITACIÓN', pageWidth / 2, 28, { align: 'center' });

    // 2. Información Empresa y Capacitación
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(22);
    doc.text(companyName.toUpperCase(), pageWidth / 2, 65, { align: 'center' });
    doc.setFontSize(24);
    doc.text(trainingTitle, pageWidth / 2, 80, { align: 'center' });

    // 3. Renderizar QR a alta calidad
    const canvas = document.createElement('canvas');
    const qrSvg = document.querySelector(`#qr-hidden-${assignment.id} svg`) as SVGSVGElement;
    
    if (qrSvg) {
      const svgData = new XMLSerializer().serializeToString(qrSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      
      img.onload = () => {
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 1024, 1024);
          ctx.drawImage(img, 0, 0, 1024, 1024);
          const qrDataUrl = canvas.toDataURL('image/png');
          const qrSizeMm = 125;
          const xPos = (pageWidth - qrSizeMm) / 2;
          doc.addImage(qrDataUrl, 'PNG', xPos, 100, qrSizeMm, qrSizeMm);

          // 4. Pie de Página
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(14);
          doc.setFont("helvetica", "normal");
          doc.text('Escanee el código QR para registrar su asistencia y ver el material.', pageWidth / 2, 240, { align: 'center' });
          
          doc.setFontSize(9);
          doc.text(finalUrl, pageWidth / 2, 250, { align: 'center' });

          doc.save(`Acceso-${companyName}-${trainingTitle}.pdf`);
          URL.revokeObjectURL(url);
        }
      };
      img.src = url;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold">TrainerPro</span>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}><Settings size={20} /> Perfil</button>
          <button onClick={() => setActiveTab('companies')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'companies' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}><Building2 size={20} /> Empresas</button>
          <button onClick={() => setActiveTab('trainings')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'trainings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}><BookOpen size={20} /> Capacitaciones</button>
          <button onClick={() => setActiveTab('registry')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'registry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}><Users size={20} /> Registro</button>
        </nav>
        <div className="mt-auto">
          <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><LogOut size={20} /> Cerrar Sesión</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-10">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-3xl font-bold">Información del Instructor</h2>
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Nombre Completo</label>
                    <input type="text" value={editingInstructor.name} onChange={e => setEditingInstructor({...editingInstructor, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" placeholder="Juan Pérez" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Cargo</label>
                    <input type="text" value={editingInstructor.role} onChange={e => setEditingInstructor({...editingInstructor, role: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" placeholder="Instructor de Seguridad" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Firma Digital</label>
                  <SignaturePad onSave={sig => setEditingInstructor({...editingInstructor, signature: sig})} />
                </div>
                <button onClick={() => {setInstructor(editingInstructor); alert('Perfil guardado');}} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all">Guardar Cambios</button>
              </div>
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-3xl font-bold">Empresas</h2>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row gap-4">
                <input id="comp-name" placeholder="Nombre de la Empresa" className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl flex-1" />
                <input id="comp-cuit" placeholder="CUIT" className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl md:w-64" />
                <button onClick={addCompany} className="bg-indigo-600 p-3 rounded-xl font-bold flex items-center justify-center"><Plus size={24} /></button>
              </div>
              <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                <table className="w-full text-left">
                  <thead className="bg-slate-800 text-slate-400 text-xs uppercase font-bold"><tr><th className="p-4">Empresa</th><th className="p-4">CUIT</th><th className="p-4 text-right">Acciones</th></tr></thead>
                  <tbody className="divide-y divide-slate-800">{companies.map(c => (<tr key={c.id} className="hover:bg-slate-800/40"><td className="p-4 font-bold">{c.name}</td><td className="p-4">{c.cuit}</td><td className="p-4 text-right"><button onClick={() => setCompanies(companies.filter(x => x.id !== c.id))} className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg"><Trash2 size={18}/></button></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'trainings' && (
            <div className="space-y-8 animate-in">
              <h2 className="text-3xl font-bold">Capacitaciones</h2>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <input value={newTrainingTitle} onChange={e => setNewTrainingTitle(e.target.value)} placeholder="Título de la Capacitación" className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-xl font-bold" />
                <div className="flex flex-col md:flex-row gap-4">
                  <input value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} placeholder="Nombre del Módulo" className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl flex-1"/>
                  <input value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} placeholder="URL de Drive" className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl flex-1"/>
                  <button onClick={addLinkToCurrent} className="bg-slate-700 px-4 py-2 rounded-xl hover:bg-slate-600 transition-all">Agregar Módulo</button>
                </div>
                {currentLinks.length > 0 && <div className="space-y-2">{currentLinks.map(l => <div key={l.id} className="bg-slate-800/50 p-2 rounded-lg text-sm flex justify-between"><span>{l.title}</span><button onClick={() => setCurrentLinks(currentLinks.filter(x => x.id !== l.id))}><Trash2 size={14}/></button></div>)}</div>}
                <button onClick={addTraining} className="w-full bg-indigo-600 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20">Crear Capacitación</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trainings.map(t => (
                  <div key={t.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-xl font-bold">{t.title}</h3>
                    <select onChange={(e) => {
                      if (!e.target.value) return;
                      if (!assignments.find(a => a.trainingId === t.id && a.companyId === e.target.value)) {
                        setAssignments([...assignments, { id: crypto.randomUUID(), trainingId: t.id, companyId: e.target.value }]);
                      }
                    }} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
                      <option value="">Vincular con Empresa...</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="space-y-2">
                      {assignments.filter(a => a.trainingId === t.id).map(a => {
                        const comp = companies.find(c => c.id === a.companyId);
                        const link = `${window.location.origin}${window.location.pathname}#/training/${a.trainingId}/${a.companyId}`;
                        return (
                          <div key={a.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-xl">
                            <span className="font-bold text-indigo-300 truncate max-w-[140px]">{comp?.name}</span>
                            <div className="flex gap-2">
                              <button onClick={() => downloadQRAsFlyer(a, t.title, comp?.name || 'Empresa')} className="bg-white text-slate-950 p-2 rounded-lg hover:bg-slate-200" title="Descargar Flyer QR">
                                {shorteningId === a.id ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                              </button>
                              <div id={`qr-hidden-${a.id}`} className="hidden"><QRCodeSVG value={link} size={512} /></div>
                              <button onClick={() => setAssignments(assignments.filter(x => x.id !== a.id))} className="text-red-400 p-2 hover:bg-red-400/10 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'registry' && (
            <div className="space-y-6 animate-in">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold">Registro de Asistencia</h2>
                <button onClick={() => {
                  const doc = new jsPDF();
                  doc.setFontSize(20);
                  doc.text("REGISTRO DE ASISTENCIA - TRAINERPRO", 105, 20, { align: 'center' });
                  doc.setFontSize(12);
                  filteredAttendances.forEach((a, i) => {
                    const c = companies.find(x => x.id === a.companyId)?.name;
                    doc.text(`${i+1}. ${a.employeeName} (DNI: ${a.employeeDni}) - Empresa: ${c}`, 20, 35 + (i*10));
                  });
                  doc.save('registro-trainerpro.pdf');
                }} className="bg-indigo-600 px-6 py-2 rounded-xl font-bold flex gap-2 items-center"><Download size={18}/> Descargar PDF</button>
              </div>
              <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                <table className="w-full text-left">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-xs font-bold"><tr><th className="p-4">Empleado</th><th className="p-4">DNI</th><th className="p-4">Empresa</th><th className="p-4">Firma</th><th className="p-4 text-right"></th></tr></thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredAttendances.map(a => (
                      <tr key={a.id} className="hover:bg-slate-800/40">
                        <td className="p-4 font-bold">{a.employeeName}</td>
                        <td className="p-4">{a.employeeDni}</td>
                        <td className="p-4">{companies.find(c => c.id === a.companyId)?.name}</td>
                        <td className="p-4"><img src={a.employeeSignature} className="h-8 invert opacity-80" /></td>
                        <td className="p-4 text-right"><button onClick={() => setAttendances(attendances.filter(x => x.id !== a.id))} className="text-red-400"><Trash2 size={18}/></button></td>
                      </tr>
                    ))}
                    {filteredAttendances.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 italic">No hay registros de asistencia cargados aún.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
