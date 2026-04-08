/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, Users, Layout, Move, Pencil, ArrowUpRight, Circle, Activity, Trash2, Eraser, MoreVertical, GripVertical, Sparkles, Maximize2, Volleyball } from 'lucide-react';

type Mode = 'move' | 'player-path' | 'ball-path' | 'direction';

interface Point {
  x: number;
  y: number;
}

interface Path {
  id: number;
  points: Point[];
  type: 'player-path' | 'ball-path' | 'direction';
}

export default function App() {
  // 定義 6 名球員 + 1 顆排球
  const [players, setPlayers] = useState([
    { id: 1, x: null, y: null, rotation: 0, role: 'standard', type: 'player' },
    { id: 2, x: null, y: null, rotation: 0, role: 'standard', type: 'player' },
    { id: 3, x: null, y: null, rotation: 0, role: 'standard', type: 'player' },
    { id: 4, x: null, y: null, rotation: 0, role: 'standard', type: 'player' },
    { id: 5, x: null, y: null, rotation: 0, role: 'standard', type: 'player' },
    { id: 6, x: null, y: null, rotation: 0, role: 'libero', type: 'player' },
    { id: 'ball', x: null, y: null, rotation: 0, role: 'ball', type: 'ball' },
  ]);

  // 模式與路徑狀態
  const [mode, setMode] = useState<Mode>('move');
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[] | null>(null);
  const pathIdCounter = useRef(0);

  // 拖曳狀態管理
  const [dragState, setDragState] = useState<any>(null);
  
  // 參考節點，用於計算場地邊界
  const courtRef = useRef<HTMLDivElement>(null);

  // 處理游標/觸控按下事件
  const handlePointerDown = (e: React.PointerEvent, player: any, dragType: 'move' | 'rotate' = 'move') => {
    if (mode !== 'move') return;
    // 防止預設行為
    e.preventDefault();
    e.stopPropagation();
    
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    
    // 計算滑鼠/觸控點相對於球員元素中心的偏移量
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setDragState({
      player,
      dragType,
      offsetX: e.clientX - centerX,
      offsetY: e.clientY - centerY,
      currentX: e.clientX,
      currentY: e.clientY,
      startRotation: player.rotation || 0,
      centerX,
      centerY
    });
  };

  // 處理球場上的按下事件（用於繪圖）
  const handleCourtPointerDown = (e: React.PointerEvent) => {
    if (!courtRef.current) return;
    
    const rect = courtRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (mode === 'move') return;
    
    setCurrentPath([{ x, y }]);
  };

  // 全域監聽滑鼠/觸控移動與放開事件
  useEffect(() => {
    if (!dragState && !currentPath) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (dragState) {
        if (dragState.dragType === 'rotate') {
          const dx = e.clientX - dragState.centerX;
          const dy = e.clientY - dragState.centerY;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
          
          setPlayers(prev => prev.map(p => 
            p.id === dragState.player.id ? { ...p, rotation: angle } : p
          ));
          
          setDragState((prev: any) => ({
            ...prev,
            currentX: e.clientX,
            currentY: e.clientY
          }));
        } else {
          setDragState((prev: any) => ({
            ...prev,
            currentX: e.clientX,
            currentY: e.clientY
          }));
        }
      } else if (currentPath && courtRef.current) {
        const rect = courtRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        // 限制在球場內或稍微超出
        setCurrentPath(prev => prev ? [...prev, { x, y }] : null);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragState) {
        if (dragState.dragType === 'move') {
          if (!courtRef.current) return;
          
          const courtRect = courtRef.current.getBoundingClientRect();
          const clientX = e.clientX;
          const clientY = e.clientY;

          if (
            clientX >= courtRect.left && clientX <= courtRect.right &&
            clientY >= courtRect.top && clientY <= courtRect.bottom
          ) {
            const dropCenterX = clientX - courtRect.left - dragState.offsetX;
            const dropCenterY = clientY - courtRect.top - dragState.offsetY;
            const xPercent = (dropCenterX / courtRect.width) * 100;
            const yPercent = (dropCenterY / courtRect.height) * 100;

            setPlayers(prev => prev.map(p =>
              p.id === dragState.player.id ? { ...p, x: xPercent, y: yPercent } : p
            ));
          } else {
            setPlayers(prev => prev.map(p =>
              p.id === dragState.player.id ? { ...p, x: null, y: null, rotation: 0 } : p
            ));
          }
        }
        setDragState(null);
      } else if (currentPath) {
        if (currentPath.length > 1) {
          setPaths(prev => [...prev, { 
            id: pathIdCounter.current++, 
            points: currentPath,
            type: mode as any
          }]);
        }
        setCurrentPath(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, currentPath]);

  // 重置戰術板
  const handleReset = () => {
    setPlayers(prev => prev.map(p => ({ ...p, x: null, y: null, rotation: 0 })));
    setPaths([]);
  };

  const clearPaths = () => {
    setPaths([]);
  };

  // 球員組件（圓形圖示 + 手部 + 旋轉功能）
  const PlayerPiece = ({ player, isDragging }: { player: any, isDragging: boolean, key?: string }) => {
    if (player.type === 'ball') {
      return (
        <div
          className={`relative w-5 h-5 touch-none flex items-center justify-center transition-transform ${mode === 'move' ? 'cursor-grab active:cursor-grabbing hover:scale-110' : 'cursor-default'} ${isDragging ? 'opacity-0' : ''}`}
          onPointerDown={(e) => handlePointerDown(e, player)}
        >
          <Volleyball size={20} className="text-yellow-500 drop-shadow-md" />
        </div>
      );
    }

    const isLibero = player.role === 'libero';
    const mainColor = isLibero ? 'bg-[#f87171]' : 'bg-[#3b82f6]';
    const borderColor = isLibero ? 'border-[#ef4444]' : 'border-[#2563eb]';
    const isOnCourt = player.x !== null;

    return (
      <div
        className={`relative w-6 h-6 touch-none flex items-center justify-center transition-transform ${mode === 'move' ? 'cursor-grab active:cursor-grabbing hover:scale-110' : 'cursor-default'} ${isDragging ? 'opacity-0' : ''}`}
        style={{ transform: `rotate(${player.rotation || 0}deg)` }}
        onPointerDown={(e) => handlePointerDown(e, player)}
      >
        {/* 手部 (判斷正背面 + 旋轉控制) */}
        <div 
          className={`absolute -top-0.5 -left-0.5 w-2 h-2 ${mainColor} rounded-full border border-white/30 z-20 ${isOnCourt && mode === 'move' ? 'cursor-alias' : ''}`} 
          onPointerDown={(e) => isOnCourt && mode === 'move' ? handlePointerDown(e, player, 'rotate') : null}
        />
        <div 
          className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${mainColor} rounded-full border border-white/30 z-20 ${isOnCourt && mode === 'move' ? 'cursor-alias' : ''}`} 
          onPointerDown={(e) => isOnCourt && mode === 'move' ? handlePointerDown(e, player, 'rotate') : null}
        />
        
        <div className={`absolute w-6 h-6 ${mainColor} rounded-full shadow-md border-2 ${borderColor}`} />
        <div className="z-10 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white drop-shadow-sm">{player.id}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6] font-sans text-slate-900 overflow-hidden">
      
      {/* 全域拖曳時的「幽靈」元素 */}
      {dragState && (
        <div 
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 scale-110"
          style={{ 
            left: dragState.currentX, 
            top: dragState.currentY 
          }}
        >
          {dragState.player.type === 'ball' ? (
            <Volleyball size={20} className="text-yellow-500 drop-shadow-xl" />
          ) : (
            <div className="relative w-6 h-6 flex items-center justify-center" style={{ transform: `rotate(${dragState.player.rotation || 0}deg)` }}>
               <div className={`absolute -top-0.5 -left-0.5 w-2 h-2 ${dragState.player.role === 'libero' ? 'bg-[#f87171]' : 'bg-[#3b82f6]'} rounded-full border border-white/30`} />
               <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${dragState.player.role === 'libero' ? 'bg-[#f87171]' : 'bg-[#3b82f6]'} rounded-full border border-white/30`} />
               <div className={`absolute w-6 h-6 ${dragState.player.role === 'libero' ? 'bg-[#f87171]' : 'bg-[#3b82f6]'} rounded-full shadow-xl border-2 ${dragState.player.role === 'libero' ? 'border-[#ef4444]' : 'border-[#2563eb]'}`} />
               <span className="text-[8px] font-bold text-white z-10">{dragState.player.id}</span>
            </div>
          )}
        </div>
      )}

      {/* 主畫布區（球場） */}
      <div className="flex-1 p-8 flex items-center justify-center overflow-hidden relative touch-none">
        {/* 球場容器 */}
        <div 
          ref={courtRef}
          onPointerDown={handleCourtPointerDown}
          className={`relative h-full max-h-[80vh] aspect-[15/24] shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-md bg-[#1e3a8a] overflow-hidden ${mode !== 'move' ? 'cursor-crosshair' : ''}`}
        >
          {/* 球場 SVG */}
          <svg viewBox="0 0 1500 2400" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
              </marker>
            </defs>
            <rect width="1500" height="2400" fill="#1e3a8a" />
            <rect x="300" y="300" width="900" height="1800" fill="#7dd3fc" stroke="#ffffff" strokeWidth="10" />
            <line x1="300" y1="1200" x2="1200" y2="1200" stroke="#ffffff" strokeWidth="14" />
            <line x1="300" y1="900" x2="1200" y2="900" stroke="#ffffff" strokeWidth="10" />
            <line x1="300" y1="1500" x2="1200" y2="1500" stroke="#ffffff" strokeWidth="10" />
            <line x1="150" y1="900" x2="300" y2="900" stroke="#ffffff" strokeWidth="10" strokeDasharray="30, 30" />
            <line x1="1200" y1="900" x2="1350" y2="900" stroke="#ffffff" strokeWidth="10" strokeDasharray="30, 30" />
            <line x1="150" y1="1500" x2="300" y2="1500" stroke="#ffffff" strokeWidth="10" strokeDasharray="30, 30" />
            <line x1="1200" y1="1500" x2="1350" y2="1500" stroke="#ffffff" strokeWidth="10" strokeDasharray="30, 30" />
          </svg>

          {/* 路徑繪製層 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {paths.map(path => {
              const strokeColor = path.type === 'player-path' ? '#ef4444' : path.type === 'ball-path' ? '#000000' : '#10b981';
              const isDashed = path.type === 'player-path';
              const hasArrow = path.type === 'direction';
              
              return (
                <polyline
                  key={path.id}
                  points={path.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="0.6"
                  strokeDasharray={isDashed ? "1.2, 1.2" : "none"}
                  markerEnd={hasArrow ? "url(#arrowhead-green)" : "none"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
            {currentPath && (
              <polyline
                points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={mode === 'player-path' ? '#ef4444' : mode === 'ball-path' ? '#000000' : '#10b981'}
                strokeWidth="0.6"
                strokeDasharray={mode === 'player-path' ? "1.2, 1.2" : "none"}
                markerEnd={mode === 'direction' ? "url(#arrowhead-green)" : "none"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>

          {/* 渲染場上的球員與排球 */}
          {players.filter(p => p.x !== null).map(player => (
            <div 
              key={`court-${player.id}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${player.x}%`, top: `${player.y}%` }}
            >
              <PlayerPiece 
                player={player} 
                isDragging={dragState?.player.id === player.id} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* 底部控制區域 */}
      <div className="bg-white border-t border-slate-200 z-30 p-4 pb-6">
        
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          {/* 模式切換列 */}
          <div className="flex items-center justify-between bg-[#f8fafc] rounded-xl p-1 border border-slate-200 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setMode('move')}
              className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-3 rounded-lg transition-all ${
                mode === 'move' ? 'bg-white shadow-sm text-[#3b82f6]' : 'text-slate-400'
              }`}
            >
              <Move size={20} />
              <span className="text-[10px] font-bold">移動</span>
            </button>
            
            <button
              onClick={() => setMode('player-path')}
              className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-3 rounded-lg transition-all ${
                mode === 'player-path' ? 'bg-white shadow-sm text-[#3b82f6]' : 'text-slate-400'
              }`}
            >
              <Activity size={20} />
              <span className="text-[10px] font-bold">球員</span>
            </button>
            
            <button
              onClick={() => setMode('ball-path')}
              className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-3 rounded-lg transition-all ${
                mode === 'ball-path' ? 'bg-white shadow-sm text-[#3b82f6]' : 'text-slate-400'
              }`}
            >
              <Circle size={20} />
              <span className="text-[10px] font-bold">球路徑</span>
            </button>
            
            <button
              onClick={() => setMode('direction')}
              className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-3 rounded-lg transition-all ${
                mode === 'direction' ? 'bg-white shadow-sm text-[#3b82f6]' : 'text-slate-400'
              }`}
            >
              <ArrowUpRight size={20} />
              <span className="text-[10px] font-bold">方向</span>
            </button>

            <div className="w-px h-8 bg-slate-200 mx-1" />

            <button
              onClick={clearPaths}
              className="flex-1 min-w-[60px] flex flex-col items-center gap-1 py-3 rounded-lg transition-all text-rose-400 hover:text-rose-600"
            >
              <Sparkles size={20} />
              <span className="text-[10px] font-bold">清除</span>
            </button>

            <button
              onClick={handleReset}
              className="flex-1 min-w-[60px] flex flex-col items-center gap-1 py-3 rounded-lg transition-all text-slate-400 hover:text-slate-600"
            >
              <RotateCcw size={20} />
              <span className="text-[10px] font-bold">重設</span>
            </button>
          </div>

          {/* 分隔線裝飾 */}
          <div className="flex items-center gap-2 px-1">
            <div className="h-1.5 bg-[#6b7280] rounded-full flex-1" />
          </div>

          {/* 球員板凳區 */}
          <div className="flex items-center gap-4 px-2 overflow-x-auto pb-1 no-scrollbar">
            {players.filter(p => p.x === null).map(player => (
              <PlayerPiece 
                key={`bench-${player.id}`} 
                player={player} 
                isDragging={dragState?.player.id === player.id} 
              />
            ))}
            {players.filter(p => p.x === null).length === 0 && (
              <p className="text-xs text-slate-400 font-medium italic py-2">所有球員皆在場上</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
