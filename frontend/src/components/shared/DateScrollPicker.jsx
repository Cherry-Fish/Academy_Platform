import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

function ScrollDropdown({ items, selected, onSelect, format, anchorRect }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-selected="true"]');
    if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, []);

  if (!anchorRect) return null;

  return ReactDOM.createPortal(
    <div
      ref={listRef}
      style={{
        position: 'fixed',
        top: anchorRect.bottom + 6,
        left: anchorRect.left,
        zIndex: 9999,
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
        border: '1.5px solid #e2e8f0',
        padding: '6px 4px',
        minWidth: '90px',
        maxHeight: '220px',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 transparent',
      }}
    >
      {items.map((item) => (
        <div
          key={item}
          data-selected={item === selected}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
          style={{
            padding: '8px 14px',
            textAlign: 'center',
            cursor: 'pointer',
            fontWeight: item === selected ? 600 : 400,
            fontSize: '14px',
            background: item === selected ? '#f1f5f9' : 'transparent',
            color: '#475569',
            borderRadius: '10px',
            userSelect: 'none',
          }}
        >
          {format(item)}
        </div>
      ))}
    </div>,
    document.body
  );
}

function SegmentInput({ inputRef, value, digits, onChange, onFocus }) {
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') { onChange(''); return; }
    onChange(parseInt(raw, 10));
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={value === '' ? '' : String(value).padStart(digits, '0')}
      onChange={handleChange}
      onFocus={onFocus}
      style={{
        width: digits === 4 ? '48px' : '30px',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontSize: '15px',
        color: '#475569',
        fontWeight: 400,
        textAlign: 'center',
        padding: '2px 2px',
        cursor: 'pointer',
        caretColor: '#4338ca',
      }}
    />
  );
}

export default function DateScrollPicker({ value, onChange, style }) {
  const today = new Date();

  const parse = (v) => {
    if (!v) return [today.getFullYear(), today.getMonth() + 1, today.getDate()];
    const p = v.split('-').map(Number);
    return [p[0] || today.getFullYear(), p[1] || (today.getMonth() + 1), p[2] || today.getDate()];
  };

  const [initY, initM, initD] = parse(value);
  const [year, setYear] = useState(initY);
  const [month, setMonth] = useState(initM);
  const [day, setDay] = useState(initD);
  const [openPicker, setOpenPicker] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);

  const wrapRef = useRef(null);
  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const dayRef = useRef(null);

  const refMap = { year: yearRef, month: monthRef, day: dayRef };

  const daysInMonth = new Date(year || today.getFullYear(), month || (today.getMonth() + 1), 0).getDate();
  const years = Array.from({ length: 8 }, (_, i) => today.getFullYear() + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const emit = useCallback((y, m, d) => {
    if (!y || !m || !d) return;
    onChange(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }, [onChange]);

  useEffect(() => {
    const [y, m, d] = parse(value);
    setYear(y); setMonth(m); setDay(d);
  }, [value]);

  useEffect(() => {
    if (day > daysInMonth) { setDay(daysInMonth); emit(year, month, daysInMonth); }
  }, [year, month]);

  // 스크롤 시 위치 업데이트 (닫지 않고 따라감)
  useEffect(() => {
    if (!openPicker) return;
    const updatePos = () => {
      const ref = refMap[openPicker];
      if (ref?.current) setAnchorRect(ref.current.getBoundingClientRect());
    };
    window.addEventListener('scroll', updatePos, true);
    return () => window.removeEventListener('scroll', updatePos, true);
  }, [openPicker]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpenPicker(null);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const openFor = (type) => {
    const ref = refMap[type];
    if (ref?.current) setAnchorRect(ref.current.getBoundingClientRect());
    setOpenPicker(type);
  };

  const handleYearSelect = (v) => { setYear(v); setOpenPicker(null); emit(v, month, day); };
  const handleMonthSelect = (v) => { setMonth(v); setOpenPicker(null); emit(year, v, day); };
  const handleDaySelect = (v) => { setDay(v); setOpenPicker(null); emit(year, month, v); };

  return (
    <div ref={wrapRef} style={{ position: 'relative', ...style }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          width: '100%',
          padding: '13px 16px',
          borderRadius: '16px',
          border: `1.5px solid ${openPicker ? '#6366f1' : '#e2e8f0'}`,
          fontSize: '15px',
          background: '#ffffff',
          boxSizing: 'border-box',
        }}
      >
        <SegmentInput inputRef={yearRef} value={year} digits={4}
          onChange={(v) => { setYear(v); if (v >= 2024 && v <= 2033) emit(v, month, day); }}
          onFocus={() => openFor('year')}
        />
        <span style={{ color: '#475569', fontSize: '14px', marginRight: '4px' }}>년</span>
        <SegmentInput inputRef={monthRef} value={month} digits={2}
          onChange={(v) => { setMonth(v); if (v >= 1 && v <= 12) emit(year, v, day); }}
          onFocus={() => openFor('month')}
        />
        <span style={{ color: '#475569', fontSize: '14px', marginRight: '4px' }}>월</span>
        <SegmentInput inputRef={dayRef} value={day} digits={2}
          onChange={(v) => { setDay(v); if (v >= 1 && v <= daysInMonth) emit(year, month, v); }}
          onFocus={() => openFor('day')}
        />
        <span style={{ color: '#475569', fontSize: '14px' }}>일</span>
      </div>

      {openPicker === 'year' && (
        <ScrollDropdown items={years} selected={year} onSelect={handleYearSelect} format={(v) => `${v}년`} anchorRect={anchorRect} />
      )}
      {openPicker === 'month' && (
        <ScrollDropdown items={months} selected={month} onSelect={handleMonthSelect} format={(v) => `${v}월`} anchorRect={anchorRect} />
      )}
      {openPicker === 'day' && (
        <ScrollDropdown items={days} selected={day} onSelect={handleDaySelect} format={(v) => `${v}일`} anchorRect={anchorRect} />
      )}
    </div>
  );
}
