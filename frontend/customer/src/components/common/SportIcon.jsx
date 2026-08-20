import React from 'react';
import {
  FaFutbol,
  FaBasketball,
  FaGolfBallTee,
  FaTableTennisPaddleBall,
  FaPersonSwimming,
  FaDumbbell,
  FaTrophy,
  FaVolleyball
} from 'react-icons/fa6';
import { GiShuttlecock, GiTennisRacket, GiEightBall } from 'react-icons/gi';

/**
 * Normalizes Vietnamese text and accents for flexible matching
 */
export const normalizeSport = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
};

/**
 * SportIcon component powered by FontAwesome 6 and Game Icons
 */
export default function SportIcon({ sport, size = 24, className = '', ...props }) {
  const norm = normalizeSport(sport);

  // 1. CẦU LÔNG / BADMINTON
  if (norm.includes('cau long') || norm.includes('badminton')) {
    return <GiShuttlecock size={size} className={className} {...props} />;
  }

  // 2. PICKLEBALL
  if (norm.includes('pickleball') || norm.includes('pickle')) {
    return <FaTableTennisPaddleBall size={size} className={className} {...props} />;
  }

  // 3. TENNIS / QUẦN VỢT
  if (norm.includes('tennis') || norm.includes('quan vot')) {
    return <GiTennisRacket size={size} className={className} {...props} />;
  }

  // 4. BÓNG ĐÁ / FOOTBALL / SOCCER / FUTSAL
  if (norm.includes('bong da') || norm.includes('football') || norm.includes('soccer') || norm.includes('futsal') || norm.includes('san co')) {
    return <FaFutbol size={size} className={className} {...props} />;
  }

  // 5. BÓNG RỔ / BASKETBALL
  if (norm.includes('bong ro') || norm.includes('basketball')) {
    return <FaBasketball size={size} className={className} {...props} />;
  }

  // 6. GOLF
  if (norm.includes('golf')) {
    return <FaGolfBallTee size={size} className={className} {...props} />;
  }

  // 7. BÓNG CHUYỀN / VOLLEYBALL
  if (norm.includes('bong chuyen') || norm.includes('volleyball')) {
    return <FaVolleyball size={size} className={className} {...props} />;
  }

  // 8. BƠI LỘI / SWIMMING
  if (norm.includes('boi') || norm.includes('swim') || norm.includes('be boi') || norm.includes('ho boi')) {
    return <FaPersonSwimming size={size} className={className} {...props} />;
  }

  // 9. BÓNG BÀN / TABLE TENNIS / PING PONG
  if (norm.includes('bong ban') || norm.includes('ping pong') || norm.includes('table tennis')) {
    return <FaTableTennisPaddleBall size={size} className={className} {...props} />;
  }

  // 10. BIDA / BILLIARDS / POOL / SNOOKER
  if (norm.includes('bida') || norm.includes('billiard') || norm.includes('pool') || norm.includes('snooker')) {
    return <GiEightBall size={size} className={className} {...props} />;
  }

  // 11. GYM / FITNESS / THỂ HÌNH / YOGA
  if (norm.includes('gym') || norm.includes('fitness') || norm.includes('the hinh') || norm.includes('yoga')) {
    return <FaDumbbell size={size} className={className} {...props} />;
  }

  // 12. THỂ THAO CHUNG / ALL SPORTS
  return <FaTrophy size={size} className={className} {...props} />;
}
