
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Training, Company, Instructor, Attendance } from '../types';
import { CheckCircle2, PlayCircle, Download, FileCheck, LogOut, ChevronRight } from 'lucide-react';
import SignaturePad from '../components/SignaturePad';
import jsPDF from 'jspdf';

interface EmployeeTrainingProps {
  trainings: Training[];
  companies: Company[];
  instructor: Instructor | null;
  onComplete: (att: Attendance) => void;
}

const EmployeeTraining: React.FC<EmployeeTrainingProps> = ({ trainings, companies, instructor, onComplete }) => {
  const { trainingId, companyId } = useParams<{ trainingId: string, companyId: string }>();
  const navigate = useNavigate();

  const training = useMemo(() => trainings.find(t => t.id === trainingId), [trainings, trainingId]);
  const company = useMemo(() => companies.find(c => c.id === companyId), [companies, companyId]);

  const [viewedItems, setViewedItems] = useState<Set<string>>(new Set());
  const [employeeInfo, setEmployeeInfo] = useState({ name: '', dni: '', signature: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!training || !company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h1 className="text-2xl font-bold text-red-400">Error: Capacitación no encontrada</h1>
        <p className="mt-2 text-slate-400">El link puede estar roto o la capacitación fue eliminada.</p>
        <button onClick={() => navigate('/login')} className="mt-6 text-indigo-400 underline">Ir al Login</button>
      </div>
    );
  }

  const progress = Math.round((viewedItems.size / training.items.length) * 100);
  const isComplete = progress === 100;

  const handleMarkAsSeen = (id: string, url: string) => {
    setViewedItems(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    window.open(url, '_blank');
  };

  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeInfo.name || !employeeInfo.dni || !employeeInfo.signature) {
      alert('Por favor complete todos los campos y firme la asistencia.');
      return;
    }

    const attendance: Attendance = {
      id: crypto.randomUUID(),
      employeeName: employeeInfo.name,
      employeeDni: employeeInfo.dni,
      employeeSignature: employeeInfo.signature,
      trainingId: training.id,
      companyId: company.id,
      timestamp: Date.now()
    };

    onComplete(attendance);
    setIsSubmitted(true);
  };

  const downloadCertificate = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Border
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Header
    doc.setFontSize(30);
    doc.setTextColor(30, 41, 59);
    doc.text('CONSTANCIA DE ASISTENCIA', pageWidth / 2, 40, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text('CERTIFICAMOS QUE', pageWidth / 2, 60, { align: 'center' });

    doc.setFontSize(24);
    doc.setTextColor(17, 24, 39);
    doc.text(employeeInfo.name.toUpperCase(), pageWidth / 2, 75, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text(`DNI: ${employeeInfo.dni}`, pageWidth / 2, 85, { align: 'center' });

    doc.line(40, 95, pageWidth - 40, 95);

    doc.setFontSize(14);
    doc.text('Ha participado y completado satisfactoriamente la capacitación:', pageWidth / 2, 110, { align: 'center' });

    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text(training.title, pageWidth / 2, 125, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text(`Para la empresa: ${company.name}`, pageWidth / 2, 140, { align: 'center' });

    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth / 2, 155, { align: 'center' });

    // Bottom signatures
    const footerY = pageHeight - 60;
    
    // Employee Signature
    if (employeeInfo.signature) {
      doc.addImage(employeeInfo.signature, 'PNG', 40, footerY - 30, 40, 20);
    }
    doc.line(30, footerY - 5, 90, footerY - 5);
    doc.setFontSize(10);
    doc.text('Firma del Empleado', 60, footerY, { align: 'center' });

    // Instructor Signature
    if (instructor?.signature) {
      doc.addImage(instructor.signature, 'PNG', pageWidth - 80, footerY - 30, 40, 20);
    }
    doc.line(pageWidth - 90, footerY - 5, pageWidth - 30, footerY - 5);
    doc.setFontSize(10);
    doc.text(instructor?.name || 'Instructor Responsable', pageWidth - 60, footerY, { align: 'center' });
    doc.text(instructor?.role || 'Firma Responsable', pageWidth - 60, footerY + 5, { align: 'center' });

    doc.save(`Constancia-${employeeInfo.name}-${training.title}.pdf`);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-8 animate-in zoom-in-95">
        <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
          <FileCheck size={64} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black">Asistencia Registrada</h1>
          <p className="text-xl text-slate-400 max-w-md mx-auto">
            Gracias <strong>{employeeInfo.name}</strong>. Tu registro para la capacitación <strong>{training.title}</strong> ha sido exitoso.
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button 
            onClick={downloadCertificate}
            className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all"
          >
            <Download size={24} /> Descargar Constancia
          </button>
          <button 
            onClick={() => window.close()}
            className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-2xl font-bold text-lg transition-all"
          >
            <LogOut size={24} /> Salir de la App
          </button>
        </div>
        <p className="text-xs text-slate-600">Puedes cerrar esta pestaña o descargar tu certificado antes de salir.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 p-4 shadow-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-indigo-400">{training.title}</h1>
            <p className="text-xs text-slate-500 uppercase tracking-tighter">{company.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Progreso</p>
              <p className="font-bold">{progress}%</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center relative overflow-hidden">
               <div 
                 className="absolute bottom-0 left-0 w-full bg-indigo-600 transition-all duration-500" 
                 style={{ height: `${progress}%` }}
               />
               <span className="relative z-10 text-[10px] font-bold">{progress}%</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-10">
        {/* Training Content */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PlayCircle className="text-indigo-400" /> Contenido del Módulo
          </h2>
          <div className="grid gap-4">
            {training.items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleMarkAsSeen(item.id, item.url)}
                className={`flex items-center justify-between p-6 rounded-2xl border transition-all text-left group ${
                  viewedItems.has(item.id) 
                  ? 'bg-indigo-500/10 border-indigo-500/30' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    viewedItems.has(item.id) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-sm text-slate-500">Haz clic para ver el material en Drive</p>
                  </div>
                </div>
                {viewedItems.has(item.id) ? (
                  <CheckCircle2 className="text-indigo-500" size={28} />
                ) : (
                  <ChevronRight className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Attendance Form (Only visible when 100%) */}
        <section className={`transition-all duration-700 transform ${isComplete ? 'scale-100 opacity-100' : 'scale-95 opacity-50 pointer-events-none grayscale'}`}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
            {!isComplete && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                <Lock className="text-slate-500 mb-2" size={32} />
                <p className="font-bold text-slate-400">Completa todos los módulos para habilitar la asistencia</p>
              </div>
            )}
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black">Registro de Asistencia</h2>
              <p className="text-slate-400">Completa tus datos y firma digitalmente para finalizar.</p>
            </div>

            <form onSubmit={handleSubmitAttendance} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Nombre y Apellido</label>
                  <input 
                    type="text" 
                    value={employeeInfo.name}
                    onChange={e => setEmployeeInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">DNI</label>
                  <input 
                    type="text" 
                    value={employeeInfo.dni}
                    onChange={e => setEmployeeInfo(prev => ({ ...prev, dni: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Número de documento"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Tu Firma Digital</label>
                <SignaturePad 
                  onSave={sig => setEmployeeInfo(prev => ({ ...prev, signature: sig }))}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-500/20 transform transition active:scale-95 flex items-center justify-center gap-3"
              >
                <FileCheck size={28} /> Finalizar y Registrar
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

// Internal lock icon since it wasn't imported from lucide above
const Lock = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default EmployeeTraining;
