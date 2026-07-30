import { useRef, useState } from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';

export default function EditAvatar() {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
      <p className="text-sm text-ink/50">
        Aww. You are only allowed to change your avatar. Ask your admin to change other informations.
      </p>

      {previewUrl ? (
        <img src={previewUrl} alt="New avatar preview" className="size-[240px] rounded-full object-cover" />
      ) : (
        <Avatar name="Ted Mosby" size={240} className="text-7xl" />
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="text-sm font-medium text-brand-blue underline"
      >
        Upload new profile
      </button>

      <div className="flex w-full justify-end">
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-amber-500"
        >
          <ArrowsClockwise size={18} />
          Save changes
        </button>
      </div>
    </div>
  );
}
