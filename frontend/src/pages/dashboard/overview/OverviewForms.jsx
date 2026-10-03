import FormCard from '../../../components/dashboard/records/FormCard.jsx';
import { forms } from '../../../data/forms.js';

export default function OverviewForms() {
  const gstForms = forms.filter((f) => f.id === 'filipino-gst' || f.id === 'english-gst');
  const ortForms = forms.filter((f) => f.id === 'filipino-ort' || f.id === 'english-ort');
  const profileForms = forms.filter((f) => f.id === 'individual-reading-profile');

  const stages = [
    {
      title: 'INITIAL SCREENING USING THE PHIL-IRI GST',
      items: gstForms,
    },
    {
      title: 'PHIL-IRI GRADED PASSAGES',
      items: ortForms,
    },
    {
      title: 'INDIVIDUAL SUMMARY RECORD',
      items: profileForms,
    },
  ];

  return (
    <div className="space-y-5">
      {stages.map((stage) => (
        <div key={stage.title} className="space-y-2">
          <div className="border-b border-ink/5 pb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink/80">
              {stage.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {stage.items.map((form) => {
              const isFullWidth = form.id === 'individual-reading-profile';
              return (
                <FormCard
                  key={form.id}
                  form={form}
                  className={isFullWidth ? 'md:col-span-2' : ''}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
