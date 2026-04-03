import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Target, LoaderCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import * as L from "leaflet";
import 'leaflet/dist/leaflet.css';

// Чиним дефолтные иконки маркера
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface DeliveryMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: string, lat: number | null, lon: number | null) => void;
  currentAddress?: string | null;
  currentLat?: number | null;
  currentLon?: number | null;
}

const fetchAddress = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&accept-language=en`
    );
    if (!response.ok) throw new Error("Network error");
    const result = await response.json();
    return result.display_name || 'Address not found';
  } catch (error) {
    console.error("Geocoding error:", error);
    return 'Error getting address';
  }
};

export function DeliveryMapModal({ isOpen, onClose, onConfirm, currentAddress, currentLat, currentLon }: DeliveryMapModalProps) {
  const defaultCenter: [number, number] = [43.2389, 76.9455];

  const [selectedLocation, setSelectedLocation] = useState<L.LatLng | null>(null);
  // 🔥 ДОБАВИЛИ СТЕЙТ ДЛЯ ВТОРОЙ ТОЧКИ (Искомый адрес)
  const [searchedLocation, setSearchedLocation] = useState<L.LatLng | null>(null);
  
  const [addressString, setAddressString] = useState<string>('');
  
  // 🔥 ИЗМЕНИЛИ ТИП ПОДСКАЗОК (теперь храним и текст, и координаты)
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [isSaved, setIsSaved] = useState(false);

  // При открытии модалки определяем центр карты
  useEffect(() => {
    if (isOpen) {
      // Если есть сохранённые координаты — ставим пин
      if (currentLat != null && currentLon != null) {
        setSelectedLocation(L.latLng(currentLat, currentLon));
      } else {
        setSelectedLocation(null);
      }
      setAddressString(currentAddress || '');
      setIsGeocoding(false);
      setIsConfirming(false);

      if (currentLat != null && currentLon != null) {
        setMapCenter([currentLat, currentLon]);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          },
          () => {
            setMapCenter(defaultCenter);
          }
        );
      } else {
        setMapCenter(defaultCenter);
      }
    }
  }, [isOpen, currentAddress, currentLat, currentLon]);

  // 🔥 ЧИСТАЯ ЛОГИКА ЗАЖАТИЯ (LONG-PRESS)
  // Автокомплит адреса через Nominatim
  useEffect(() => {
    if (isInputFocused && addressString.length > 2) {
      const controller = new AbortController();
      fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(addressString)}&accept-language=ru`, { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          setSuggestions(data);
        })
        .catch(() => setSuggestions([]));
      return () => controller.abort();
    } else {
      setSuggestions([]);
    }
  }, [addressString, isInputFocused]);

  function handleSuggestionClick(s: any) {
    setAddressString(s.display_name);
    
    // Создаем координаты из ответа Nominatim
    const latLng = L.latLng(parseFloat(s.lat), parseFloat(s.lon));
    setSearchedLocation(latLng); // Ставим красную точку
    setMapCenter([parseFloat(s.lat), parseFloat(s.lon)]); // Двигаем камеру к ней!
    
    setSuggestions([]);
    setIsInputFocused(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAddressString(e.target.value);
    setSelectedLocation(null); // сбрасываем пин, если пользователь вручную вводит адрес
  }

  function handleInputFocus(e: React.FocusEvent<HTMLInputElement>) {
    setIsInputFocused(true);
    
    // 🔥 Вот эта строчка выделяет весь текст в инпуте!
    e.target.select(); 
  }

  function handleInputBlur() {
    setTimeout(() => setIsInputFocused(false), 200); // чтобы успеть кликнуть по подсказке
  }

  function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
      map.setView(center, map.getZoom()); // Плавно (или резко) переносим камеру
    }, [center, map]);
    return null;
  }

  function MapEvents() {
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startPress = (e: any) => {
      if (pressTimer.current) return;
      pressTimer.current = setTimeout(async () => {
        pressTimer.current = null;
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setSelectedLocation(e.latlng);
        setIsGeocoding(true);
        setAddressString('Locating...');
        const address = await fetchAddress(lat, lng);
        setAddressString(address);
        setIsGeocoding(false);
      }, 600);
    };
    const cancelPress = () => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
    };
    useMapEvents({
      mousedown: startPress,
      mouseup: cancelPress,
      mouseout: cancelPress,
      mousemove: cancelPress,
    });
    return null;
  }

  const handleConfirmAddress = async () => {
    if (!addressString || isGeocoding) return;
    setIsConfirming(true);
    
    // 🔥 Если есть синяя точка (клик) — берем её. Иначе берем красную (поиск). Иначе старую из БД.
    let lat = selectedLocation ? selectedLocation.lat : (searchedLocation ? searchedLocation.lat : (currentLat ?? null));
    let lon = selectedLocation ? selectedLocation.lng : (searchedLocation ? searchedLocation.lng : (currentLon ?? null));

    // Если пользователь вручную ввёл адрес, пробуем получить координаты через Nominatim
    if (!selectedLocation && addressString) {
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(addressString)}&limit=1`);
        const data = await resp.json();
        if (data && data[0]) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
        }
      } catch {}
    }
    // Вызываем сохранение (тот самый fetch из Profile.tsx)
    await onConfirm(addressString, lat, lon);

    setIsConfirming(false);

    // 🔥 ЭФФЕКТ "СОХРАНЕНО"
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000); // Через 2 секунды кнопка вернется в обычный вид
    };

    const isButtonEnabled = !!addressString && !isGeocoding;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
          />

          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              maxHeight: '90vh', minHeight: '60vh', overflow: 'hidden', zIndex: 101,
              backgroundColor: '#0a0a0a', borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column'
            }}
          >
            <div style={{ width: '40px', height: '4px', backgroundColor: '#374151', borderRadius: '2px', margin: '16px auto', flexShrink: 0 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px 16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Target color="#a855f7" size={24} /> Delivery Location
              </h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}>
                <X size={26} />
              </button>
            </div>
            
            <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, rgba(168,85,247,0) 0%, rgba(168,85,247,0.5) 50%, rgba(168,85,247,0) 100%)', marginBottom: '20px' }}></div>

                <div style={{ height: '50vh', position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <MapContainer 
                  center={mapCenter} 
                  zoom={13} 
                  zoomControl={false} 
                  style={{ height: '100%', width: '100%', backgroundColor: '#1a1a1a' }}
                >
                <MapUpdater center={mapCenter} />
                <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
                {selectedLocation && <Marker position={selectedLocation} />}
                {searchedLocation && <Marker position={searchedLocation} icon={redIcon} />}
                {/* Вставляем наш компонент событий сюда: */}
                <MapEvents />
              </MapContainer> 
              {/* 🔥 ТУТ БЫЛА ОШИБКА, теперь правильно закрыто! */}
            </div>

            <div style={{ padding: '24px 20px', backgroundColor: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ position: 'relative', marginBottom: '16px', zIndex: 1000 }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: addressString ? '#a855f7' : '#6b7280', display: 'flex', alignItems: 'center' }}>
                    {isGeocoding ? <LoaderCircle size={20} className="animate-spin" /> : <MapPin size={20} />}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={addressString}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Начните вводить адрес или зажмите на карте..."
                    style={{
                      width: '100%', backgroundColor: 'rgba(23, 23, 23, 1)', border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px', padding: '16px 16px 16px 20px', fontSize: '14px', color: '#ffffff',
                      fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}
                  />
                  {isInputFocused && suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', 
                      left: 0, 
                      right: 0, 
                      bottom: '100%', // 🔥 ГЛАВНОЕ: теперь привязываем низ списка к верху инпута (было top: '100%')
                      marginBottom: '8px', // Отступ от инпута, чтобы они не слипались
                      zIndex: 10,
                      background: '#18181b', 
                      border: '1px solid #a855f7', 
                      borderRadius: '12px 12px 0 0', // 🔥 Скругляем ВЕРХНИЕ углы вместо нижних
                      maxHeight: 180, 
                      overflowY: 'auto',
                      boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.5)' // Добавили тень сверху, чтобы список красиво "парил" над инпутом
                    }}>
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          onMouseDown={() => handleSuggestionClick(s)}
                          style={{ padding: '10px 16px', color: '#fff', cursor: 'pointer', borderBottom: '1px solid #27272a' }}
                        >
                          {s.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <motion.button 
                whileTap={isButtonEnabled ? { scale: 0.98 } : {}}
                disabled={!isButtonEnabled || isConfirming}
                onClick={handleConfirmAddress}
                style={{
                  width: '100%',
                  backgroundColor: isSaved ? '#22c55e' : (isButtonEnabled ? '#a855f7' : '#374151'), 
                  color: isButtonEnabled ? '#ffffff' : '#9ca3af',
                  border: 'none', padding: '16px', borderRadius: '12px', fontSize: '16px',
                  fontWeight: 700, cursor: isButtonEnabled ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'all 0.2s',
                  boxShadow: isButtonEnabled ? '0 4px 14px rgba(168, 85, 247, 0.3)' : 'none'
                }}
              >
                {isGeocoding 
                ? 'Locating...' 
                : (isSaved ? '✓ Address Saved!' : (addressString ? 'Confirm Address' : 'Long-press on the map'))}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}