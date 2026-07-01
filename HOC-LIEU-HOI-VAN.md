# DANH MUC TONG HAT HAM & CHUC NANG - DU AN MEDIBUK

---

## 1. THU VIEN / LIB (`src/lib/`)

### 1.1. `githubDb.ts` - Lop truy van du lieu CSV qua GitHub API

| Ham | Tham so | Mo ta |
|-----|---------|-------|
| `castValues(file, row)` | file: ten CSV, row: dong du lieu | Chuyen doi kieu truong so trong CSV (lat/lng -> float, duration_minutes -> int) |
| `readCSV<T>(fileName)` | fileName: ten file CSV | Doc du lieu tu GitHub (Octokit), fallback local. Co cache in-memory 60s. Tra ve mang T[] |
| `writeCSV<T>(fileName, data)` | fileName: ten file, data: mang du lieu | Ghi du lieu len GitHub voi retry 3 lan (xu ly conflict 409), fallback local. Huy cache |

**Interfaces:**
- `User` (user_id, email, password_hash, full_name, address, lat, lng, role, phone)
- `Clinic` (clinic_id, name, address, lat, lng, specialties)
- `Doctor` (doctor_id, name, clinic_id, specialty, symptoms_handled, work_hours)
- `Appointment` (appointment_id, user_id, patient_name, patient_email, doctor_id, clinic_id, date, time, duration_minutes, status, symptom)

### 1.2. `auth.ts` - Cau hinh NextAuth.js

| Ham | Mo ta |
|-----|-------|
| `authorize(credentials)` | Xac thuc nguoi dung: tim email trong CSV, so sanh mat khau bang bcrypt |
| JWT callback | Luu id + role vao token khi dang nhap, cap nhat khi trigger "update" |
| Session callback | Gan id + role tu token vao session.user |

### 1.3. `geocode.ts` - Dich vu geocoding

| Ham | Tham so | Mo ta |
|-----|---------|-------|
| `geocodeAddress(address)` | address: dia chi text | Chuyen dia chi thanh toa do (lat, lng) bang Nominatim/OpenStreetMap. Them ", Viet Nam" vao query |

---

## 2. API ROUTES (`src/app/api/`)

### 2.1. `api/auth/signup/route.ts` - Dang ky tai khoan

| Ham | Mo ta |
|-----|-------|
| `POST` | Validate du lieu, kiem tra email trung lap, hash mat khau bang bcrypt (salt=10), tao user moi voi role 'patient', ghi vao users.csv |

### 2.2. `api/auth/[...nextauth]/route.ts` - NextAuth handler

| Ham | Mo ta |
|-----|-------|
| `GET/POST` | Route handler mac dinh cua NextAuth, xu ly signin/signout/session/callback |

### 2.3. `api/booking/route.ts` - Dat lich kham

| Ham | Tham so | Mo ta |
|-----|---------|-------|
| `timeToMinutes(timeStr)` | "HH:MM" | Chuyen gio thanh so phut tu luc 00:00 |
| `isOverlapping(s1,e1,s2,e2)` | 4 so phut | Kiem tra 2 khoang thoi gian co trung lap khong |
| `minutesToTimeStr(mins)` | so phut | Chuyen so phut thanh "HH:MM" |
| `formatDate(dateStr)` | "YYYY-MM-DD" | Dinh dang "DD/MM/YYYY" |
| `GET` | - | Lay danh sach tat ca clinics va doctors |
| `POST` | patient_name, patient_email, doctor_id, clinic_id, date, time, duration_minutes, symptom | Tao lich hen: kiem tra trung lich (409), ghi CSV, gui email xac nhan |

### 2.4. `api/dashboard/route.ts` - Dashboard & Quan tri

| Ham | Mo ta |
|-----|-------|
| `getTodayStr()` | Tra ve "YYYY-MM-DD" ngay hom nay |
| `GET` | Lay du lieu dashboard: tu dong xoa lich qua khu, phan quyen admin/patient |
| `POST: cancelAppointment` | Huy lich (doi status thanh 'cancelled') |
| `POST: deleteAppointment` | Xoa vinh vien lich hen |
| `POST: addClinic` | Them phong kham moi (auto-generate ID) |
| `POST: editClinic` | Sua thong tin phong kham |
| `POST: deleteClinic` | Xoa phong kham |
| `POST: addDoctor` | Them bac si moi (auto-generate doc_N) |
| `POST: editDoctor` | Sua thong tin bac si |
| `POST: deleteDoctor` | Xoa bac si |

### 2.5. `api/profile/route.ts` - Quan ly ho so

| Ham | Mo ta |
|-----|-------|
| `GET` | Lay thong tin ho so (loai bo password_hash) |
| `POST: updateProfile` | Cap nhat ho ten, dia chi, toa do, dien thoai |
| `POST: changePassword` | Doi mat khau (xac thuc mat khau cu bang bcrypt) |

### 2.6. `api/symptoms/route.ts` - Tim kiem trieu chung

| Ham | Mo ta |
|-----|-------|
| `GET?q=` | Tim kiem trieu chung theo ten (bo dau, khong phan biet hoa/thuong), tra ve toi da 10 ket qua |

### 2.7. `api/chat/route.ts` - Chatbot AI MediDora

| Ham | Mo ta |
|-----|-------|
| `buildSystemPrompt()` | Xay dung system prompt tu du lieu CSV (benh vien, bac si, trieu chung), dinh nghia workflow tu van |
| `POST` | Chat voi AI qua OpenRouter: 5 model fallback, moi model retry 2 lan, streaming SSE, content filtering |

