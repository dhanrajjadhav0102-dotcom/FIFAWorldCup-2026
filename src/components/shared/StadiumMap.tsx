import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Info,
  ShieldAlert,
  Award,
  Coffee,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  RefreshCw,
  Compass,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Button, Card, Badge } from '../ui/Primitives';

interface Facility {
  id: string;
  name: string;
  type: 'entrance' | 'seating' | 'food' | 'restroom' | 'medical' | 'parking' | 'exit';
  x: number; // coordinates relative to 500x500 box
  y: number;
  desc: string;
}

export const StadiumMap: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'entrance' | 'seating' | 'food' | 'restroom' | 'medical' | 'parking' | 'exit'>('all');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  // 3D Camera coordinates
  const [zoom, setZoom] = useState(0.9);
  const [rotateZ, setRotateZ] = useState(-25);
  const [rotateX, setRotateX] = useState(55);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Drag-to-pan states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Route calculation planner
  const [startPoint, setStartPoint] = useState('Gate A (North Entrance)');
  const [endPoint, setEndPoint] = useState('VIP Seating Section');
  const [routeSteps, setRouteSteps] = useState<string[]>([]);
  const [showRoutePath, setShowRoutePath] = useState(false);
  const [crowdLevel, setCrowdLevel] = useState<'low' | 'moderate' | 'high'>('moderate');

  const facilities: Facility[] = [
    { id: 'f-1', name: 'Gate A (North Entrance)', type: 'entrance', x: 250, y: 45, desc: 'Main public gate & security screening' },
    { id: 'f-2', name: 'Gate B (East Entrance)', type: 'entrance', x: 455, y: 250, desc: 'East gate & tickets box office' },
    { id: 'f-3', name: 'Gate C (South Entrance)', type: 'entrance', x: 250, y: 455, desc: 'South entry point' },
    { id: 'f-4', name: 'Gate D (West Entrance)', type: 'entrance', x: 45, y: 250, desc: 'West general entrance' },
    
    { id: 'f-5', name: 'VIP Seating Section', type: 'seating', x: 250, y: 160, desc: 'Premium suites and box tiers' },
    { id: 'f-6', name: 'Category 1 Seating', type: 'seating', x: 250, y: 340, desc: 'Lower pitch side seats' },
    { id: 'f-7', name: 'Category 2 Seating', type: 'seating', x: 160, y: 250, desc: 'Mid-tier seats East' },
    { id: 'f-8', name: 'Category 3 Seating', type: 'seating', x: 340, y: 250, desc: 'Upper tier supporter block' },

    { id: 'f-9', name: 'Lusail Grill Concessions', type: 'food', x: 130, y: 130, desc: 'Hot burgers, shawarma, and soft drinks' },
    { id: 'f-10', name: 'Pizza Hub Corner', type: 'food', x: 370, y: 370, desc: 'Fresh oven-baked pizza slices' },
    
    { id: 'f-11', name: 'North Restrooms', type: 'restroom', x: 170, y: 80, desc: 'Male, female, and accessible washrooms' },
    { id: 'f-12', name: 'South Restrooms', type: 'restroom', x: 330, y: 420, desc: 'Male, female, and accessible washrooms' },
    
    { id: 'f-13', name: 'Red Cross Medical Room A', type: 'medical', x: 200, y: 100, desc: 'First aid, emergency care & AED' },
    { id: 'f-14', name: 'Paramedic Station B', type: 'medical', x: 300, y: 400, desc: 'Emergency response logistics' },

    { id: 'f-15', name: 'Public Parking Lot A', type: 'parking', x: 80, y: 420, desc: 'General supporter parking zone' },
    { id: 'f-16', name: 'VIP Parking Lot B', type: 'parking', x: 420, y: 80, desc: 'VIP pass holders and staff parking' },

    { id: 'f-17', name: 'Evacuation Exit Alpha', type: 'exit', x: 60, y: 60, desc: 'Emergency evacuation assembly point North' },
    { id: 'f-18', name: 'Evacuation Exit Beta', type: 'exit', x: 440, y: 440, desc: 'Emergency evacuation assembly point South' }
  ];

  const points = {
    starts: ['Gate A (North Entrance)', 'Gate B (East Entrance)', 'Gate C (South Entrance)', 'Gate D (West Entrance)'],
    ends: ['VIP Seating Section', 'Category 1 Seating', 'Category 2 Seating', 'Category 3 Seating']
  };

  const crowdData = {
    low: { text: 'Low Congestion', color: 'success' as const, note: 'All lines are clear. Smooth entry through gates.' },
    moderate: { text: 'Moderate Queues', color: 'warning' as const, note: 'Expected wait times at Gates A & B around 5-10 minutes.' },
    high: { text: 'High Density Alert', color: 'danger' as const, note: 'Major delays around Gate B. Security recommends Gate C for entry.' }
  };

  const handleRouteSearch = () => {
    const steps = [
      `Arrive at ${startPoint} and proceed through geofence check-in.`,
      `Head straight past security gate screening point.`,
      `Follow coordinates past the concessions arena and take level escalators.`,
      `Navigate towards ${endPoint} entry ramp.`,
      `Secure your ticket check-in and proceed to seat row.`
    ];
    setRouteSteps(steps);
    setShowRoutePath(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetCamera = () => {
    setZoom(0.9);
    setRotateZ(-25);
    setRotateX(55);
    setPanX(0);
    setPanY(0);
    setSelectedFacility(null);
    setShowRoutePath(false);
  };

  const filteredFacilities = activeFilter === 'all' 
    ? facilities 
    : facilities.filter(f => f.type === activeFilter);

  // SVG coordinates mapping for route calculations
  const getCoordinatesOfPoint = (name: string): { x: number; y: number } => {
    const found = facilities.find(f => f.name === name);
    return found ? { x: found.x, y: found.y } : { x: 250, y: 250 };
  };

  const startCoords = getCoordinatesOfPoint(startPoint);
  const endCoords = getCoordinatesOfPoint(endPoint);

  // Emojis for facility map pins
  const pinEmojis = {
    entrance: '🎫',
    seating: '🪑',
    food: '🍔',
    restroom: '🚻',
    medical: '🏥',
    parking: '🚗',
    exit: '🚪'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 3D MAP CAMERA BLOCK */}
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-fifa-gold-light uppercase tracking-wider flex items-center">
            <Compass className="w-4.5 h-4.5 mr-1.5 animate-spin text-fifa-gold" />
            Interactive 3D Arena Visualizer
          </h3>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-1">
            {(['all', 'entrance', 'seating', 'food', 'restroom', 'medical', 'parking', 'exit'] as const).map(f => (
              <button
                key={f}
                onClick={() => {
                  setActiveFilter(f);
                  setSelectedFacility(null);
                }}
                className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded-lg border transition-colors ${
                  activeFilter === f
                    ? 'bg-fifa-burgundy text-white border-fifa-burgundy'
                    : 'bg-fifa-cardDark border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Map Canvas Box */}
        <div 
          className="bg-fifa-cardDark/85 border border-gray-800/80 rounded-2xl aspect-[16/10] relative overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-inner flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Instruction helper */}
          <span className="absolute top-3 left-4 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
            🖱️ Drag to pan • Scroll / Controls to Zoom
          </span>

          {/* Perspective Container */}
          <div 
            className="w-[500px] h-[500px] relative transition-transform duration-75"
            style={{
              transform: `perspective(1000px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) translate3d(${panX}px, ${panY}px, 0px) scale(${zoom})`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* STADIUM 3D GROUND LAYER */}
            <div className="absolute inset-0 bg-fifa-dark/40 rounded-full border border-gray-800/60 shadow-2xl flex items-center justify-center" style={{ transform: 'translateZ(-5px)' }}>
              {/* Outer parking Ring */}
              <div className="w-[94%] aspect-square rounded-full border-2 border-dashed border-gray-800/30 flex items-center justify-center">
                {/* Security Perimeter */}
                <div className="w-[82%] aspect-square rounded-full border-4 border-dashed border-gray-700/20 flex items-center justify-center">
                  
                  {/* Seating Tiers Structure */}
                  <div 
                    className="w-[72%] aspect-square rounded-full bg-gradient-to-br from-fifa-burgundy/10 to-fifa-gold/5 border-4 border-gray-850 flex items-center justify-center relative shadow-2xl"
                    style={{ transform: 'translateZ(10px)' }}
                  >
                    
                    {/* Interior Pitch Ring */}
                    <div className="w-[58%] aspect-square rounded-full border-2 border-gray-800/80 flex items-center justify-center bg-fifa-dark/90">
                      
                      {/* Green Football Field */}
                      <div className="w-[55%] h-[36%] bg-emerald-700/25 border border-emerald-500/30 rounded flex items-center justify-center relative shadow-lg">
                        <div className="absolute inset-0 border-r border-emerald-500/20 w-1/2" />
                        <div className="w-8 h-8 rounded-full border border-emerald-500/20" />
                        <span className="text-[7px] font-black text-emerald-400/20 uppercase tracking-widest">KOLHAPUR</span>
                      </div>
                      
                    </div>

                    {/* Sector Ring Labels */}
                    <span className="absolute top-2 text-[8px] font-black text-fifa-gold-light tracking-wide uppercase">VIP Boxes</span>
                    <span className="absolute bottom-2 text-[8px] font-black text-blue-400 tracking-wide uppercase">Tier 1 Seat</span>
                    <span className="absolute left-2 text-[8px] font-black text-purple-400 tracking-wide uppercase rotate-90 origin-center translate-y-[-2px]">Tier 2</span>
                    <span className="absolute right-2 text-[8px] font-black text-emerald-400 tracking-wide uppercase -rotate-90 origin-center translate-y-[-2px]">Tier 3</span>

                  </div>
                </div>
              </div>
            </div>

            {/* GLOWING 3D DIRECT ROUTE PATH */}
            {showRoutePath && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ transform: 'translateZ(12px)', transformStyle: 'preserve-3d' }}>
                <defs>
                  <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#800020" />
                  </linearGradient>
                </defs>
                <path
                  d={`M ${startCoords.x} ${startCoords.y} Q 250 250 ${endCoords.x} ${endCoords.y}`}
                  fill="none"
                  stroke="url(#routeGlow)"
                  strokeWidth="3.5"
                  strokeDasharray="6 3"
                  className="animate-[dash_10s_linear_infinite]"
                />
              </svg>
            )}

            {/* BILLBOARD STANDING 3D FACILITY PINS */}
            {filteredFacilities.map((f) => {
              const active = selectedFacility?.id === f.id;
              
              // We calculate inverse rotations to keep pins upright towards the camera
              return (
                <div
                  key={f.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFacility(f);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${f.x}px`,
                    top: `${f.y}px`,
                    // Reverse rotateZ and rotateX to stand upright in 3D perspective space!
                    transform: `translate3d(-50%, -50%, 20px) rotateZ(${-rotateZ}deg) rotateX(${-rotateX}deg)`,
                    transformStyle: 'preserve-3d',
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-2xl cursor-pointer border transition-all duration-300 ${
                    active 
                      ? 'bg-fifa-gold text-fifa-dark border-white scale-125 z-40 ring-4 ring-fifa-gold/30' 
                      : 'bg-fifa-cardDark text-white border-gray-800 hover:border-fifa-gold hover:scale-110 z-30'
                  }`}
                >
                  <span style={{ transform: 'translateZ(2px)' }}>
                    {pinEmojis[f.type as keyof typeof pinEmojis]}
                  </span>
                  
                  {/* Floating marker pointer bottom */}
                  <div className={`absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b ${
                    active ? 'bg-fifa-gold border-white' : 'bg-fifa-cardDark border-gray-800'
                  }`} />
                </div>
              );
            })}

          </div>

          {/* 3D CAMERA INTERACTIVE TOOLBAR PANEL */}
          <div className="absolute right-4 bottom-4 flex flex-col space-y-1.5 bg-fifa-dark/85 border border-gray-850 p-2 rounded-xl z-20 shadow-xl">
            <button 
              onClick={() => setZoom(prev => Math.min(prev + 0.1, 1.8))} 
              className="p-1.5 bg-fifa-cardDark hover:bg-gray-800 rounded border border-gray-800" 
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5 text-fifa-gold" />
            </button>
            <button 
              onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))} 
              className="p-1.5 bg-fifa-cardDark hover:bg-gray-800 rounded border border-gray-800" 
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5 text-fifa-gold" />
            </button>
            <button 
              onClick={() => setRotateZ(prev => prev + 15)} 
              className="p-1.5 bg-fifa-cardDark hover:bg-gray-800 rounded border border-gray-800" 
              title="Rotate Camera Left"
            >
              <RotateCcw className="w-3.5 h-3.5 text-fifa-gold" />
            </button>
            <button 
              onClick={() => setRotateZ(prev => prev - 15)} 
              className="p-1.5 bg-fifa-cardDark hover:bg-gray-800 rounded border border-gray-800" 
              title="Rotate Camera Right"
            >
              <RotateCw className="w-3.5 h-3.5 text-fifa-gold" />
            </button>
            <button 
              onClick={() => setRotateX(prev => Math.min(prev + 5, 80))} 
              className="p-1.5 bg-fifa-cardDark hover:bg-gray-800 rounded border border-gray-800" 
              title="Tilt Camera Down"
            >
              <ArrowDown className="w-3.5 h-3.5 text-fifa-gold" />
            </button>
            <button 
              onClick={() => setRotateX(prev => Math.max(prev - 5, 30))} 
              className="p-1.5 bg-fifa-cardDark hover:bg-gray-800 rounded border border-gray-800" 
              title="Tilt Camera Up"
            >
              <ArrowUp className="w-3.5 h-3.5 text-fifa-gold" />
            </button>
            <button 
              onClick={resetCamera} 
              className="p-1.5 bg-fifa-burgundy/25 hover:bg-fifa-burgundy/40 rounded border border-fifa-burgundy-light/30" 
              title="Reset view"
            >
              <RefreshCw className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>

          {/* Selected facility detail popup */}
          {selectedFacility && (
            <div className="absolute left-4 bottom-4 right-16 md:right-auto md:w-72 bg-fifa-dark/95 border-2 border-fifa-gold/40 rounded-xl p-4 shadow-2xl animate-scale-up text-left z-20">
              <div className="flex justify-between items-start pb-2 border-b border-gray-800 mb-2">
                <div>
                  <h4 className="font-extrabold text-xs text-white uppercase">{selectedFacility.name}</h4>
                  <Badge variant="primary" className="text-[8px] uppercase mt-0.5 py-0 px-2 font-bold">
                    {selectedFacility.type}
                  </Badge>
                </div>
                <button onClick={() => setSelectedFacility(null)} className="text-gray-500 hover:text-white text-xs font-bold">X</button>
              </div>
              <p className="text-[10px] text-gray-300 leading-relaxed font-semibold">
                {selectedFacility.desc}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT SIDEBAR PANEL: TRAFFIC & ROUTE PLANNING */}
      <div className="flex flex-col space-y-4">
        <h3 className="font-bold text-sm text-fifa-gold-light uppercase tracking-wider">Navigation logistics</h3>
        
        {/* Dynamic Crowd Density */}
        <Card className="p-4 space-y-2.5" hoverEffect={false}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-bold uppercase">Crowd Density Model</span>
            <div className="flex space-x-1 bg-fifa-dark rounded-lg p-0.5 border border-gray-800">
              {(['low', 'moderate', 'high'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setCrowdLevel(l)}
                  className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold transition-all ${
                    crowdLevel === l ? 'bg-fifa-burgundy text-white font-black' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={crowdData[crowdLevel].color} className="uppercase font-extrabold text-[9px] tracking-wide py-0.5 px-2.5">
              {crowdData[crowdLevel].text}
            </Badge>
          </div>
          <p className="text-[10px] text-gray-400 italic font-medium leading-relaxed">
            {crowdData[crowdLevel].note}
          </p>
        </Card>

        {/* Route Planner */}
        <Card className="p-4 space-y-4" hoverEffect={false}>
          <div className="text-xs font-bold text-white flex items-center space-x-1.5 uppercase tracking-wider pb-2 border-b border-gray-850">
            <Navigation className="w-4 h-4 text-fifa-gold" />
            <span>Interactive 3D Route Map</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label htmlFor="gate-start-select" className="text-[9px] uppercase font-black text-gray-500 block mb-1">Entrance Gate</label>
              <select
                id="gate-start-select"
                value={startPoint}
                onChange={e => {
                  setStartPoint(e.target.value);
                  setShowRoutePath(false);
                }}
                className="w-full bg-fifa-dark border border-gray-800 text-xs text-white rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-fifa-gold font-bold"
              >
                {points.starts.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="target-end-select" className="text-[9px] uppercase font-black text-gray-500 block mb-1">Target Seating Section</label>
              <select
                id="target-end-select"
                value={endPoint}
                onChange={e => {
                  setEndPoint(e.target.value);
                  setShowRoutePath(false);
                }}
                className="w-full bg-fifa-dark border border-gray-800 text-xs text-white rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-fifa-gold font-bold"
              >
                {points.ends.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <Button onClick={handleRouteSearch} className="w-full text-xs font-bold py-2.5 bg-fifa-burgundy hover:bg-fifa-burgundy-light shadow-lg">
              Project Route on 3D Map
            </Button>
          </div>
        </Card>

        {/* Route Steps Checklist */}
        {routeSteps.length > 0 && showRoutePath && (
          <div className="bg-fifa-cardDark border border-gray-850 p-4 rounded-xl space-y-3 text-left animate-scale-up">
            <span className="text-[9px] uppercase font-black text-fifa-gold-light tracking-widest block">3D NAVIGATION DIRECTIVES</span>
            <ol className="space-y-2.5 text-[11px] text-gray-300 font-semibold leading-relaxed">
              {routeSteps.map((step, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="w-4.5 h-4.5 rounded-full bg-fifa-burgundy text-white flex items-center justify-center text-[9px] font-bold mr-2 mt-0.5 flex-shrink-0 border border-fifa-burgundy-light">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

    </div>
  );
};
