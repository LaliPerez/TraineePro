
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

  // Company management
  const [newCompany, setNewCompany] = useState({ name: '', cuit: '' });
  const addCompany = () => {
    if (!newCompany.name || !newCompany.cuit) return;
    const company: Company = {
      id: crypto.randomUUID(),
      name: newCompany.name,
      cuit: newCompany.cuit
    };
    setCompanies(prev => [...prev, company]);
    setNewCompany({ name: '', cuit: '' });
  };

  // Training management
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

  // Registry filtering
  const [filterCompany, setFilterCompany] = useState('');
  const [filterTraining, setFilterTraining] = useState('');

  const filteredAttendances = attendances.filter(att => {
    const matchCompany = filterCompany ? att.companyId === filterCompany : true;
    const matchTraining = filterTraining ? att.trainingId === filterTraining : true;
    return matchCompany && matchTraining;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Registro de Asistencia - TrainerPro', 20, 20);
    doc.setFontSize(12);
    
    let y = 35;
    filteredAttendances.forEach((att, index) => {
      const comp = companies.find(c => c.id === att.companyId)?.name || 'N/A';
      const train = trainings.find(t => t.id === att.trainingId)?.title || 'N/A';
      doc.text(`${index + 1}. ${att.employeeName} - DNI: ${att.employeeDni}`, 20, y);
      doc.text(`   Empresa: ${comp} | Capacitación: ${train}`, 20, y + 6);
      y += 15;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save('registro-asistencia.pdf');
  };

  const shareTraining = (assignment: Assignment) => {
    const url = `${window.location.origin}${window.location.pathname}#/training/${assignment.trainingId}/${assignment.companyId}`;
    navigator.clipboard.writeText(url);
    alert('Link de capacitación copiado al portapapeles');
  };

  const downloadQRAsFlyer = async (assignment: Assignment, trainingTitle: string, companyName: string) => {
    setShorteningId(assignment.id);
    const originalUrl = `${window.location.origin}${window.location.pathname}#/training/${assignment.trainingId}/${assignment.companyId}`;
    
    let finalUrl = originalUrl;
    try {
      // Usar proxy para evitar CORS si es necesario, o TinyURL directamente. 
      // TinyURL es usualmente permisivo con el API simple.
      const response = await fetch(`https://tinyurl.com/api-create?url=${encodeURIComponent(originalUrl)}`);
      if (response.ok) {
        finalUrl = await response.text();
      }
    } catch (error) {
      console.warn("No se pudo acortar la URL, se usará el link original", error);
    } finally {
      setShorteningId(null);
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Cabecera Azul (Indigo Intenso)
    doc.setFillColor(37, 99, 235); 
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text('ACCESO A CAPACITACIÓN', pageWidth / 2, 28, { align: 'center' });

    // 2. Nombres de Empresa y Capacitación
    doc.setTextColor(51, 65, 85); // Slate 700
    doc.setFontSize(22);
    doc.text(companyName.toUpperCase(), pageWidth / 2, 65, { align: 'center' });
    doc.setFontSize(24);
    doc.text(trainingTitle, pageWidth / 2, 80, { align: 'center' });

    // 3. Generar Imagen del QR
    // Buscamos el SVG renderizado en el DOM para convertirlo a imagen de alta calidad
    const qrContainerId = `qr-hidden-${assignment.id}`;
    const qrSvg = document.querySelector(`#${qrContainerId} svg`) as SVGSVGElement;
    
    if (qrSvg) {
      const svgData = new XMLSerializer().serializeToString(qrSvg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Renderizar a un canvas grande para mejor resolución en el PDF
        canvas.width = 1024;
        canvas.height = 1024;
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const qrDataUrl = canvas.toDataURL('image/png');
          const qrSizeMm = 130;
          const xPos = (pageWidth - qrSizeMm) / 2;
          
          doc.addImage(qrDataUrl, 'PNG', xPos, 100, qrSizeMm, qrSizeMm);

          // 4. Pie de página
          doc.setTextColor(100, 116, 139); // Slate 500
          doc.setFontSize(14);
          doc.setFont("helvetica", "normal");
          doc.text('Escanee el código QR para registrar su asistencia y ver el material.', pageWidth / 2, 245, { align: 'center' });
          
          doc.setFontSize(10);
          doc.text(finalUrl, pageWidth / 2, 255, { align: 'center' });

          doc.save(`Flyer-QR-${companyName}-${trainingTitle}.pdf`);
          URL.revokeObjectURL(url);
        }
      };
      img.src = url;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold">TrainerPro</span>
        </div>

        <nav className="flex flex-col gap-2 mt-4">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
          >
            <Settings size={20} /> Perfil
          </button>
          <button 
            onClick={() => setActiveTab('companies')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'companies' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
          >
            <Building2 size={20} /> Empresas
          </button>
          <button 
            onClick={() => setActiveTab('trainings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'trainings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
          >
            <BookOpen size={20} /> Capacitaciones
          </button>
          <button 
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'registry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
          >
            <Users size={20} /> Registro
          </button>
        </nav>

        <div className="mt-auto">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 bg-slate-950 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold">Información del Instructor</h2>
                {instructor && (
                  <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-sm font-medium">
                    <CheckCircle size={16} /> Configurado correctamente
                  </div>
                )}
              </div>
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-400">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={editingInstructor.name}
                      onChange={e => setEditingInstructor(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-400">Cargo / Posición</label>
                    <input 
                      type="text" 
                      value={editingInstructor.role}
                      onChange={e => setEditingInstructor(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Ej. Técnico Superior en Seguridad e Higiene"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-400">Firma Digital</label>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-full md:w-1/2">
                      <SignaturePad 
                        onSave={sig => setEditingInstructor(prev => ({ ...prev, signature: sig }))}
                      />
                    </div>
                    {editingInstructor.signature && (
                      <div className="w-full md:w-1/2 p-4 bg-slate-800 rounded-xl border border-slate-700 flex flex-col items-center gap-2">
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Vista Previa</span>
                        <img src={editingInstructor.signature} alt="Firma" className="max-h-32 object-contain" />
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setInstructor(editingInstructor);
                    alert('Perfil guardado');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                  Guardar Cambios
                </button>
              </div>
            </section>
          )}

          {/* COMPANIES TAB */}
          {activeTab === 'companies' && (
            <section className="space-y-6">
              <h2 className="text-3xl font-bold">Gestión de Empresas</h2>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input 
                    type="text" 
                    value={newCompany.name}
                    onChange={e => setNewCompany(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nombre Empresa"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2"
                  />
                  <input 
                    type="text" 
                    value={newCompany.cuit}
                    onChange={e => setNewCompany(p => ({ ...p, cuit: e.target.value }))}
                    placeholder="CUIT (XX-XXXXXXXX-X)"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2"
                  />
                  <button 
                    onClick={addCompany}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all"
                  >
                    <Plus size={20} /> Agregar Empresa
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800 text-slate-400 text-sm uppercase">
                      <tr>
                        <th className="px-6 py-4">Empresa</th>
                        <th className="px-6 py-4">CUIT</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {companies.length === 0 ? (
                        <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-500">No hay empresas registradas</td></tr>
                      ) : (
                        companies.map(c => (
                          <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 font-medium">{c.name}</td>
                            <td className="px-6 py-4 text-slate-400">{c.cuit}</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => setCompanies(prev => prev.filter(x => x.id !== c.id))}
                                className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* TRAININGS TAB */}
          {activeTab === 'trainings' && (
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Capacitaciones</h2>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><Plus className="text-indigo-400" /> Crear Nueva Capacitación</h3>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={newTrainingTitle}
                    onChange={e => setNewTrainingTitle(e.target.value)}
                    placeholder="Título de la Capacitación (ej: Seguridad en Altura)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-medium"
                  />
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        value={newLink.title}
                        onChange={e => setNewLink(p => ({ ...p, title: e.target.value }))}
                        placeholder="Título del Enlace (ej: Video 1)"
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
                      />
                      <input 
                        type="url" 
                        value={newLink.url}
                        onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))}
                        placeholder="Enlace de Google Drive"
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
                      />
                    </div>
                    <button 
                      onClick={addLinkToCurrent}
                      className="w-full md:w-auto bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
                    >
                      <LinkIcon size={18} /> Agregar Enlace
                    </button>
                    {currentLinks.length > 0 && (
                      <ul className="space-y-2 mt-4">
                        {currentLinks.map((l, i) => (
                          <li key={i} className="flex items-center justify-between bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
                            <span className="text-sm font-medium">{l.title}</span>
                            <button onClick={() => setCurrentLinks(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 size={16} /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button 
                    onClick={addTraining}
                    disabled={!newTrainingTitle || currentLinks.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    Crear Capacitación
                  </button>
                </div>
              </div>

              {/* Assignments / QR Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {trainings.map(t => (
                  <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xl font-bold">{t.title}</h4>
                      <button onClick={() => setTrainings(prev => prev.filter(x => x.id !== t.id))} className="text-red-400 p-2"><Trash2 size={20} /></button>
                    </div>
                    <p className="text-slate-400 text-sm">{t.items.length} módulos cargados</p>
                    <div className="border-t border-slate-800 pt-4 space-y-4">
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Vincular con Empresa</label>
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2"
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const exists = assignments.find(a => a.trainingId === t.id && a.companyId === e.target.value);
                            if (!exists) {
                              setAssignments(prev => [...prev, { id: crypto.randomUUID(), trainingId: t.id, companyId: e.target.value }]);
                            }
                          }}
                          value=""
                        >
                          <option value="">Seleccionar Empresa...</option>
                          {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-3">
                        {assignments.filter(a => a.trainingId === t.id).map(a => {
                          const comp = companies.find(c => c.id === a.companyId);
                          const employeeLink = `${window.location.origin}${window.location.pathname}#/training/${a.trainingId}/${a.companyId}`;
                          return (
                            <div key={a.id} className="p-4 bg-slate-800 rounded-xl flex items-center justify-between group">
                              <div>
                                <p className="font-bold text-indigo-300">{comp?.name}</p>
                                <p className="text-xs text-slate-500 truncate max-w-[150px]">{employeeLink}</p>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => shareTraining(a)}
                                  className="bg-indigo-500 hover:bg-indigo-400 text-white p-2 rounded-lg"
                                  title="Copiar Link"
                                >
                                  <LinkIcon size={16} />
                                </button>
                                <div className="relative group/qr">
                                  <button 
                                    onClick={() => downloadQRAsFlyer(a, t.title, comp?.name || 'Empresa')}
                                    disabled={shorteningId === a.id}
                                    className="bg-white text-slate-900 p-2 rounded-lg cursor-pointer flex items-center justify-center min-w-[32px]"
                                    title="Descargar Flyer QR"
                                  >
                                    {shorteningId === a.id ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                                  </button>
                                  {/* QR Invisible para exportación de PDF */}
                                  <div id={`qr-hidden-${a.id}`} className="hidden">
                                    <QRCodeSVG value={employeeLink} size={512} />
                                  </div>
                                  {/* Vista previa QR al pasar el mouse */}
                                  <div className="absolute right-0 bottom-full mb-4 hidden group-hover/qr:block bg-white p-4 rounded-xl shadow-2xl z-50">
                                    <QRCodeSVG value={employeeLink} size={150} />
                                    <p className="text-[10px] text-slate-900 mt-2 text-center font-bold">Escanear para acceder</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setAssignments(prev => prev.filter(x => x.id !== a.id))}
                                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* REGISTRY TAB */}
          {activeTab === 'registry' && (
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold">Registro de Asistencia</h2>
                <button 
                  onClick={exportToPDF}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-500/20 transition-all"
                >
                  <Download size={20} /> Exportar Lista (PDF)
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select 
                    value={filterCompany}
                    onChange={e => setFilterCompany(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2"
                  >
                    <option value="">Todas las Empresas</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select 
                    value={filterTraining}
                    onChange={e => setFilterTraining(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2"
                  >
                    <option value="">Todas las Capacitaciones</option>
                    {trainings.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800 text-slate-400 text-sm uppercase">
                      <tr>
                        <th className="px-6 py-4">Empleado</th>
                        <th className="px-6 py-4">DNI</th>
                        <th className="px-6 py-4">Empresa</th>
                        <th className="px-6 py-4">Capacitación</th>
                        <th className="px-6 py-4">Firma</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredAttendances.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">No hay registros que coincidan</td></tr>
                      ) : (
                        filteredAttendances.map(att => (
                          <tr key={att.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 font-medium">{att.employeeName}</td>
                            <td className="px-6 py-4 text-slate-400">{att.employeeDni}</td>
                            <td className="px-6 py-4 text-slate-400">{companies.find(c => c.id === att.companyId)?.name}</td>
                            <td className="px-6 py-4 text-slate-400">{trainings.find(t => t.id === att.trainingId)?.title}</td>
                            <td className="px-6 py-4">
                              {att.employeeSignature && (
                                <img src={att.employeeSignature} alt="Firma" className="h-10 object-contain invert" />
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => setAttendances(prev => prev.filter(x => x.id !== att.id))}
                                className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
