import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { 
  Calendar as CalendarIcon, Clock, MapPin, Download, 
  ChevronLeft, ChevronRight, Filter, Eye, Sparkles, Building2, Bell,
  Briefcase, CheckCircle2, ArrowRight, X, ExternalLink, Video
} from 'lucide-react';

const PlacementCalendarPanel = ({ onSwitchTab }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'list' : 'month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dayEventsModal, setDayEventsModal] = useState(null); // { dateStr, events: [] }
  const [eventTypeFilter, setEventTypeFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/calendar/events');
      const evs = res.data.events || [];
      setEvents(evs);

      // Auto-focus calendar view: if there is an upcoming interview or active event, focus on that month
      const now = new Date();
      const upcoming = evs.find(e => e.type === 'interview' && new Date(e.date) >= now) ||
                       evs.find(e => new Date(e.date) >= now);
      if (upcoming) {
        const uDate = new Date(upcoming.date);
        setCurrentDate(new Date(uDate.getFullYear(), uDate.getMonth(), 1));
      } else {
        setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
      }
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Convert date to IST YYYY-MM-DD
  const toISTDateString = (dateInput) => {
    if (!dateInput) return '';
    try {
      const d = new Date(dateInput);
      return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // Format: YYYY-MM-DD
    } catch {
      return '';
    }
  };

  // Format date display in IST
  const formatISTDate = (dateInput) => {
    if (!dateInput) return '';
    try {
      return new Date(dateInput).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return new Date(dateInput).toDateString();
    }
  };

  // Extract unique companies for filtering
  const companyOptions = useMemo(() => {
    const set = new Set();
    events.forEach(e => {
      if (e.companyName && e.companyName !== 'Unknown Company') {
        set.add(e.companyName);
      }
    });
    return Array.from(set).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      let matchType = false;
      if (eventTypeFilter === 'All') {
        matchType = true;
      } else if (eventTypeFilter === 'Technical Interview' || eventTypeFilter === 'Interview') {
        matchType = e.type === 'interview' || 
                    e.eventType === 'Technical Interview' || 
                    e.eventType === 'Technical Round' || 
                    e.eventType === 'HR Round' ||
                    (e.eventType && e.eventType.toLowerCase().includes('interview')) ||
                    (e.eventType && e.eventType.toLowerCase().includes('round'));
      } else {
        matchType = e.eventType === eventTypeFilter;
      }
      const matchCompany = companyFilter === 'All' || e.companyName === companyFilter;
      return matchType && matchCompany;
    });
  }, [events, eventTypeFilter, companyFilter]);

  // Export .ics calendar file
  const exportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//JIMS Placement Management System//EN\n";
    filteredEvents.forEach(e => {
      const d = new Date(e.date);
      const startFormatted = d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      icsContent += `BEGIN:VEVENT\nSUMMARY:${e.title}\nDESCRIPTION:${e.description || e.title}\nLOCATION:${e.venue || 'Campus'}\nDTSTART:${startFormatted}\nDTEND:${startFormatted}\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'placement-drive-calendar.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEventBadgeColor = (color) => {
    switch (color) {
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      case 'amber': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'emerald': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'purple': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build accurate month days grid
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Sun .. 6=Sat
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];
    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthTotalDays - i;
      const dObj = new Date(year, month - 1, dNum);
      days.push({
        dayNumber: dNum,
        isCurrentMonth: false,
        date: dObj,
        istKey: toISTDateString(dObj)
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dObj = new Date(year, month, d);
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        date: dObj,
        istKey: toISTDateString(dObj)
      });
    }

    // Next month filler days to complete grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const dObj = new Date(year, month + 1, n);
      days.push({
        dayNumber: n,
        isCurrentMonth: false,
        date: dObj,
        istKey: toISTDateString(dObj)
      });
    }

    return days;
  }, [currentDate]);

  // Group events by IST date key
  const eventsByDate = useMemo(() => {
    const map = {};
    filteredEvents.forEach(ev => {
      const key = toISTDateString(ev.date);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [filteredEvents]);

  const todayIST = toISTDateString(new Date());

  return (
    <div className="space-y-8 animate-fade-in pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="inline-block bg-blue-500/20 text-blue-200 px-3.5 py-1 rounded-full text-xs font-semibold mb-3 border border-blue-400/30">
            🗓️ Real-Time Campus Placement Calendar
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight">Placement Drive Schedule & Deadlines</h2>
          <p className="mt-2 text-blue-100/80 text-sm max-w-xl leading-relaxed">
            Never miss an on-campus drive, aptitude test slot, or application deadline. All events are synchronized in Indian Standard Time (IST).
          </p>
        </div>

        <button
          onClick={exportICS}
          className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 shadow-md transition flex items-center gap-2 text-xs shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export (.ics / Google Calendar)
        </button>
      </div>

      {/* Filter and View Switcher Toolbar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl w-full lg:w-auto">
          {['month', 'list'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 lg:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                viewMode === mode ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode} View
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              aria-label="Filter by Event Type"
              className="w-full sm:w-48 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              value={eventTypeFilter}
              onChange={e => setEventTypeFilter(e.target.value)}
            >
              <option value="All">All Event Types</option>
              <option value="Placement Drive">Placement Drives</option>
              <option value="Application Deadline">Application Deadlines</option>
              <option value="Technical Interview">Interviews</option>
              <option value="Pre-Placement Talk">Pre-Placement Talks (PPT)</option>
              <option value="Hackathon">Hackathons</option>
              <option value="Skill Workshop">Skill Workshops</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              aria-label="Filter by Company"
              className="w-full sm:w-48 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
            >
              <option value="All">All Companies</option>
              {companyOptions.map(comp => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: 'All Events', val: 'All', count: events.length },
          { label: 'Placement Drives', val: 'Placement Drive', count: events.filter(e => e.eventType === 'Placement Drive').length },
          { label: 'Application Deadlines', val: 'Application Deadline', count: events.filter(e => e.eventType === 'Application Deadline').length },
          { 
            label: 'Technical Interviews', 
            val: 'Technical Interview', 
            count: events.filter(e => 
              e.type === 'interview' || 
              e.eventType === 'Technical Interview' || 
              e.eventType === 'Technical Round' || 
              e.eventType === 'HR Round' || 
              (e.eventType && e.eventType.toLowerCase().includes('interview')) ||
              (e.eventType && e.eventType.toLowerCase().includes('round'))
            ).length 
          },
          { label: 'Skill Workshops', val: 'Skill Workshop', count: events.filter(e => e.eventType === 'Skill Workshop').length },
          { label: 'Hackathons', val: 'Hackathon', count: events.filter(e => e.eventType === 'Hackathon').length },
        ].map(pill => {
          const isSelected = eventTypeFilter === pill.val;
          return (
            <button
              key={pill.val}
              onClick={() => setEventTypeFilter(pill.val)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{pill.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Events List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 text-slate-400">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 text-sm">
              No calendar events found for this filter.
            </div>
          ) : (
            filteredEvents.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedEvent(item)}
                className="bg-white p-6 sm:p-7 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getEventBadgeColor(item.color)}`}>
                      {item.eventType}
                    </span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {item.companyName}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-1">{item.description}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                      {formatISTDate(item.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      {item.startTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {item.venue}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3 w-full md:w-auto justify-end pt-2 md:pt-0">
                  {item.package && (
                    <span className="font-extrabold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      {item.package}
                    </span>
                  )}
                  <button className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs hover:bg-blue-100 flex items-center gap-1 cursor-pointer">
                    <Eye className="w-3.5 h-3.5" /> Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Events Month Grid View */}
      {viewMode === 'month' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          {/* Navigation Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-extrabold text-slate-900">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={handleToday}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 pb-2 border-b border-slate-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Real Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 min-h-[420px]">
            {monthDays.map((cell, idx) => {
              const dayEvs = eventsByDate[cell.istKey] || [];
              const isToday = cell.istKey === todayIST;

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] p-2 rounded-2xl border transition flex flex-col justify-between ${
                    cell.isCurrentMonth
                      ? isToday
                        ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-400/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-50/50 border-slate-100 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${
                      isToday 
                        ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]' 
                        : cell.isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      {cell.dayNumber}
                    </span>
                    {dayEvs.length > 0 && cell.isCurrentMonth && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    {dayEvs.slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className={`px-1.5 py-1 rounded-md text-[10px] font-semibold truncate cursor-pointer transition border ${
                          ev.color === 'amber'
                            ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            : ev.color === 'red'
                            ? 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100'
                            : ev.color === 'purple'
                            ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                            : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                        }`}
                        title={`${ev.title} (${ev.companyName})`}
                      >
                        {ev.companyName !== 'Unknown Company' ? `${ev.companyName}: ` : ''}{ev.title}
                      </div>
                    ))}
                    {dayEvs.length > 2 && (
                      <button
                        onClick={() => setDayEventsModal({ dateStr: cell.istKey, dateFormatted: formatISTDate(cell.date), events: dayEvs })}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline block text-left pt-0.5 cursor-pointer"
                      >
                        +{dayEvs.length - 2} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multiple Events for Day Popup Modal */}
      {dayEventsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">Events on {dayEventsModal.dateFormatted}</h4>
                <p className="text-xs text-slate-500">{dayEventsModal.events.length} activities scheduled</p>
              </div>
              <button
                onClick={() => setDayEventsModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {dayEventsModal.events.map(ev => (
                <div
                  key={ev.id}
                  onClick={() => {
                    setDayEventsModal(null);
                    setSelectedEvent(ev);
                  }}
                  className="p-3 bg-slate-50 hover:bg-blue-50 rounded-2xl border border-slate-200 hover:border-blue-200 cursor-pointer transition"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-800">{ev.companyName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getEventBadgeColor(ev.color)}`}>
                      {ev.eventType}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 mt-1">{ev.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> {ev.startTime}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-fade-in border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getEventBadgeColor(selectedEvent.color)}`}>
                  {selectedEvent.eventType}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{selectedEvent.title}</h3>
                <p className="text-xs font-bold text-blue-700 flex items-center gap-1 mt-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {selectedEvent.companyName}
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <span><span className="font-bold text-slate-800">Date & Time:</span> {formatISTDate(selectedEvent.date)} at {selectedEvent.startTime}</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><span className="font-bold text-slate-800">Venue / Platform:</span> {selectedEvent.venue}</span>
              </p>
              {selectedEvent.package && (
                <p className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span><span className="font-bold text-slate-800">Compensation:</span> {selectedEvent.package}</span>
                </p>
              )}
              {selectedEvent.minCgpa > 0 && (
                <p><span className="font-bold text-slate-800">Minimum CGPA:</span> {selectedEvent.minCgpa}</p>
              )}
              {selectedEvent.eligibleBranches?.length > 0 && (
                <p><span className="font-bold text-slate-800">Eligible Branches:</span> {selectedEvent.eligibleBranches.join(', ')}</p>
              )}
              {selectedEvent.description && (
                <p className="mt-2 text-slate-700 leading-relaxed border-t border-slate-200/60 pt-2 font-normal">
                  {selectedEvent.description}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              {selectedEvent.type === 'interview' ? (
                <>
                  {selectedEvent.meetingLink && (
                    <a
                      href={selectedEvent.meetingLink.startsWith('http') ? selectedEvent.meetingLink : `https://${selectedEvent.meetingLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" /> Join Virtual Meeting
                    </a>
                  )}
                  {onSwitchTab && (
                    <button
                      onClick={() => {
                        setSelectedEvent(null);
                        onSwitchTab('schedule');
                      }}
                      className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" /> View in Interview Schedule
                    </button>
                  )}
                </>
              ) : selectedEvent.jobId ? (
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    navigate('/jobs');
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5" /> View & Apply for Job
                </button>
              ) : (
                <button
                  onClick={() => {
                    alert(`Reminder set for ${selectedEvent.title}!`);
                    setSelectedEvent(null);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" /> Set Campus Reminder
                </button>
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementCalendarPanel;
