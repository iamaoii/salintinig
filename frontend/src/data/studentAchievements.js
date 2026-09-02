import firstStep from '../assets/badges/first_step_badge.webp';
import imAStar from '../assets/badges/im_a_star_badge.webp';
import soundsRight from '../assets/badges/sounds_right_badge.webp';
import sentenceBuilder from '../assets/badges/sentence_builder_badge.webp';
import nightOwl from '../assets/badges/night_owl_badge.webp';
import sixSeven from '../assets/badges/six_seven_badge.webp';
import bothWorlds from '../assets/badges/both_worlds_badge.webp';
import tenDayStreak from '../assets/badges/ten_day_streak_badge.webp';
import twentyDayStreak from '../assets/badges/twenty_day_streak_badge.webp';
import tripleCrowned from '../assets/badges/triple_crowned_badge.webp';

export const defaultBadges = [
  { id: 'first-step', name: 'First step', description: 'Complete your very first practice activity.', image: firstStep },
  { id: 'im-a-star', name: "I'm a star!", description: 'Get a perfect score on a vocabulary matching activity.', image: imAStar },
  { id: 'sounds-right', name: 'Sounds right!', description: 'Get 3 out of 3 correct on a pronunciation challenge.', image: soundsRight },
  { id: 'sentence-builder', name: 'Sentence builder', description: 'Finish a sentence building activity without hitting retrying or hitting try again.', image: sentenceBuilder },
  { id: 'night-owl', name: 'Night owl', description: 'Read a story using dark mode.', image: nightOwl },
  { id: 'six-seven', name: '6? 7!', description: 'Reach a 7 day streak.', image: sixSeven },
  { id: 'both-worlds', name: 'The best of both worlds!', description: 'Read one fil book and one eng book from the bookshelf.', image: bothWorlds },
  { id: '10-day-streak', name: '10 Streak Master!', description: 'Reach a 10 day streak.', image: tenDayStreak },
  { id: '20-day-streak', name: '20 Streak Master!', description: 'Reach a 20 day streak.', image: twentyDayStreak },
  { id: 'triple-crowned', name: 'Triple Crowned', description: 'Complete all 3 class activities (pronun, vocab, and sent building) in 1 day.', image: tripleCrowned },
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
