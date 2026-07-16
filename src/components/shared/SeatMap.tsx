import React, { useState } from 'react';
import { Button } from '../ui/Primitives';

interface SeatMapProps {
  onSelectSeat: (category: 'VIP' | 'Category 1' | 'Category 2' | 'Category 3', seatCode: string, price: number) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({ onSelectSeat }) => {
  const [selectedCategory, setSelectedCategory] = useState<'VIP' | 'Category 1' | 'Category 2' | 'Category 3'>('Category 1');
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  const categories = {
    'VIP': { price: 299.99, color: 'text-fifa-gold border-fifa-gold bg-fifa-gold/10' },
    'Category 1': { price: 149.99, color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
    'Category 2': { price: 99.99, color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' },
    'Category 3': { price: 59.99, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' }
  };

  // Mock seat layout: 5 rows (A-E), 8 seats each
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8];

  // Randomly set some seats as already booked
  const isSeatBooked = (seatCode: string) => {
    // Deterministic mock book status based on character codes
    const sum = seatCode.charCodeAt(0) + seatCode.charCodeAt(1);
    return sum % 3 === 0;
  };

  const handleSeatClick = (seatCode: string) => {
    if (isSeatBooked(seatCode)) return;
    setSelectedSeat(seatCode);
    onSelectSeat(selectedCategory, seatCode, categories[selectedCategory].price);
  };

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="grid grid-cols-4 gap-2">
        {(Object.keys(categories) as Array<keyof typeof categories>).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setSelectedCategory(cat);
              setSelectedSeat(null);
            }}
            className={`p-2 rounded-lg border text-xs font-bold text-center transition-all ${
              selectedCategory === cat
                ? 'border-fifa-gold bg-fifa-burgundy text-white shadow'
                : 'border-gray-800 bg-fifa-cardDark text-gray-400 hover:border-gray-700'
            }`}
          >
            <div>{cat}</div>
            <div className="text-[10px] text-fifa-gold-light">${categories[cat].price}</div>
          </button>
        ))}
      </div>

      {/* Seat Map Visual Board */}
      <div className="bg-fifa-dark border border-gray-800 rounded-xl p-4 flex flex-col items-center">
        {/* The Pitch indicator */}
        <div className="w-full bg-emerald-600/20 border border-emerald-500/40 rounded py-1.5 text-center text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-6">
          ⚽ FOOTBALL PITCH / FIELD DIRECTION ⚽
        </div>

        {/* Seat grid */}
        <div className="grid gap-2 justify-center">
          {rows.map((row) => (
            <div key={row} className="flex items-center space-x-2">
              <span className="w-4 text-xs font-bold text-gray-500 text-center">{row}</span>
              <div className="flex space-x-1.5">
                {columns.map((col) => {
                  const seatCode = `${selectedCategory[0]}${row}${col}`;
                  const booked = isSeatBooked(seatCode);
                  const active = selectedSeat === seatCode;
                  
                  return (
                    <button
                      key={col}
                      type="button"
                      disabled={booked}
                      onClick={() => handleSeatClick(seatCode)}
                      title={`${seatCode} - ${booked ? 'Booked' : 'Available'}`}
                      className={`w-6 h-6 rounded text-[8px] font-bold transition-all flex items-center justify-center border ${
                        booked
                          ? 'bg-gray-800/80 border-gray-900 text-gray-600 cursor-not-allowed'
                          : active
                          ? 'bg-fifa-gold border-white text-fifa-dark scale-105 shadow-md shadow-fifa-gold/20'
                          : 'bg-fifa-cardDark border-gray-700/80 text-gray-300 hover:border-fifa-gold-light'
                      }`}
                    >
                      {row}{col}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex space-x-4 mt-6 text-[10px] text-gray-400 font-semibold border-t border-gray-800/60 pt-3 w-full justify-center">
          <div className="flex items-center space-x-1">
            <span className="w-3.5 h-3.5 bg-fifa-cardDark border border-gray-700 rounded block" />
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3.5 h-3.5 bg-fifa-gold border border-white rounded block" />
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3.5 h-3.5 bg-gray-800 border border-gray-900 rounded block" />
            <span>Booked</span>
          </div>
        </div>
      </div>
    </div>
  );
};
