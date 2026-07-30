export default function BadgeCard({ badge }) {
  if (badge.placeholder) {
    return <div className="aspect-[400/500] w-full rounded-2xl bg-ink/10" />;
  }

  return (
    <img
      src={badge.image}
      alt={badge.name}
      className="aspect-[400/500] w-full rounded-2xl object-cover drop-shadow-[0px_5px_5px_rgba(26,24,22,0.15)]"
    />
  );
}
