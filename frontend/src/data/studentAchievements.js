import sipagAtTalino from '../assets/badges/sipag_talino_badge.webp';
import tenthDayStreak from '../assets/badges/10_day_streak_badge.webp';
import earlyBadge from '../assets/badges/early_bird_badge.webp';
import gandaAtTalino from '../assets/badges/ganda_talino_badge.webp';

export const badgesByLrn = {
  '136670100091': [
    { id: 'sipag-at-talino', name: 'Sipag at Talino', image: sipagAtTalino },
    { id: '10th-day-streak', name: '10th Day Streak', image: tenthDayStreak },
    { id: 'early-badge', name: 'Early Badge', image: earlyBadge },
    { id: 'ganda-at-talino', name: 'Ganda at Talino', image: gandaAtTalino },
  ],
};

export const storiesByLrn = {
  '136670100091': [
    { id: 1, title: 'The Lost Kite', color: 'blue' },
    { id: 2, title: 'Adventures in the Forest', color: 'green' },
    { id: 3, title: 'The Brave Little Turtle', color: 'yellow' },
  ],
};
