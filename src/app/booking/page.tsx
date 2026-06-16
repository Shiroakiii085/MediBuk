'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Clinic, Doctor, User } from '@/lib/githubDb';
import { 
  Compass, MapPin, Stethoscope, Calendar, Clock, Sparkles, 
  ChevronRight, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Crosshair 
} from 'lucide-react';
import { geocodeAddress } from '@/lib/geocode';

// Dynamic import Leaflet map
const LeafletMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] w-full bg-slate-100 flex items-center justify-center text-sm text-slate-500 rounded-2xl animate-pulse">
      Đang tải bản đồ số...
    </div>
  )
});

// Haversine formula to calculate distance in km
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// Remove diacritics for smart string matching
function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd');
}

export default function BookingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Step state: 1 = Address, 2 = Clinic, 3 = Symptoms & Doctor, 4 = Time & Confirm
  const [step, setStep] = useState(1);
  const [loadingData, setLoadingData] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [blockedSlots, setBlockedSlots] = useState<{ display: string }[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);

  // DB Data
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [profile, setProfile] = useState<User | null>(null);

  // User input states
  const [addressSource, setAddressSource] = useState<'profile' | 'custom'>('profile');
  const [addressText, setAddressText] = useState('');
  const [userLat, setUserLat] = useState(21.0285);
  const [userLng, setUserLng] = useState(105.8542);

  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [symptomInput, setSymptomInput] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [symptomSuggestions, setSymptomSuggestions] = useState<{name: string; description: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const symptomInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch initial clinics, doctors, and user profile
  useEffect(() => {
    async function loadData() {
      try {
        const [resDb, resProfile] = await Promise.all([
          fetch('/api/booking'),
          fetch('/api/profile')
        ]);
        
        if (!resDb.ok || !resProfile.ok) throw new Error('Không thể tải tài nguyên từ máy chủ.');
        
        const dbData = await resDb.json();
        const profileData = await resProfile.json();

        setClinics(dbData.clinics || []);
        setDoctors(dbData.doctors || []);
        
        if (profileData.profile) {
          setProfile(profileData.profile);
          setAddressText(profileData.profile.address);
          setUserLat(profileData.profile.lat || 21.0285);
          setUserLng(profileData.profile.lng || 105.8542);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Lỗi tải dữ liệu.');
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  // Update address selection coordinates when source changes
  const handleAddressSourceChange = (source: 'profile' | 'custom') => {
    setAddressSource(source);
    if (source === 'profile' && profile) {
      setAddressText(profile.address);
      setUserLat(profile.lat || 21.0285);
      setUserLng(profile.lng || 105.8542);
    } else {
      setAddressText('');
      setUserLat(21.0285);
      setUserLng(105.8542);
    }
    setSelectedClinic(null);
    setSelectedDoctor(null);
  };

  // Click on map to pick a location if using temporary coordinates
  const handleMapLocationSelect = (lat: number, lng: number) => {
    if (addressSource === 'custom') {
      setUserLat(parseFloat(lat.toFixed(6)));
      setUserLng(parseFloat(lng.toFixed(6)));
    }
  };

  // Auto-geocode from address text
  const handleAutoGeocode = async () => {
    if (!addressText.trim()) return;
    setGeoLoading(true);
    try {
      const result = await geocodeAddress(addressText);
      if (result) {
        setUserLat(result.lat);
        setUserLng(result.lng);
      }
    } finally {
      setGeoLoading(false);
    }
  };

  // Fetch symptom suggestions
  const fetchSymptomSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSymptomSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/symptoms?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSymptomSuggestions(data.symptoms || []);
    } catch {
      setSymptomSuggestions([]);
    }
  }, []);

  // Calculate sorted clinics with distances, filter within 50km
  const clinicsWithDistance = useMemo(() => {
    return clinics.map(c => {
      const dist = getHaversineDistance(userLat, userLng, c.lat, c.lng);
      return { ...c, distance: dist };
    }).filter(c => c.distance <= 50).sort((a, b) => a.distance - b.distance);
  }, [clinics, userLat, userLng]);

  // Map markers for clinics & user
  const mapMarkers = useMemo(() => {
    const list: {
      lat: number;
      lng: number;
      title: string;
      description?: string;
      color?: 'blue' | 'sky' | 'rose' | 'amber';
    }[] = clinicsWithDistance.map(c => ({
      lat: c.lat,
      lng: c.lng,
      title: c.name,
      description: `Khoảng cách: ${c.distance} km. Chuyên khoa: ${c.specialties}`,
      color: selectedClinic?.clinic_id === c.clinic_id ? 'blue' : 'rose'
    }));

    // Add user marker
    list.push({
      lat: userLat,
      lng: userLng,
      title: "Vị trí của bạn",
      description: addressText || "Địa chỉ hiện tại",
      color: 'blue'
    });

    return list;
  }, [clinicsWithDistance, userLat, userLng, selectedClinic, addressText]);

  // Matching doctors by symptoms algorithm
  const matchedDoctors = useMemo(() => {
    if (!selectedClinic) return [];

    // Filter doctors under selected clinic first
    const clinicDocs = doctors.filter(
      d => d.clinic_id.toString() === selectedClinic.clinic_id.toString()
    );

    if (!symptomInput.trim()) {
      return clinicDocs.map(d => ({ ...d, score: 0, matchedKeywords: [] }));
    }

    const cleanInput = removeDiacritics(symptomInput);

    const doctorsScored = clinicDocs.map(doc => {
      const symptomsList = doc.symptoms_handled.split(';');
      const matchedKeywords: string[] = [];
      let score = 0;

      symptomsList.forEach(symptom => {
        const cleanSymptom = removeDiacritics(symptom.trim());
        // Simple substring check
        if (cleanSymptom && cleanInput.includes(cleanSymptom)) {
          score += 1;
          matchedKeywords.push(symptom.trim());
        }
      });

      return {
        ...doc,
        score,
        matchedKeywords
      };
    });

    // If no matching symptoms found at all, return default score 0 list
    const hasAnyMatch = doctorsScored.some(d => d.score > 0);
    if (!hasAnyMatch) {
      return clinicDocs.map(d => ({ ...d, score: 0, matchedKeywords: [] }));
    }

    // Sort descending by score
    return doctorsScored.sort((a, b) => b.score - a.score);
  }, [selectedClinic, doctors, symptomInput]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedClinic || !bookingDate || !bookingTime || !session) return;

    setErrorMessage('');
    setBlockedSlots([]);

    // Validate không cho đặt lịch trong quá khứ
    const now = new Date();
    const selectedDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
    if (selectedDateTime <= now) {
      setErrorMessage('Không thể đặt lịch vào thời điểm đã qua. Vui lòng chọn ngày giờ在未来.');
      return;
    }

    setBookingLoading(true);

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: session.user.name,
          patient_email: session.user.email,
          doctor_id: selectedDoctor.doctor_id,
          clinic_id: selectedClinic.clinic_id,
          date: bookingDate,
          time: bookingTime,
          duration_minutes: durationMinutes,
          symptom: symptomInput || 'Không ghi rõ triệu chứng'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setErrorMessage(data.error);
          setBlockedSlots(data.occupiedSlots || []);
        } else {
          setErrorMessage(data.error || 'Đã có lỗi xảy ra.');
        }
      } else {
        router.push('/dashboard?success=booking');
      }
    } catch (err) {
      setErrorMessage('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="animate-spin mb-4" width="48" height="48" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="22" width="48" height="20" rx="4" fill="#dc2626" />
            <rect x="22" y="8" width="20" height="48" rx="4" fill="#dc2626" />
          </svg>
          <p className="text-sm font-medium text-slate-600 animate-pulse">Đang chuẩn bị quy trình đặt lịch khám...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Đặt lịch khám bệnh online</h1>
        <p className="mt-2 text-sm text-slate-500">Hoàn thành quy trình 4 bước đặt lịch dễ dàng bằng tiếng Việt.</p>
      </div>

      {/* Booking Steps Progress Indicator */}
      <div className="mb-10 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[
            { stepNum: 1, label: 'Địa chỉ khám', icon: MapPin },
            { stepNum: 2, label: 'Chọn bệnh viện', icon: Compass },
            { stepNum: 3, label: 'Triệu chứng & Bác sĩ', icon: Stethoscope },
            { stepNum: 4, label: 'Chọn ngày giờ', icon: Calendar }
          ].map((item, idx) => {
            const Icon = item.icon;
            const isCompleted = step > item.stepNum;
            const isCurrent = step === item.stepNum;
            
            return (
              <div key={idx} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-bold border transition-colors ${
                    isCompleted 
                      ? 'bg-primary border-primary text-white' 
                      : isCurrent 
                        ? 'bg-white border-primary text-primary ring-4 ring-primary/10' 
                        : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-primary font-bold' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-0.5 mx-4 transition-colors ${isCompleted ? 'bg-primary' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main interactive form card */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
          
          {/* STEP 1: Address Input & Source */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-950 flex items-center gap-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                Bước 1: Chọn nguồn địa điểm
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleAddressSourceChange('profile')}
                  className={`p-5 rounded-2xl border text-left transition-all relative ${
                    addressSource === 'profile'
                      ? 'border-primary bg-primary-light/20 ring-2 ring-primary/10'
                      : 'border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <p className="font-bold text-slate-900">Địa chỉ trong hồ sơ</p>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-1">{profile?.address || 'Chưa cập nhật địa chỉ'}</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddressSourceChange('custom')}
                  className={`p-5 rounded-2xl border text-left transition-all relative ${
                    addressSource === 'custom'
                      ? 'border-primary bg-primary-light/20 ring-2 ring-primary/10'
                      : 'border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <p className="font-bold text-slate-900">Địa chỉ mới cho lần này</p>
                  <p className="text-sm text-slate-500 mt-2">Nhập thủ công hoặc định vị qua bản đồ</p>
                </button>
              </div>

              {addressSource === 'custom' && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa chỉ khám mới</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={addressText}
                        onChange={(e) => setAddressText(e.target.value)}
                        className="block w-full rounded-xl border border-slate-300 py-3 px-3 pr-12 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/100 sm:text-sm"
                        placeholder="Số nhà, Tên đường, Quận, Tỉnh"
                      />
                      <button
                        type="button"
                        onClick={handleAutoGeocode}
                        disabled={geoLoading || !addressText.trim()}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary hover:text-primary disabled:text-slate-300 transition-colors"
                        title="Tự động lấy tọa độ từ địa chỉ"
                      >
                        <Crosshair className={`h-5 w-5 ${geoLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Nhấn GPS để tự động lấy tọa độ, hoặc click vào bản đồ</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vĩ độ (Latitude)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={userLat}
                        onChange={(e) => setUserLat(parseFloat(e.target.value) || 0)}
                        className="block w-full rounded-xl border border-slate-300 py-3 px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/100 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kinh độ (Longitude)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={userLng}
                        onChange={(e) => setUserLng(parseFloat(e.target.value) || 0)}
                        className="block w-full rounded-xl border border-slate-300 py-3 px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/100 sm:text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 italic">Click vào bản đồ ở cột bên phải để tự động lấy tọa độ nhanh.</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!addressText}
                  className="px-6 py-3 bg-primary hover:bg-sky-700 text-white font-semibold rounded-xl flex items-center gap-x-1 transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-primary/10"
                >
                  <span>Tiếp tục</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Clinic selection */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-950 flex items-center gap-x-2">
                <Compass className="h-5 w-5 text-primary" />
                Bước 2: Chọn bệnh viện gần bạn nhất
              </h2>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {clinicsWithDistance.map((c) => (
                  <div
                    key={c.clinic_id}
                    onClick={() => {
                      setSelectedClinic(c);
                      setSelectedDoctor(null);
                    }}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      selectedClinic?.clinic_id === c.clinic_id
                        ? 'border-primary bg-primary-light/10 ring-2 ring-primary/10'
                        : 'border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900">{c.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{c.address}</p>
                      </div>
                      <span className="text-xs font-semibold text-primary bg-primary-light px-2.5 py-1 rounded-full border border-sky-200 shrink-0">
                        {c.distance} km
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {c.specialties.split(';').map((spec, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-x-1 text-slate-600 hover:text-slate-800 font-semibold py-2 px-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!selectedClinic}
                  className="px-6 py-3 bg-primary hover:bg-sky-700 text-white font-semibold rounded-xl flex items-center gap-x-1 transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-primary/10"
                >
                  <span>Tiếp tục</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Symptoms Input & Doctor Filter */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-950 flex items-center gap-x-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Bước 3: Nhập triệu chứng & Chọn bác sĩ phù hợp
              </h2>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả triệu chứng bệnh lý</label>
                <div className="relative">
                  <textarea
                    ref={symptomInputRef}
                    value={symptomInput}
                    onChange={(e) => {
                      setSymptomInput(e.target.value);
                      setSelectedDoctor(null);
                      fetchSymptomSuggestions(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="block w-full rounded-xl border border-slate-300 py-3 px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/100 sm:text-sm h-24"
                    placeholder="Ví dụ: tôi bị đau đầu, mệt mỏi và sốt nhẹ từ tối qua..."
                  />
                  {showSuggestions && symptomSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {symptomSuggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0"
                          onMouseDown={() => {
                            setSymptomInput(prev => prev ? `${prev}, ${s.name}` : s.name);
                            setShowSuggestions(false);
                          }}
                        >
                          <span className="font-medium text-slate-800">{s.name}</span>
                          <span className="text-xs text-slate-500 ml-2">- {s.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Gõ triệu chứng để nhận gợi ý tự động</p>
              </div>

              {selectedClinic && (
                <div className="space-y-4">
                  <span className="block text-sm font-semibold text-slate-700">Danh sách bác sĩ gợi ý ({selectedClinic.name}):</span>
                  
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                    {matchedDoctors.map((doc) => {
                      const isRecommended = doc.score > 0;
                      return (
                        <div
                          key={doc.doctor_id}
                          onClick={() => setSelectedDoctor(doc as any)}
                          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all relative ${
                            selectedDoctor?.doctor_id === doc.doctor_id
                              ? 'border-primary bg-primary-light/10 ring-2 ring-primary/10'
                              : 'border-slate-200 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-900">{doc.name}</h4>
                              <p className="text-xs text-slate-500 mt-1">Chuyên khoa: <span className="font-semibold text-primary">{doc.specialty}</span></p>
                              <p className="text-xs text-slate-400 mt-1">Giờ làm việc: {doc.work_hours}</p>
                            </div>
                            
                            {isRecommended && (
                              <span className="inline-flex items-center gap-x-1 text-[10px] font-bold text-primary bg-primary-light border border-sky-200 px-2 py-0.5 rounded-full shrink-0">
                                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                                Phù hợp nhất
                              </span>
                            )}
                          </div>
                          
                          {/* Reason for match */}
                          {isRecommended && (
                            <div className="mt-3 pt-2 border-t border-dashed border-sky-100 text-[11px] text-primary flex flex-wrap gap-1">
                              <span className="font-semibold">Lý do gợi ý:</span>
                              Khớp với triệu chứng: {doc.matchedKeywords.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-x-1 text-slate-600 hover:text-slate-800 font-semibold py-2 px-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!selectedDoctor}
                  className="px-6 py-3 bg-primary hover:bg-sky-700 text-white font-semibold rounded-xl flex items-center gap-x-1 transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-primary/10"
                >
                  <span>Tiếp tục</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Pick schedule & submit */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-950 flex items-center gap-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                Bước 4: Chọn thời gian khám & xác nhận
              </h2>

              {errorMessage && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700 mb-6">
                  <div className="flex items-start gap-x-2">
                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{errorMessage}</p>
                      {blockedSlots.length > 0 && (
                        <div className="mt-2 text-xs">
                          <p className="font-bold text-slate-700">Các khung giờ bác sĩ đã có hẹn trong ngày này:</p>
                          <ul className="list-disc pl-4 mt-1 space-y-1">
                            {blockedSlots.map((slot, idx) => (
                              <li key={idx} className="font-semibold text-rose-600">{slot.display}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Ngày khám */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày khám bệnh</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]} // limit past dates
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 py-3 px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/100 sm:text-sm"
                    />
                  </div>

                  {/* Giờ khám */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giờ khám bệnh (Dạng HH:MM)</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Clock className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="time"
                        required
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/100 sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Thời lượng */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thời lượng dự kiến (phút)</label>
                    <select
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                      className="block w-full rounded-xl border border-slate-300 py-3 px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/100 sm:text-sm bg-white"
                    >
                      <option value={15}>15 phút</option>
                      <option value={30}>30 phút (Mặc định)</option>
                      <option value={45}>45 phút</option>
                      <option value={60}>60 phút</option>
                    </select>
                  </div>

                </div>

                {/* Summary panel before confirmation */}
                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-sm text-slate-600">
                  <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-xs">Tổng hợp lịch hẹn khám:</h4>
                  <p><strong>Người khám:</strong> {session?.user.name} ({session?.user.email})</p>
                  <p><strong>Bác sĩ:</strong> {selectedDoctor?.name} ({selectedDoctor?.specialty})</p>
                  <p><strong>Tại:</strong> {selectedClinic?.name} - {selectedClinic?.address}</p>
                  {bookingDate && bookingTime && (
                    <p className="text-primary font-semibold">
                      <strong>Thời gian:</strong> {bookingTime} ngày {bookingDate.split('-').reverse().join('/')} ({durationMinutes} phút)
                    </p>
                  )}
                  <p><strong>Triệu chứng của bạn:</strong> {symptomInput || 'Không có mô tả chi tiết'}</p>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex items-center gap-x-1 text-slate-600 hover:text-slate-800 font-semibold py-2 px-4"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading || !bookingDate || !bookingTime}
                    className="px-6 py-3 bg-primary hover:bg-sky-700 text-white font-semibold rounded-xl flex items-center gap-x-2 transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-primary/10 hover:shadow-primary/20"
                  >
                    {bookingLoading ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Đang lưu lịch hẹn & gửi Email...</span>
                      </>
                    ) : (
                      <span>Xác nhận & Đặt lịch</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Right Side: Map & Sidebar details */}
        <div className="space-y-8">
          
          {/* MAP Container */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-950 mb-3 flex items-center gap-x-1.5">
              <MapPin className="h-5 w-5 text-primary" />
              Bản đồ định vị bệnh viện
            </h3>
            <div className="h-[350px]">
              <LeafletMap 
                center={[userLat, userLng]} 
                markers={mapMarkers} 
                onLocationSelect={handleMapLocationSelect} 
              />
            </div>
            {addressSource === 'custom' && step === 1 && (
              <p className="text-[11px] text-slate-400 mt-2 text-center">Click vào bất kỳ vị trí nào trên bản đồ để cập nhật tọa độ tìm kiếm.</p>
            )}
          </div>

          {/* Selected Booking details preview widget */}
          {(selectedClinic || selectedDoctor) && (
            <div className="bg-sky-950 text-sky-50 p-6 rounded-3xl border border-sky-900 shadow-sm space-y-4">
              <h3 className="text-sm font-bold tracking-wider text-sky-400 uppercase">Thông tin đã chọn:</h3>
              {selectedClinic && (
                <div>
                  <p className="text-xs text-sky-300">BỆNH VIỆN:</p>
                  <p className="text-sm font-bold">{selectedClinic.name}</p>
                  <p className="text-[11px] text-sky-200 line-clamp-1">{selectedClinic.address}</p>
                </div>
              )}
              {selectedDoctor && (
                <div className="pt-2 border-t border-sky-900">
                  <p className="text-xs text-sky-300">BÁC SĨ KHÁM:</p>
                  <p className="text-sm font-bold">{selectedDoctor.name}</p>
                  <p className="text-xs text-sky-200">Chuyên khoa: {selectedDoctor.specialty}</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
