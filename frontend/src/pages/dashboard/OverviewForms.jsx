import FormCard from '../../components/dashboard/FormCard.jsx';
import { forms } from '../../data/forms.js';

export default function OverviewForms() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {forms.map((form) => (
        <FormCard key={form.id} form={form} />
      ))}
    </div>
  );
}
