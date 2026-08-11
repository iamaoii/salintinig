import sipagAtTalino from '../assets/badges/sipag_talino_badge.webp';
import tenthDayStreak from '../assets/badges/10_day_streak_badge.webp';
import earlyBadge from '../assets/badges/early_bird_badge.webp';
import gandaAtTalino from '../assets/badges/ganda_talino_badge.webp';

export const defaultBadges = [
  { id: 'sipag-at-talino', name: 'Sipag at Talino', image: sipagAtTalino },
  { id: '10th-day-streak', name: '10th Day Streak', image: tenthDayStreak },
  { id: 'early-badge', name: 'Early Badge', image: earlyBadge },
  { id: 'ganda-at-talino', name: 'Ganda at Talino', image: gandaAtTalino },
];

export const defaultStories = [
  { id: 1, title: 'Ang Pinagmulan ng Marikina', color: 'blue' },
  { id: 2, title: 'Si Ben at ang Kanyang Saranggola', color: 'green' },
  { id: 3, title: 'Ang Paglalakbay sa Kalawakan', color: 'yellow' },
];

export const badgesByLrn = {
  '136670100091': defaultBadges,
  '123456789012': defaultBadges,
};

export const storiesByLrn = {
  '136670100091': defaultStories,
  '123456789012': defaultStories,
};
