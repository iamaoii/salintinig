class QuestItem {
  final String id;
  final String title;
  final String description;
  final String badgeAsset;
  final String category;
  final int currentProgress;
  final int maxProgress;
  final bool isUnlocked;
  final String rewardPoints;

  const QuestItem({
    required this.id,
    required this.title,
    required this.description,
    required this.badgeAsset,
    required this.category,
    required this.currentProgress,
    required this.maxProgress,
    required this.isUnlocked,
    required this.rewardPoints,
  });

  double get progressRatio => (currentProgress / maxProgress).clamp(0.0, 1.0);
}

class BadgesData {
  static const List<QuestItem> allQuests = [
    QuestItem(
      id: 'first_step',
      title: 'First step',
      description: 'Complete your very first practice activity.',
      badgeAsset: 'assets/badges/first_step_badge.webp',
      category: 'Milestone',
      currentProgress: 1,
      maxProgress: 1,
      isUnlocked: true,
      rewardPoints: '+30 XP',
    ),
    QuestItem(
      id: 'im_a_star',
      title: 'I\'m a star!',
      description: 'Get a perfect score on a vocabulary matching activity.',
      badgeAsset: 'assets/badges/im_a_star_badge.webp',
      category: 'Vocabulary',
      currentProgress: 1,
      maxProgress: 1,
      isUnlocked: true,
      rewardPoints: '+50 XP',
    ),
    QuestItem(
      id: 'sounds_right',
      title: 'Sounds right!',
      description: 'Get 3 out of 3 correct on a pronunciation challenge.',
      badgeAsset: 'assets/badges/sounds_right_badge.webp',
      category: 'Pronunciation',
      currentProgress: 2,
      maxProgress: 3,
      isUnlocked: false,
      rewardPoints: '+50 XP',
    ),
    QuestItem(
      id: 'sentence_builder',
      title: 'Sentence builder',
      description: 'Finish a sentence building activity without hitting retrying or hitting try again.',
      badgeAsset: 'assets/badges/sentence_builder_badge.webp',
      category: 'Grammar',
      currentProgress: 1,
      maxProgress: 1,
      isUnlocked: true,
      rewardPoints: '+50 XP',
    ),
    QuestItem(
      id: 'night_owl',
      title: 'Night owl',
      description: 'Read a story using dark mode.',
      badgeAsset: 'assets/badges/night_owl_badge.webp',
      category: 'Exploration',
      currentProgress: 0,
      maxProgress: 1,
      isUnlocked: false,
      rewardPoints: '+40 XP',
    ),
    QuestItem(
      id: 'six_seven',
      title: '6? 7!',
      description: 'Reach a 7 day streak.',
      badgeAsset: 'assets/badges/six_seven_badge.webp',
      category: 'Streak',
      currentProgress: 5,
      maxProgress: 7,
      isUnlocked: false,
      rewardPoints: '+70 XP',
    ),
    QuestItem(
      id: 'both_worlds',
      title: 'The best of both worlds!',
      description: 'Read one fil book and one eng book from the bookshelf.',
      badgeAsset: 'assets/badges/both_worlds_badge.webp',
      category: 'Reading',
      currentProgress: 1,
      maxProgress: 2,
      isUnlocked: false,
      rewardPoints: '+60 XP',
    ),
    QuestItem(
      id: 'ten_day_streak',
      title: '10 Streak Master!',
      description: 'Reach a 10 day streak.',
      badgeAsset: 'assets/badges/ten_day_streak_badge.webp',
      category: 'Streak',
      currentProgress: 5,
      maxProgress: 10,
      isUnlocked: false,
      rewardPoints: '+100 XP',
    ),
    QuestItem(
      id: 'twenty_day_streak',
      title: '20 Streak Master!',
      description: 'Reach a 20 day streak.',
      badgeAsset: 'assets/badges/twenty_day_streak_badge.webp',
      category: 'Streak',
      currentProgress: 5,
      maxProgress: 20,
      isUnlocked: false,
      rewardPoints: '+200 XP',
    ),
    QuestItem(
      id: 'triple_crowned',
      title: 'Triple Crowned',
      description: 'Complete all 3 class activities (pronun, vocab, and sent building) in 1 day.',
      badgeAsset: 'assets/badges/triple_crowned_badge.webp',
      category: 'Daily Quest',
      currentProgress: 2,
      maxProgress: 3,
      isUnlocked: false,
      rewardPoints: '+120 XP',
    ),
  ];
}
