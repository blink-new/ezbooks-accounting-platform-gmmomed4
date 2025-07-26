import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MessageSquare, Send, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
})

export function FeedbackForm() {
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) return

    setIsSubmitting(true)
    try {
      // Save feedback to database
      await blink.db.feedback.create({
        user_id: user?.id || 'anonymous',
        user_email: user?.email || 'anonymous',
        feedback_text: feedback.trim(),
        feedback_type: 'improvement_suggestion',
        created_at: new Date().toISOString(),
        status: 'new'
      })

      toast.success('Thank you for your feedback! 🙏', {
        description: 'We really appreciate your input and will use it to make Buck AI even better!'
      })
      
      setFeedback('')
      setIsOpen(false)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Oops! Something went wrong', {
        description: 'Please try again or email us directly at feedback@buckAI.com'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white border-none transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          What Can We Do Better?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Help Us Improve Buck AI
          </DialogTitle>
          <DialogDescription>
            Your feedback is incredibly valuable! Tell us what you wish Buck AI did better, and we'll work on making it happen.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="I wish Buck AI could... 
            
Examples:
• Respond faster to my questions
• Better understand my industry
• Integrate with my existing tools
• Provide more detailed reports
• Handle multiple currencies
• Anything else you'd love to see!"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={isSubmitting}
          />
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {feedback.length}/500 characters
            </p>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!feedback.trim() || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Feedback
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
        
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          💡 We read every single piece of feedback and use it to prioritize new features!
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function FeedbackButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <FeedbackForm />
    </div>
  )
}