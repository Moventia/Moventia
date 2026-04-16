import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:8080/api';

export function ReviewComments({ reviewId, currentUser, isLoggedIn }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`${API_URL}/reviews/${reviewId}/comments`);
        if (res.ok) {
          setComments(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch comments', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [reviewId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || posting) return;

    setPosting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/reviews/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  return (
    <div className="mt-4 pl-4 border-l-2 border-primary/20 space-y-4">
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading comments...</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="group flex gap-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={comment.userAvatar} alt={comment.username} />
                <AvatarFallback className="text-[10px]">{comment.username[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">{comment.username}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  {currentUser && currentUser.id === comment.userId && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}

          {comments.length === 0 && !isLoggedIn && (
            <p className="text-xs text-muted-foreground italic">No comments yet.</p>
          )}
        </div>
      )}

      {isLoggedIn ? (
        <form onSubmit={handlePostComment} className="flex gap-2 mt-4">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.username} />
            <AvatarFallback className="text-[10px]">{currentUser?.username?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex flex-col gap-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-background border-foreground/10 focus-visible:ring-primary/50 min-h-[80px]"
              maxLength={500}
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!newComment.trim() || posting} 
                className="font-bold px-6 py-2 h-auto"
              >
                {posting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground pt-2">
          Please <span className="text-primary cursor-pointer hover:underline">log in</span> to comment.
        </p>
      )}
    </div>
  );
}
