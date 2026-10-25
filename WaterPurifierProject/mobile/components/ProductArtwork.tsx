import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { ProductCategory } from '../types';

const CATEGORY_COLOR: Record<ProductCategory, string> = {
  ro_purifiers: '#38bdf8',
  uv_purifiers: '#a78bfa',
  gravity_filters: '#34d399',
  commercial_ro: '#fbbf24',
  spare_filters: '#fb7185',
  alkaline_units: '#2dd4bf',
  water_dispensers: '#60a5fa',
  water_pumps: '#f97316',
};

export function ProductArtwork({
  category,
  name,
  width = 112,
  height = 112,
}: {
  category: ProductCategory;
  name: string;
  width?: number;
  height?: number;
}) {
  const accent = CATEGORY_COLOR[category];
  const productName = name.length > 24 ? `${name.slice(0, 21)}...` : name;

  return (
    <Svg width={width} height={height} viewBox="0 0 140 140">
      <Rect width="140" height="140" rx="16" fill="#0f172a" />
      <Circle cx="112" cy="25" r="22" fill={accent} opacity="0.12" />
      {category === 'water_dispensers' ? (
        <>
          <Rect x="45" y="42" width="50" height="75" rx="8" fill="#1e293b" stroke={accent} strokeWidth="2" />
          <Path d="M53 42V28Q70 17 87 28V42" fill="#38bdf8" opacity="0.65" />
          <Rect x="54" y="55" width="32" height="26" rx="4" fill="#082f49" />
          <Line x1="62" y1="86" x2="62" y2="96" stroke={accent} strokeWidth="3" />
          <Line x1="78" y1="86" x2="78" y2="96" stroke="#f87171" strokeWidth="3" />
          <Rect x="57" y="117" width="26" height="4" rx="2" fill="#64748b" />
        </>
      ) : category === 'water_pumps' ? (
        <>
          <Rect x="34" y="49" width="72" height="50" rx="12" fill="#1e293b" stroke={accent} strokeWidth="2" />
          <Circle cx="69" cy="74" r="17" fill="#0b1220" stroke={accent} strokeWidth="3" />
          <Path d="M69 61V87M56 74H82M59 65L79 83M79 65L59 83" stroke={accent} strokeWidth="2" />
          <Path d="M34 62H22V51M106 86H118V98" fill="none" stroke="#94a3b8" strokeWidth="4" />
          <Rect x="47" y="103" width="45" height="7" rx="3" fill="#475569" />
        </>
      ) : category === 'spare_filters' ? (
        <>
          <Rect x="48" y="35" width="44" height="75" rx="12" fill="#1e293b" stroke={accent} strokeWidth="2" />
          <Rect x="54" y="45" width="32" height="5" rx="2" fill={accent} opacity="0.75" />
          <Path d="M55 59H85M55 68H85M55 77H85M55 86H85" stroke="#64748b" strokeWidth="2" />
          <Rect x="57" y="27" width="26" height="9" rx="3" fill="#cbd5e1" />
          <Rect x="57" y="109" width="26" height="8" rx="3" fill="#cbd5e1" />
        </>
      ) : category === 'commercial_ro' ? (
        <>
          <Path d="M32 105V54H108V105" fill="#1e293b" stroke={accent} strokeWidth="2" />
          <Line x1="32" y1="105" x2="108" y2="105" stroke="#94a3b8" strokeWidth="3" />
          <Rect x="41" y="63" width="15" height="34" rx="6" fill="#0b1220" stroke="#38bdf8" strokeWidth="2" />
          <Rect x="63" y="63" width="15" height="34" rx="6" fill="#0b1220" stroke="#34d399" strokeWidth="2" />
          <Rect x="85" y="63" width="15" height="34" rx="6" fill="#0b1220" stroke="#a78bfa" strokeWidth="2" />
          <Path d="M49 54V43H92V54M56 97V109M78 97V109M99 97V109" fill="none" stroke={accent} strokeWidth="2" />
        </>
      ) : category === 'gravity_filters' ? (
        <>
          <Path d="M48 36H92L88 87Q70 101 52 87Z" fill="#1e293b" stroke={accent} strokeWidth="2" />
          <Ellipse cx="70" cy="37" rx="22" ry="7" fill="#334155" stroke={accent} strokeWidth="2" />
          <Path d="M52 75H88M56 86V99Q70 108 84 99V86" fill="none" stroke="#94a3b8" strokeWidth="2" />
          <Path d="M70 107V115" stroke={accent} strokeWidth="3" />
          <Path d="M63 115H77" stroke={accent} strokeWidth="3" />
        </>
      ) : (
        <>
          <Rect x="42" y="28" width="56" height="88" rx="10" fill="#1e293b" stroke={accent} strokeWidth="2" />
          <Rect x="49" y="36" width="42" height="54" rx="6" fill="#082f49" />
          <Path d="M59 74Q70 50 81 74Q81 86 70 86Q59 86 59 74Z" fill={accent} opacity="0.9" />
          <Circle cx="70" cy="101" r="3" fill="#34d399" />
          <Rect x="55" y="119" width="30" height="4" rx="2" fill="#64748b" />
        </>
      )}
      <Rect x="8" y="125" width="124" height="1" fill="#334155" />
      <SvgText
        x="70"
        y="137"
        fill="#cbd5e1"
        fontSize="7"
        fontWeight="600"
        textAnchor="middle"
      >
        {productName}
      </SvgText>
    </Svg>
  );
}
