import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, MessageCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@blinkdotnew/sdk';

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
});

export const SmartFeedbackSystem: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Smart feedback timing - show after user has been active
    const checkForFeedbackTrigger = () => {
      const lastFeedbackTime = localStorage.getItem('lastFeedbackTime');
      const sessionStartTime = localStorage.getItem('sessionStartTime') || Date.now().toString();
      const currentTime = Date.now();
      
      // Show feedback if:
      // 1. User hasn't given feedback in the last 7 days
      // 2. User has been active for at least 5 minutes in this session
      // 3. Random chance (20%) to avoid being annoying
      
      const daysSinceLastFeedback = lastFeedbackTime 
        ? (currentTime - parseInt(lastFeedbackTime)) / (1000 * 60 * 60 * 24)
        : 999;
      
      const minutesInSession = (currentTime - parseInt(sessionStartTime)) / (1000 * 60);
      const shouldShow = daysSinceLastFeedback > 7 && 
                        minutesInSession > 5 && 
                        Math.random() < 0.2;

      if (shouldShow) {
        setIsOpen(true);
        localStorage.setItem('lastFeedbackTime', currentTime.toString());
      }
    };

    // Set session start time
    if (!localStorage.getItem('sessionStartTime')) {
      localStorage.setItem('sessionStartTime', Date.now().toString());
    }

    // Check for feedback trigger after 5 minutes
    const timer = setTimeout(checkForFeedbackTrigger, 5 * 60 * 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (!feedback.trim() && rating === 0) {
      toast.error('Please provide either a rating or feedback');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await blink.auth.me();
      
      await blink.db.feedback.create({
        user_id: user.id,
        user_email: user.email,
        feedback: feedback.trim(),
        rating: rating,
        type: 'smart_popup',
        created_at: new Date().toISOString()
      });

      toast.success('Thank you for your feedback! 🙏 We truly appreciate it and will use it to make Buck AI even better!');
      setIsOpen(false);
      setFeedback('');
      setRating(0);
      
      // Don't show again for 7 days
      localStorage.setItem('lastFeedbackTime', Date.now().toString());
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Mark as shown so we don't show again too soon
    localStorage.setItem('lastFeedbackTime', Date.now().toString());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#1877F2]" />
              <DialogTitle className="text-lg font-semibold">
                How's your Buck AI experience?
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We'd love to hear how Buck AI is helping your business! Your feedback helps us improve.
          </p>

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rate your experience:</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              What can we do better? (Optional)
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Buck could respond faster, understand my industry better, have better voice recognition..."
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {feedback.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (feedback.trim() === '' && rating === 0)}
              className="flex-1 bg-[#1877F2] hover:bg-[#166FE5] text-white"
            >
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};