### 2.8. `api/cron/remind/route.ts` - Gui email nho lich

| Ham | Mo ta |
|-----|-------|
| `getVietnamDateStr(dayOffset)` | Lay ngay theo gio Viet Nam (GMT+7) |
| `formatDate(dateStr)` | Dinh dang "DD/MM/YYYY" |
| `sendReminders(targetDate)` | Gui email nho lich qua Gmail SMTP cho tat ca lich hen trong ngay |
| `GET` | Cron job tu dong (Vercel cron, 01:00 UTC/ngay) |
| `POST` | Gui thu cong tu Dashboard (admin only) |

---

## 3. REACT COMPONENTS (`src/components/` & `src/app/`)

### 3.1. `Providers.tsx`
- **`Providers`**: Boc goi SessionProvider cua NextAuth

### 3.2. `Navbar.tsx`
- **`Navbar`**: Thanh dieu huong sticky, logo MediBuk, link trang (Trang chu, Dat lich, Dashboard, Tai khoan), hien ten + vai tro nguoi dung, nut dang xuat, menu mobile

### 3.3. `ChatBot.tsx`
- **`DoraemonIcon({size})`**: Hien thi anh Doraemon
- **`ChatBot`**: Widget chat truc tuyen MediDora. Mo/dong, gui tin nhan streaming, goi y, cuon tu dong

### 3.4. `Map.tsx`
- **`MapController({center})`**: Cap nhat view ban do khi center thay doi
- **`MapClickHandler({onSelect})`**: Lang nghe click tren ban do
- **`Map({center, markers, onLocationSelect, zoom})`**: Ban do Leaflet voi SVG markers, OpenStreetMap tiles

### 3.5. `LoadingSpinner.tsx`
- **`LoadingSpinner`**: Man hinh loading toan man hinh voi SVG animated

### 3.6. `layout.tsx` - Root Layout
- Lay server session, load font Figtree, render Providers + Navbar + main + footer + ChatBot

### 3.7. `page.tsx` - Trang chu
- **`Home`**: Landing page voi Hero, Features (tim theo trieu chung, dinh vi, xac nhan/nho lich), Coverage 13 thanh pho, CTA

### 3.8. `auth/signin/page.tsx` - Dang nhap
- **`SignInForm`**: Form email + mat khau, goi signIn('credentials'), xu loi Viet Nam
- **`getErrorMessage(errType)`**: Chuyen doi ma loi thanh thong bao hieu ung

### 3.9. `auth/signup/page.tsx` - Dang ky
- **`SignUp`**: Form ho ten, email, SĐT, mat khau, dia chi + GPS geocode, toa do

### 3.10. `booking/page.tsx` - Dat lich 4 buoc

| Ham/Memo | Mo ta |
|----------|-------|
| `getHaversineDistance(lat1,lon1,lat2,lon2)` | Tinh khoang cach theo cong thuc Haversine (km) |
| `removeDiacritics(str)` | Bo dau tieng Viet de so sanh chuoi |
| `clinicsWithDistance` (useMemo) | Sap xep benh vien theo khoang cach, loc trong 50km |
| `mapMarkers` (useMemo) | Tao danh sach marker cho ban do |
| `matchedDoctors` (useMemo) | Matching bac si theo trieu chung (score + keyword) |
| `handleAddressSourceChange` | Chon nguon dia chi (ho so / nhap moi) |
| `handleMapLocationSelect` | Chon vi tri tren ban do |
| `handleAutoGeocode` | Lay toa do tu dia chi bang Nominatim |
| `fetchSymptomSuggestions` | Tim kiem goi y trieu chung |
| `handleBookingSubmit` | Gui yeu cau dat lich, xu ly 409 trung lich |

### 3.11. `dashboard/page.tsx` - Dashboard

| Ham | Mo ta |
|-----|-------|
| `loadDashboard` | Tai du lieu tu API, phan quyen admin/patient |
| `handleCancelAppointment` | Huy lich hen |
| `handleDeleteAppointment` | Xoa vinh vien lich hen |
| `openClinicModal` | Mo modal them/sua phong kham |
| `handleClinicSubmit` | Submit form phong kham |
| `handleDeleteClinic` | Xoa phong kham |
| `openDoctorModal` | Mo modal them/sua bac si |
| `handleDoctorSubmit` | Submit form bac si |
| `handleDeleteDoctor` | Xoa bac si |
| `handleSendReminder` | Gui email nho lich thu cong |
| `formatDate` | Dinh dang ngay "DD/MM/YYYY" |

### 3.12. `account/page.tsx` - Tai khoan

| Ham | Mo ta |
|-----|-------|
| `fetchProfile` | Tai ho so tu API |
| `handleAutoGeocode` | Lay toa do tu dia chi |
| `handleProfileSave` | Luu thong tin moi, cap nhat session |
| `handlePasswordSave` | Doi mat khau |
| `handleMapSelect` | Chon vi tri tren ban do |

---

## 4. MIDDLEWARE (`src/middleware.ts`)

| Ham | Mo ta |
|-----|-------|
| `withAuth` | Bao ve routes: /dashboard/*, /booking/*, /account/* - yeu cau token hop le |

---

## 5. TONG KET SO LUONG

| Loai | So luong |
|------|----------|
| Interfaces/Types | 8 |
| Exported Functions/Handlers | 22+ |
| React Components | 15+ |
| Private Helper Functions | 35+ |
| API Routes | 10 endpoints |
