import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Clock, User, ChevronLeft, ChevronRight, Check, X, CalendarIcon } from 'lucide-react';
import { Appointment } from '../../types';
import { apiService } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { formatDateTime } from '../../utils/formatters';

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 to 18:00

export const RendezVousPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDatePivot, setCurrentDatePivot] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(d.setDate(diff));
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Reschedule Modal State
  const [rescheduleAptId, setRescheduleAptId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const loadAgenda = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getDoctorAgenda();
      setAppointments(data);
    } catch (e) {
      setAppointments(apiService.getAppointments());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgenda();
  }, []);

  const handlePrev = () => {
    const newDate = new Date(currentDatePivot);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDatePivot(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDatePivot);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDatePivot(newDate);
  };

  const weekDays = useMemo(() => {
    // Determine the monday of the current pivot
    const d = new Date(currentDatePivot);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [currentDatePivot]);

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.dateTime);
      return aptDate.toDateString() === date.toDateString();
    }).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  };

  const updateAppointmentStatus = async (id: string, newStatus: Appointment['status']) => {
    try {
      if (newStatus === 'CONFIRME') {
        await apiService.approveDoctorAppointment(id);
      } else if (newStatus === 'ANNULE') {
        await apiService.cancelDoctorAppointment(id, 'Annulé par le praticien');
      } else {
        apiService.updateAppointment(id, { status: newStatus });
      }
    } catch (e) {
      console.warn('Fallback updateAppointment:', e);
      apiService.updateAppointment(id, { status: newStatus });
    }
    await loadAgenda();
  };

  const handleReschedule = (id: string) => {
    setRescheduleAptId(id);
  };

  const submitReschedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rescheduleAptId) return;
    const formData = new FormData(e.currentTarget);
    const dateStr = formData.get('date') as string;
    const timeStr = formData.get('time') as string;
    
    if (dateStr && timeStr) {
      try {
        await apiService.rescheduleDoctorAppointment(rescheduleAptId, dateStr, timeStr);
      } catch (e) {
        console.warn('Fallback reschedule:', e);
        const newDateTime = `${dateStr}T${timeStr}`;
        apiService.updateAppointment(rescheduleAptId, { dateTime: newDateTime, status: 'PROGRAMME' });
      }
      await loadAgenda();
      setRescheduleAptId(null);
    }
  };

  const selectedDayAppointments = selectedDate ? getAppointmentsForDay(selectedDate) : [];

  const renderWeekView = () => (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-x-auto">
      <div className="min-w-[800px] flex flex-col h-full">
        {/* Calendar Header (Days) */}
        <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-slate-200 bg-slate-50/50 shrink-0">
        <div className="p-4 flex items-end justify-center border-r border-slate-200">
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
        {weekDays.map((date, i) => {
          const isToday = date.toDateString() === new Date().toDateString();
          const isSelected = selectedDate?.toDateString() === date.toDateString();

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(date)}
              className={`p-4 border-r border-slate-200 last:border-r-0 flex flex-col items-center transition-colors
                ${isSelected ? 'bg-sky-50' : 'hover:bg-slate-50'}
              `}
            >
              <span className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isToday ? 'text-sky-600' : 'text-slate-500'}`}>
                {date.toLocaleDateString('fr-FR', { weekday: 'long' })}
              </span>
              <span className={`text-2xl font-light ${isToday ? 'text-sky-600 font-medium' : 'text-slate-800'}`}>
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Calendar Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_repeat(5,1fr)] min-h-[800px] h-full">
          {/* Timeline Column */}
          <div className="border-r border-slate-200 bg-slate-50/30 flex flex-col">
            {HOURS.map(hour => (
              <div key={hour} className="flex-1 border-b border-slate-100 flex items-start justify-center pt-2">
                <span className="text-xs text-slate-400 font-medium">{hour}:00</span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((date, colIdx) => {
            const dayAppointments = getAppointmentsForDay(date);

            return (
              <div
                key={colIdx}
                className="border-r border-slate-200 last:border-r-0 flex flex-col relative cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setSelectedDate(date)}
              >
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                  {HOURS.map(hour => (
                    <div key={hour} className="flex-1 border-b border-slate-50" />
                  ))}
                </div>

                {/* Appointment Blocks */}
                {dayAppointments.map(apt => {
                  const aptDate = new Date(apt.dateTime);
                  const startHour = aptDate.getHours();
                  const startMinutes = aptDate.getMinutes();

                  let topPercentage = ((startHour - 8) + (startMinutes / 60)) / HOURS.length * 100;
                  if (topPercentage < 0) topPercentage = 0;
                  if (topPercentage > 95) topPercentage = 95;

                  const statusColors = {
                    'PROGRAMME': 'bg-amber-100 border-amber-200 text-amber-800 border-l-4 border-l-amber-500',
                    'CONFIRME': 'bg-emerald-100 border-emerald-200 text-emerald-800 border-l-4 border-l-emerald-500',
                    'ANNULE': 'bg-rose-100 border-rose-200 text-rose-800 border-l-4 border-l-rose-500',
                    'TERMINE': 'bg-slate-100 border-slate-200 text-slate-800 border-l-4 border-l-slate-500'
                  };

                  return (
                    <div
                      key={apt.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedDate(date); }}
                      className={`absolute left-1 right-1 rounded-md border p-2 text-xs shadow-sm hover:shadow-md transition-shadow overflow-hidden
                        ${statusColors[apt.status as keyof typeof statusColors] || statusColors['PROGRAMME']}
                      `}
                      style={{
                        top: `${topPercentage}%`,
                        height: '60px',
                        zIndex: 10
                      }}
                    >
                      <div className="font-bold truncate">{apt.patientName}</div>
                      <div className="opacity-80 truncate">{apt.reason}</div>
                      <div className="text-[10px] mt-1 font-medium opacity-70">
                        {aptDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );

  const renderMonthView = () => {
    const year = currentDatePivot.getFullYear();
    const month = currentDatePivot.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay() === 0 ? 7 : firstDay.getDay(); // 1 = Monday

    const days = [];

    // Empty cells
    for (let i = 1; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border-r border-b border-slate-100 bg-slate-50/30"></div>);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const dayAppointments = getAppointmentsForDay(date);

      days.push(
        <div
          key={i}
          onClick={() => setSelectedDate(date)}
          className={`min-h-[120px] p-2 border-r border-b border-slate-100 cursor-pointer transition-colors relative flex flex-col
            ${isSelected ? 'bg-sky-50' : 'hover:bg-slate-50'}
          `}
        >
          <span className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-600 text-white' : 'text-slate-700'}`}>
            {i}
          </span>
          <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px]">
            {dayAppointments.slice(0, 3).map(apt => (
              <div key={apt.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate
                  ${apt.status === 'PROGRAMME' ? 'bg-amber-100 text-amber-800' : ''}
                  ${apt.status === 'CONFIRME' ? 'bg-emerald-100 text-emerald-800' : ''}
                  ${apt.status === 'ANNULE' ? 'bg-rose-100 text-rose-800' : ''}
                  ${apt.status === 'TERMINE' ? 'bg-slate-100 text-slate-800' : ''}
               `}>
                {apt.patientName}
              </div>
            ))}
            {dayAppointments.length > 3 && (
              <div className="text-[10px] text-slate-500 font-medium px-1">
                +{dayAppointments.length - 3} autres
              </div>
            )}
          </div>
        </div>
      );
    }

    // Fill remaining cells for grid consistency
    const totalCells = days.length;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<div key={`empty-end-${i}`} className="p-2 border-r border-b border-slate-100 bg-slate-50/30"></div>);
    }

    return (
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 shrink-0">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="p-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 border-r border-slate-200 last:border-r-0">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1 overflow-y-auto content-start">
          {days}
        </div>
      </div>
    );
  };

  const getHeaderText = () => {
    if (viewMode === 'week') {
      return `${weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${weekDays[4].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return currentDatePivot.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="h-[80vh] flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
            <CalendarDays className="w-7 h-7 text-[#0f172a]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">Agenda</h1>
            <p className="text-slate-500 mt-1 text-sm">Cliquez sur une date pour voir les détails et approuver les demandes.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('week')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mois
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
            <button onClick={handlePrev} className="p-1 text-slate-400 hover:text-slate-800 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-slate-700 min-w-[140px] text-center capitalize">
              {getHeaderText()}
            </span>
            <button onClick={handleNext} className="p-1 text-slate-400 hover:text-slate-800 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 relative">
        {/* Calendar Switcher */}
        {viewMode === 'week' ? renderWeekView() : renderMonthView()}

        {/* Side Panel (Appears when a date is selected) */}
        {selectedDate && (
          <div className="absolute inset-0 md:relative md:inset-auto w-full md:w-[400px] shrink-0 bg-white md:rounded-2xl shadow-2xl md:shadow-lg border-l md:border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300 z-30">
            <div className="p-6 border-b border-slate-100 bg-[#1b3b31] text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold capitalize">
                  {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>
                <p className="text-white/70 text-sm mt-1">{selectedDayAppointments.length} rendez-vous</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              {selectedDayAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">Aucun rendez-vous ce jour.</p>
                </div>
              ) : (
                selectedDayAppointments.map(apt => (
                  <div key={apt.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(apt.dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <Badge variant={
                        apt.status === 'PROGRAMME' ? 'warning' :
                          apt.status === 'CONFIRME' ? 'success' :
                            apt.status === 'ANNULE' ? 'danger' : 'default'
                      }>
                        {apt.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{apt.patientName}</h3>
                        <p className="text-xs font-mono text-slate-500 bg-slate-50 inline-block px-1.5 py-0.5 rounded mt-0.5 border border-slate-100">{apt.patientMatricule}</p>
                      </div>
                    </div>

                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                      <span className="font-semibold text-slate-700 block mb-1">Motif:</span>
                      {apt.reason}
                    </div>

                    {/* Actions if PROGRAMME */}
                    {apt.status === 'PROGRAMME' && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 mt-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, 'CONFIRME')}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            Approuver
                          </button>
                          <button
                            onClick={() => handleReschedule(apt.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Clock className="w-4 h-4 text-slate-400" />
                            Reprogrammer
                          </button>
                        </div>
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'ANNULE')}
                          className="w-full flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Refuser la demande
                        </button>
                      </div>
                    )}
                    {apt.status === 'CONFIRME' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
                        <button
                          onClick={() => handleReschedule(apt.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Reprogrammer
                        </button>
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'ANNULE')}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 py-2 rounded-lg text-xs font-medium transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleAptId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-6 h-6 text-[#1b3b31]" />
                Reprogrammer
              </h2>
              <button 
                onClick={() => setRescheduleAptId(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitReschedule} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nouvelle date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1b3b31] focus:ring-2 focus:ring-[#1b3b31]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nouvelle heure</label>
                  <input
                    type="time"
                    name="time"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1b3b31] focus:ring-2 focus:ring-[#1b3b31]/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRescheduleAptId(null)}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#1b3b31] text-white rounded-xl font-medium hover:bg-[#142c24] transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
