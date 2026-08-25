import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/library/practice_reader_page.dart';

class StoryPreviewPage extends StatefulWidget {
  final String bookTitle;
  final double? initialProgress;

  const StoryPreviewPage({
    super.key,
    required this.bookTitle,
    this.initialProgress,
  });

  @override
  State<StoryPreviewPage> createState() => _StoryPreviewPageState();
}

class _StoryPreviewPageState extends State<StoryPreviewPage> {
  bool _isBookmarked = false;

  // Rich metadata database for stories
  final Map<String, Map<String, dynamic>> _storyDatabase = {
    'SARI - SARI SUMMERS': {
      'title': 'SARI - SARI SUMMERS',
      'cover': 'assets/stories/sari_sari_summers.jpg',
      'author': 'Lynnor Bontigao',
      'desc': 'Nora helps her Lola save their sari-sari store by making mango ice candy during a hot summer in the Philippines.',
      'tags': ['Grade 4+', 'Filipino', 'Easy to Read'],
      'progress': 0.12,
      'storyText':
          'Chapter 1\n\n'
          'Nora spent her summer helping her Lola at their small sari-sari store in the neighborhood.\n\n'
          'Every morning, she arranged snacks, canned goods, and bottles on the shelves before customers arrived. One very hot afternoon.\n\n'
          'Chapter 2\n\n'
          'Nora noticed that there were no customers. She thought about how they could make the store more popular. "What if we sell mango ice candy?" she whispered to herself.\n\n'
          'She gathered ripe yellow mangoes, condensed milk, and water, then poured the sweet mixture into long plastic bags. By the next day, they were frozen solid and ready to sell!',
      'quizQuestions': [
        {
          'questionText': 'Who does Nora help during the summer?',
          'options': ['Her Lola', 'Her cousin', 'Her mother', 'Her teacher'],
          'correctAnswerIndex': 0,
        },
        {
          'questionText': 'What kind of treat does Nora make to sell at the store?',
          'options': ['Mango ice candy', 'Ube ice cream', 'Halo-halo', 'Banana cue'],
          'correctAnswerIndex': 0,
        },
      ],
    },
    'A Song of Frutas': {
      'title': 'A Song of Frutas',
      'cover': 'assets/stories/a_song_of_frutas.png',
      'author': 'Margarita Engle',
      'desc': 'Tells the story of a young Filipino boy who helps his family sell colorful fruits while discovering the beauty of music, culture, and community.',
      'tags': ['Grade 4+', 'Filipino', 'Easy to Read'],
      'progress': 0.45,
      'storyText':
          'Chapter 1\n\n'
          'When we visit my abuelo in the city, the streets are alive with the sweet song of frutas.\n\n'
          'Our cart is piled high with sweet mangoes, juicy pineapples, and ripe papayas. We call out to the neighbors, singing their names along with the fruits we carry.\n\n'
          'Chapter 2\n\n'
          'Everyone comes out to listen and buy. The children run to us with coins in their hands, their faces lighting up at the sight of the colorful harvest.\n\n'
          'At the end of the day, when the cart is empty, Abuelo plays his guitar, and we sing our own song of gratitude for the beautiful day.',
      'quizQuestions': [
        {
          'questionText': 'Whom do we visit in the city in the story?',
          'options': ['Abuelo', 'Lola', 'Tito', 'Tita'],
          'correctAnswerIndex': 0,
        },
        {
          'questionText': 'What does Abuelo play at the end of the day?',
          'options': ['His guitar', 'His piano', 'His flute', 'His drums'],
          'correctAnswerIndex': 0,
        },
      ],
    },
    'OLD CLOTHES FOR DINNER': {
      'title': 'OLD CLOTHES FOR DINNER',
      'cover': 'assets/stories/old_clothes_for_dinner.png',
      'author': 'Chelo Aestrid',
      'desc': 'A delightful story about a child\'s perspective on home-cooked meals and family traditions during dinner time.',
      'tags': ['Grade 4+', 'Filipino', 'Easy to Read'],
      'progress': 0.60,
      'storyText':
          'Chapter 1\n\n'
          'Every Sunday evening, my mother tells us we are having "old clothes" for dinner.\n\n'
          'At first, I thought she meant we would eat fabric! But she explained that it is a traditional stew made from shredded beef and vegetables, representing thriftiness and love.\n\n'
          'Chapter 2\n\n'
          'As the stew simmers on the stove, the kitchen fills with a rich aroma of garlic, onions, and sweet bell peppers.\n\n'
          'When we sit down at the table, we share stories of our ancestors, realizing that these "old clothes" are actually a warm embrace of history.',
      'quizQuestions': [
        {
          'questionText': 'What did the narrator think they were eating at first?',
          'options': ['Actual fabric/clothes', 'Vegetables', 'Beef stew', 'Leftovers'],
          'correctAnswerIndex': 0,
        },
        {
          'questionText': 'What is "old clothes" (Ropa Vieja) actually representing?',
          'options': ['Thriftiness and love', 'New clothes', 'Fancy dinner', 'A dirty table'],
          'correctAnswerIndex': 0,
        },
      ],
    },
  };

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);
    const primaryBlue = Color(0xFF1B64D8);
    const yellowColor = Color(0xFFFFC300);

    // Look up book info, fallback to a default if not found
    final currentTitle = widget.bookTitle;
    final book = _storyDatabase[currentTitle] ?? _storyDatabase.values.firstWhere(
      (element) => element['title']!.toLowerCase() == currentTitle.toLowerCase(),
      orElse: () => {
        'title': currentTitle,
        'cover': 'assets/stories/sari_sari_summers.jpg',
        'author': 'Unknown Author',
        'desc': 'No description available for this story.',
        'tags': ['Story'],
        'progress': 0.0,
      },
    );

    final String title = book['title'];
    final String cover = book['cover'];
    final String author = book['author'];
    final String desc = book['desc'];
    final List<String> tags = List<String>.from(book['tags']);
    final double progress = widget.initialProgress ?? 0.0;
    final String storyText = book['storyText'] ?? 'No text available for this story.';
    final List<Map<String, dynamic>> quizQuestions = book['quizQuestions'] != null
        ? List<Map<String, dynamic>>.from(book['quizQuestions'])
        : [
            {
              'questionText': 'Did you enjoy reading this story?',
              'options': ['Yes, very much!', 'It was okay', 'Not really', 'I want to read another one'],
              'correctAnswerIndex': 0,
            }
          ];

    // Filter out the current book to list other books under "More Like This"
    final moreLikeThisBooks = _storyDatabase.values
        .where((element) => element['title'] != title)
        .toList();

    return Scaffold(
      backgroundColor: softCreamBg,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isTablet = constraints.maxWidth > 600;

            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isTablet ? 520 : double.infinity,
                ),
                child: Column(
                  children: [
                    // 1. Navigation Row (App Bar)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Left Back Caret Icon
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                              Navigator.pop(context);
                            },
                            icon: const Icon(
                              Icons.arrow_back_ios_new_rounded,
                              size: 22,
                              color: Colors.black,
                            ),
                          ),
                          // Center Title
                          Text(
                            'Read',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                              letterSpacing: -0.5,
                            ),
                          ),
                          // Right Close (X) Icon
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                              Navigator.pop(context);
                            },
                            icon: const Icon(
                              Icons.close_rounded,
                              size: 26,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // 2. Main Scrollable Content
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.only(left: 20.0, right: 20.0, bottom: 24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            const SizedBox(height: 12),
                            // Large Book Cover Image
                            Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.12),
                                    blurRadius: 24,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(20),
                                child: Image.asset(
                                  cover,
                                  width: isTablet ? 300 : double.infinity,
                                  height: isTablet ? 400 : null,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Category tags
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              alignment: WrapAlignment.center,
                              children: tags.map((tag) => Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  tag,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF475569),
                                  ),
                                ),
                              )).toList(),
                            ),
                            const SizedBox(height: 16),

                            // Book Title
                            Text(
                              title,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.lora(
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                                color: Colors.black,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 4),

                            // Book Author
                            Text(
                              'by $author',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF8E8E93),
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Progress indicator (if progress > 0)
                            if (progress > 0) ...[
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: LinearProgressIndicator(
                                  value: progress,
                                  backgroundColor: const Color(0xFFE4E2DC),
                                  valueColor: const AlwaysStoppedAnimation<Color>(primaryBlue),
                                  minHeight: 8,
                                ),
                              ),
                              const SizedBox(height: 20),
                            ],

                            // Action buttons
                            Row(
                              children: [
                                if (progress > 0) ...[
                                  // Start Again Button
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: () {
                                        Feedback.forTap(context);
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => PracticeReaderPage(
                                              bookTitle: title,
                                              storyText: storyText,
                                              initialProgress: 0.0,
                                              quizQuestions: quizQuestions,
                                            ),
                                          ),
                                        );
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: primaryBlue,
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                      ),
                                      icon: const Iconify(
                                        PhIcons.bookRegular,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                      label: Text(
                                        'Start again',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  // Resume Button
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: () {
                                        Feedback.forTap(context);
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => PracticeReaderPage(
                                              bookTitle: title,
                                              storyText: storyText,
                                              initialProgress: progress,
                                              quizQuestions: quizQuestions,
                                            ),
                                          ),
                                        );
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: yellowColor,
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                      ),
                                      icon: const Iconify(
                                        PhIcons.bookOpenRegular,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                      label: Text(
                                        'Resume',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                  ),
                                ] else ...[
                                  // Read Button
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: () {
                                        Feedback.forTap(context);
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => PracticeReaderPage(
                                              bookTitle: title,
                                              storyText: storyText,
                                              initialProgress: 0.0,
                                              quizQuestions: quizQuestions,
                                            ),
                                          ),
                                        );
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: primaryBlue,
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                      ),
                                      icon: const Iconify(
                                        PhIcons.bookRegular,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                      label: Text(
                                        'Read',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                                const SizedBox(width: 12),
                                // Bookmark Button
                                Container(
                                  height: 50,
                                  width: 50,
                                  decoration: BoxDecoration(
                                    color: _isBookmarked ? const Color(0xFFFBBF24) : Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: _isBookmarked ? const Color(0xFFFBBF24) : const Color(0xFFE2E8F0),
                                      width: 1.5,
                                    ),
                                  ),
                                  child: IconButton(
                                    onPressed: () {
                                      Feedback.forTap(context);
                                      setState(() {
                                        _isBookmarked = !_isBookmarked;
                                      });
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(_isBookmarked ? 'Added to Bookmarks' : 'Removed from Bookmarks'),
                                          duration: const Duration(seconds: 1),
                                        ),
                                      );
                                    },
                                    icon: Iconify(
                                      PhIcons.bookmarksRegular,
                                      color: _isBookmarked ? Colors.white : const Color(0xFF475569),
                                      size: 24,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),

                            // Description Text
                            Text(
                              desc,
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                color: const Color(0xFF8E8E93),
                                height: 1.5,
                              ),
                            ),
                            const SizedBox(height: 12),

                            // Writer credit
                            Align(
                              alignment: Alignment.centerLeft,
                              child: Text(
                                'by $author',
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black,
                                ),
                              ),
                            ),
                            const SizedBox(height: 32),

                            // More Like This Header
                            Row(
                              children: [
                                const Iconify(
                                  PhIcons.booksRegular,
                                  color: primaryBlue,
                                  size: 24,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'More Like This',
                                  style: GoogleFonts.inter(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.black,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Grid of recommended books
                            GridView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              clipBehavior: Clip.none,
                              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: isTablet ? 5 : 3,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 16,
                                childAspectRatio: 0.58,
                              ),
                              itemCount: moreLikeThisBooks.length,
                              itemBuilder: (context, index) {
                                final bookItem = moreLikeThisBooks[index];
                                return _buildRecommendationCard(bookItem);
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildRecommendationCard(Map<String, dynamic> book) {
    final double progress = (book['progress'] as num).toDouble();

    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => StoryPreviewPage(bookTitle: book['title']!),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 3 / 4,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.asset(
                  book['cover']!,
                  fit: BoxFit.cover,
                  alignment: Alignment.topCenter,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    book['title']!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
                      height: 1.2,
                    ),
                  ),
                  if (progress > 0)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 2.0),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: LinearProgressIndicator(
                          value: progress,
                          backgroundColor: const Color(0xFFE4E2DC),
                          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1B64D8)),
                          minHeight: 5,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
