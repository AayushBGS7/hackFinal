import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const Icon = ({ name, className = "" }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const categories = ["Cardiology", "Neurology", "Pediatrics", "Oncology", "Dermatology", "Nephrology", "Pulmonology"];

const doctors = [
  { name: "Dr. Jyoti Gupta", specialty: "Dermatologist", address: "B-43, Soami Nagar South, Panchsheel Enclave, New Delhi, Delhi 110017", phone: "+91 99999 73986", hours: "11:00 AM - 7:30 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Lipy Gupta", specialty: "Dermatologist", address: "S-34, Green Park Main Market, New Delhi, Delhi 110016", phone: "+91 98117 28073", hours: "10:00 AM - 7:30 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Nivedita Dadu", specialty: "Dermatologist", address: "J-12/25, Rajouri Garden Extension, New Delhi, Delhi 110027", phone: "+91 99585 73501", hours: "9:30 AM - 7:30 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Parul Singh", specialty: "Dermatologist", address: "18A Ring Road, Lajpat Nagar IV, New Delhi, Delhi 110024", phone: "+91 98211 25516", hours: "11:00 AM - 7:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Rohit Batra", specialty: "Dermatologist", address: "Sir Ganga Ram Hospital, Rajinder Nagar, New Delhi, Delhi 110060", phone: "+91 98119 77222", hours: "8:00 AM - 8:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Varun Bansal", specialty: "Cardiologist", address: "Apollo Indraprastha Hospital, Sarita Vihar, New Delhi, Delhi 110020", phone: "+91 98992 61481", hours: "9:00 AM - 6:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Amit Mittal", specialty: "Cardiologist", address: "Apollo Hospital, Mathura Road, Sarita Vihar, New Delhi, Delhi 110020", phone: "+91 80629 70138", hours: "9:00 AM - 6:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Ganesh Shivnani", specialty: "Cardiac Surgeon", address: "Sir Ganga Ram Hospital, Rajinder Nagar, New Delhi, Delhi 110060", phone: "+91 99102 98665", hours: "9:00 AM - 6:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Nitesh Rustagi", specialty: "Orthopedic", address: "222, Kalyan Vihar, New Delhi, Delhi 110033", phone: "+91 78958 24814", hours: "10:00 AM - 8:30 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. DK Das", specialty: "Orthopedic", address: "H-1565, Chittaranjan Park, New Delhi, Delhi 110019", phone: "+91 93108 18133", hours: "10:00 AM - 8:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Anil Arora", specialty: "Orthopedic", address: "70, Hargobind Enclave, Karkardooma, New Delhi, Delhi 110092", phone: "011 4214 1516", hours: "9:00 AM - 6:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Usha Kumar", specialty: "Gynecologist", address: "A-119, Dayanand Colony, Lajpat Nagar, New Delhi, Delhi 110024", phone: "+91 99992 93741", hours: "10:00 AM - 8:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Madhu Goel", specialty: "Gynecologist", address: "M-179, Greater Kailash II, New Delhi, Delhi 110048", phone: "+91 98104 80920", hours: "10:00 AM - 6:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Aparna Gupta", specialty: "Neurologist", address: "B4/18, Safdarjung Enclave, New Delhi, Delhi 110029", phone: "+91 92050 22311", hours: "9:00 AM - 8:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Shishir Pandey", specialty: "Neurologist", address: "A-9, Chittaranjan Park, New Delhi, Delhi 110048", phone: "+91 87703 81874", hours: "9:00 AM - 9:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Ravi Kumar Shah", specialty: "Physician", address: "A1 Block, Chhatarpur Extension, New Delhi, Delhi 110074", phone: "+91 83830 66491", hours: "9:00 AM - 9:30 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Vineet Malik", specialty: "Cardiologist", address: "Maharaja Agrasen Hospital, Punjabi Bagh, New Delhi, Delhi 110034", phone: "+91 98111 44613", hours: "9:00 AM - 9:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Sameena Khalil", specialty: "Cardiologist", address: "The Heart Centre, Lajpat Nagar IV, New Delhi, Delhi 110024", phone: "+91 98110 33807", hours: "11:00 AM - 6:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Vivudh Pratap Singh", specialty: "Cardiologist", address: "Near Sukhdev Vihar Metro Station, Okhla, New Delhi, Delhi 110025", phone: "+91 92667 92727", hours: "10:00 AM - 6:00 PM", badge: "Top Rated", badgeColor: "#2b5671" },
  { name: "Dr. Nitika Nijhara", specialty: "Dermatologist", address: "3/10, East Patel Nagar, New Delhi, Delhi 110008", phone: "+91 73037 33445", hours: "11:00 AM - 8:00 PM", badge: "Top Rated", badgeColor: "#2b5671" }
];

// facilities list is now dynamically synced from the live map via postMessage

export default function SpecialistDirectoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);
  const [facilities, setFacilities] = useState([{ name: "Syncing with live map...", distance: "...", status: "Loading", icon: "hourglass_empty" }]);

  useEffect(() => {
    const handleMapSync = (event) => {
      if (event.data && (
        event.data.type === 'HOSPITALS_LOADED' ||
        event.data.type === 'HOME_HOSPITALS_LOADED' ||
        event.data.type === 'PANNED_HOSPITALS'
      )) {
        const { data, mapLat, mapLng } = event.data;
        if (data && data.length > 0) {
          const syncedFacilities = data.map(el => {
            const dLat = (el.lat - mapLat) * 111;
            const dLng = (el.lng - mapLng) * 111 * Math.cos(mapLat * Math.PI / 180);
            const dist = Math.sqrt(dLat * dLat + dLng * dLng).toFixed(1);
            return {
              name: el.name.length > 25 ? el.name.substring(0, 25) + "..." : el.name,
              distance: `${dist} km`,
              status: "Open Map",
              gmLink: el.gmLink,
              icon: el.type === "hospital" ? "local_hospital" : "health_and_safety"
            };
          }).slice(0, 6);
          setFacilities(syncedFacilities);
        } else {
          setFacilities([{ name: "No medical centers found", distance: "--", status: "Zoom or drag map", icon: "info" }]);
        }
      }
    };

    window.addEventListener("message", handleMapSync);
    return () => window.removeEventListener("message", handleMapSync);
  }, []);

  const filteredDoctors = doctors.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || d.specialty.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const displayedDoctors = filteredDoctors.slice(0, visibleCount);

  return (
    <div style={{ backgroundColor: "#f8fafb", color: "#2a3437", minHeight: "100vh" }}>
      <Header />

      <div className="flex pt-20">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto px-6 py-10 pb-20">
          <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
              <h1 className="text-4xl font-headline font-extrabold tracking-tight mb-3">{t('specialistDir.pageTitle')}</h1>
              <p className="max-w-lg" style={{ color: "#566164" }}>{t('specialistDir.pageSubtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 rounded-full text-sm font-bold border" style={{ borderColor: "#1e667f", color: "#1e667f" }}>{t('specialistDir.viewingDirectory')}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-wrap gap-4 mb-10">
            <div className="flex-1 flex items-center px-5 py-3 rounded-xl bg-white border shadow-sm" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
              <Icon name="search" className="mr-3" style={{ color: "#566164" }} />
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(6); }} placeholder={t('specialistDir.searchPlaceholder')} className="flex-1 bg-transparent border-none outline-none text-sm" style={{ color: "#2a3437" }} />
            </div>
            <button className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 bg-white border shadow-sm" style={{ borderColor: "rgba(169,180,183,0.15)", color: "#566164" }}>
              <Icon name="location_on" /> {t('specialistDir.nearMe')}
            </button>
            <div className="relative z-[60]">
              <button onClick={() => setShowFilters(!showFilters)} className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 bg-white border shadow-sm" style={{ borderColor: "rgba(169,180,183,0.15)", color: "#566164" }}>
                <Icon name="tune" /> {selectedCategory !== "All" ? selectedCategory : t('specialistDir.allFilters')}
              </button>
              {showFilters && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-2xl shadow-xl z-50 overflow-hidden" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
                   <div className="px-4 py-2 border-b bg-gray-50 text-[10px] font-bold tracking-widest text-gray-500 uppercase">{t('specialistDir.filterByCategory')}</div>
                   <button onClick={() => { setSelectedCategory("All"); setShowFilters(false); setVisibleCount(6); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 font-bold" style={{ color: selectedCategory === "All" ? "#0d5c75" : "#2a3437" }}>{t('specialistDir.allSpecialists')}</button>
                   {["Cardiologist", "Dermatologist", "Gynecologist", "Neurologist", "Orthopedic", "Physician", "Cardiac Surgeon"].map(cat => (
                     <button key={cat} onClick={() => { setSelectedCategory(cat); setShowFilters(false); setVisibleCount(6); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 font-medium" style={{ color: selectedCategory === cat ? "#0d5c75" : "#2a3437" }}>
                       {cat}
                     </button>
                   ))}
                </div>
              )}
            </div>
          </div>

          {/* Doctor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {displayedDoctors.map((doc) => (
              <div key={doc.name} className="bg-white rounded-[24px] border shadow-sm p-6 hover:shadow-lg transition-shadow flex flex-col" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#cae8ff" }}>
                    <Icon name="person" className="text-[32px]" style={{ color: "#2a3437" }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline font-bold text-xl leading-tight mb-1" style={{ color: "#2a3437" }}>{doc.name}</h3>
                    <p className="text-[15px] font-semibold mb-2" style={{ color: doc.badgeColor }}>{doc.specialty}</p>
                    <span className="inline-block px-4 py-1.5 rounded-full text-[13px] font-bold text-white" style={{ backgroundColor: doc.badgeColor }}>{doc.badge}</span>
                  </div>
                </div>
                <div className="space-y-3.5 text-[15px] mb-6 flex-1" style={{ color: "#566164" }}>
                  <div className="flex items-start gap-3"><Icon name="location_on" className="text-[20px] shrink-0 mt-0.5" /> <span className="leading-snug">{doc.address}</span></div>
                  <div className="flex items-center gap-3"><Icon name="call" className="text-[20px] shrink-0" /> <span>{doc.phone}</span></div>
                  <div className="flex items-center gap-3"><Icon name="schedule" className="text-[20px] shrink-0" /> <span>{doc.hours}</span></div>
                </div>
                <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doc.address)}`, '_blank')} className="w-full mt-auto py-3.5 rounded-xl font-headline font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 text-white shadow-md" style={{ backgroundColor: doc.badgeColor }}>
                  <Icon name="map" className="text-[20px]" /> {t('specialistDir.viewClinic')}
                </button>
              </div>
            ))}
          </div>

          {/* Show More/Less Pagination */}
          <div className="flex justify-center gap-4 mb-16">
            {visibleCount < filteredDoctors.length && (
              <button 
                onClick={() => setVisibleCount(prev => prev + 6)} 
                className="px-8 py-3.5 rounded-xl font-bold text-sm bg-white border hover:bg-gray-50 transition-all hover:shadow-md"
                style={{ borderColor: "rgba(169,180,183,0.3)", color: "#2a3437" }}
              >
                {t('specialistDir.loadMore')}
              </button>
            )}
            {visibleCount > 6 && (
              <button 
                onClick={() => setVisibleCount(6)} 
                className="px-8 py-3.5 rounded-xl font-bold text-sm bg-white border hover:bg-gray-50 transition-all hover:shadow-md"
                style={{ borderColor: "rgba(169,180,183,0.3)", color: "#2a3437" }}
              >
                {t('specialistDir.showLess')}
              </button>
            )}
          </div>

          {/* Location Search — Live Interactive Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 rounded-3xl" style={{ backgroundColor: "#d9e4e8" }}>
            <div>
              <h2 className="text-3xl font-headline font-bold mb-4">{t('specialistDir.nearbyMedical')}</h2>
              <p className="mb-8" style={{ color: "#566164" }}>{t('specialistDir.nearbyDesc')}</p>
              <div className="space-y-4">
                {facilities.map((f, idx) => (
                  <div
                    key={f.name + idx}
                    onClick={() => f.gmLink && window.open(f.gmLink, '_blank')}
                    className={`flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all ${f.gmLink ? 'cursor-pointer hover:border-[#0d5c75]' : ''}`}
                    style={{ border: "1px solid transparent" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#bde9ff", color: "#055972" }}>
                      <Icon name={f.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline font-bold text-sm truncate">{f.name}</h4>
                      <p className="text-xs" style={{ color: "#566164" }}>{f.distance} away • {f.status}</p>
                    </div>
                    {f.gmLink && <Icon name="open_in_new" className="text-sm shrink-0" style={{ color: "#0d5c75" }} />}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg h-full" style={{ backgroundColor: "#c7d5db", minHeight: "550px" }}>
              <iframe
                title="Medical Centers Explorer"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "550px" }}
                loading="lazy"
                allowFullScreen
                allow="geolocation"
                src="/map.html"
              ></iframe>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

