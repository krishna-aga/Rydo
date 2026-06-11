import { useState } from 'react';
import { useSocketStore } from '../store/useSocketStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { Button } from '@rydo/ui';

export default function RatingModal() {
  const { token } = useAuthStore();
  const { ratingRideId, closeRatingModal } = useSocketStore();
  const [stars, setStars] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !ratingRideId) return;

    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rideId: ratingRideId,
          stars,
          feedback
        })
      });
      const data = await res.json();
      if (data.success) {
        closeRatingModal();
      } else {
        alert(data.error || 'Failed to submit rating');
      }
    } catch (err) {
      alert('Failed to connect to backend server');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ratingRideId) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-scaleUp">
        <div className="text-center">
          <span className="text-4xl">🎉</span>
          <h3 className="text-lg font-bold text-slate-200 mt-2">Ride Completed!</h3>
          <p className="text-xs text-slate-400 mt-1">Please rate your ride with your campus driver.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setStars(star)}
                className="text-2xl transition-transform active:scale-90 focus:outline-none"
              >
                <span className={star <= stars ? 'text-amber-400' : 'text-slate-700 hover:text-slate-600'}>
                  ★
                </span>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Feedback (Optional)</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about the driver or vehicle..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={closeRatingModal}
              className="py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 font-semibold text-xs transition-colors"
            >
              Skip
            </button>
            <Button type="submit" disabled={submitting} className="py-2.5 text-xs font-semibold">
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
