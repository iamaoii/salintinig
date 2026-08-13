import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowsClockwise } from '@phosphor-icons/react';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import { getToken, getUser } from '../../../lib/auth.js';
import ToastNotification from '../../../components/common/ToastNotification.jsx';

export default function EditAvatar() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const currentUser = getUser();

  const [previewUrl, setPreviewUrl] = useState(() => currentUser?.profileImage || currentUser?.profile_image || null);
  const [base64Image, setBase64Image] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setToastMessage({ text: 'Please select a valid image file.', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
        setBase64Image(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!base64Image) {
      setToastMessage({ text: 'Please select a new profile image first.', type: 'error' });
      return;
    }

    try {
      setIsSaving(true);
      localStorage.setItem('teacherAvatarCache', base64Image);
      window.dispatchEvent(new CustomEvent('userAvatarChanged', { detail: base64Image }));
      const token = getToken();
      if (token) {
        const res = await fetch('http://localhost:5000/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profileImage: base64Image }),
        });
        const data = await res.json();
        if (data.success && data.user?.profileImage) {
          const finalImg = data.user.profileImage;
          setPreviewUrl(finalImg);
          localStorage.setItem('teacherAvatarCache', finalImg);
          window.dispatchEvent(new CustomEvent('userAvatarChanged', { detail: finalImg }));
          if (currentUser) {
            localStorage.setItem(
              'salintinig_user',
              JSON.stringify({
                ...currentUser,
                profileImage: finalImg,
                profile_image: finalImg,
              })
            );
          }
        }
      }
      setToastMessage({ text: 'Profile picture saved successfully!', type: 'success' });
      setTimeout(() => navigate('/teacher/account'), 1500);
    } catch (err) {
      console.error('Save avatar error:', err);
      setToastMessage({ text: 'Failed to save avatar to database.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <p className="text-sm text-ink/50">
          Upload a new profile picture. Changes will be saved to your teacher account in the database.
        </p>

        {previewUrl ? (
          <img src={previewUrl} alt="New avatar preview" className="size-[240px] rounded-full object-cover shadow-lg border-4 border-white" />
        ) : (
          <Avatar name={currentUser?.name || 'Teacher'} size={240} className="text-7xl shadow-lg border-4 border-white" />
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm font-medium text-brand-blue underline cursor-pointer"
        >
          Upload new profile
        </button>

        <div className="flex w-full justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !base64Image}
            className="flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-amber-500 cursor-pointer disabled:opacity-50"
          >
            <ArrowsClockwise size={18} className={isSaving ? 'animate-spin' : ''} />
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </>
  );
}
