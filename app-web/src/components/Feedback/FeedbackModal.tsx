import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import './FeedbackModal.css';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any; // Using any for now, but ideally strict User type
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, user }) => {
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            alert("Please select a star rating");
            return;
        }

        setIsSubmitting(true);
        try {
            // Mock submission
            const feedbackData = {
                userId: user?.id || user?._id || 'unknown',
                name: user?.name,
                email: user?.email,
                rating,
                comment,
                timestamp: new Date().toISOString()
            };

            console.log("Submitting Feedback:", feedbackData);

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));

            setRating(0);
            setComment('');
            onClose();
            alert("Thank you for your feedback!");

        } catch (error) {
            console.error("Failed to submit feedback", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="feedback-modal-overlay" onClick={onClose}>
            <div className="feedback-modal-content" onClick={e => e.stopPropagation()}>
                <div className="feedback-header">
                    <div className="feedback-title-container">
                        <span style={{ fontSize: '1.5rem' }}>👋</span>
                        <h2>Give Feedback</h2>
                    </div>
                    <button className="close-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="feedback-body">
                    {user && (
                        <div className="user-info-banner">
                            Posting as: <strong>{user.name || user.displayName || 'User'}</strong>
                            <span className="user-email">({user.email})</span>
                        </div>
                    )}

                    <div className="rating-section">
                        <label>How would you rate your experience?</label>
                        <div className="stars-container">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={28}
                                    className={`star-icon ${star <= (hoverRating || rating) ? 'active' : ''}`}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    fill={star <= (hoverRating || rating) ? "#fbbf24" : "none"}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="comment-section">
                        <label>Tell us more (optional)</label>
                        <textarea
                            className="feedback-textarea"
                            placeholder="What do you like? What can we improve?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="feedback-footer">
                    <button className="cancel-button" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button className="submit-button" onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
                        <span style={{ marginRight: '8px', fontSize: '1.1em' }}>🚀</span>
                        {isSubmitting ? 'Sending...' : 'Send Feedback'}
                    </button>
                </div>
            </div>
        </div>
    );
};
