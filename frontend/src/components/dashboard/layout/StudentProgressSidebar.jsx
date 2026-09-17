import ClassCard from '../class/ClassCard.jsx';
import ClassProgressPanel from '../progress/ClassProgressPanel.jsx';

export default function StudentProgressSidebar() {
  return (
    <aside className="flex w-full flex-col gap-4 lg:max-w-[400px] lg:shrink-0">
      <ClassCard />
      <ClassProgressPanel />
    </aside>
  );
}
