import React from 'react';
import StoryBookCover from '../../stories/StoryBookCover.jsx';

export default function StoryRow({ story }) {
  return (
    <div className="flex flex-col items-center gap-2 group cursor-pointer transition-transform hover:-translate-y-1">
      <div className="w-[115px] sm:w-[125px] shrink-0">
        <StoryBookCover story={story} />
      </div>
      <p className="text-center text-xs font-bold text-ink/90 line-clamp-2 max-w-[130px] leading-tight">
        {story.title}
      </p>
    </div>
  );
}
