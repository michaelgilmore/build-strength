import { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, subDays } from 'date-fns';

interface WorkoutJournalProps {
  date?: Date;
  showButton?: boolean;
  showNavigator?: boolean;
}

export default function WorkoutJournal({ date: initialDate, showButton = false, showNavigator = false }: WorkoutJournalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  
  const { user } = useAuth();
  const { toast } = useToast();

  const dateString = format(currentDate, 'yyyy-MM-dd');

  const fetchEntry = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('workout_journal')
      .select('content')
      .eq('user_id', user.id)
      .eq('entry_date', dateString)
      .maybeSingle();

    if (!error && data) {
      setContent(data.content);
    } else {
      setContent('');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen || showNavigator) {
      fetchEntry();
    }
  }, [user, dateString, isOpen, showNavigator]);

  const saveEntry = async () => {
    if (!user) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from('workout_journal')
      .upsert({
        user_id: user.id,
        entry_date: dateString,
        content: content.trim(),
      }, {
        onConflict: 'user_id,entry_date'
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save journal entry',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Saved',
        description: 'Journal entry saved'
      });
      if (showButton) {
        setIsOpen(false);
      }
    }
    setSaving(false);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
  };

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Button mode for Workout page
  if (showButton) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <BookOpen className="w-4 h-4 mr-1" />
          Journal
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Workout Journal - {format(currentDate, 'MMM d, yyyy')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <Textarea
                placeholder="How was your workout today? Note any PRs, how you felt, what you want to improve..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] resize-none"
                disabled={loading}
              />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveEntry} disabled={saving || loading}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Navigator mode for Analytics page
  if (showNavigator) {
    return (
      <div className="card-intense p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="font-display text-foreground">Workout Journal</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDay('prev')}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm font-medium min-w-[100px] text-center">
              {isToday ? 'Today' : format(currentDate, 'MMM d, yyyy')}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDay('next')}
              disabled={isToday}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-muted-foreground text-sm py-4 text-center">Loading...</div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="No journal entry for this day. Add your notes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            
            <div className="flex justify-end">
              <Button size="sm" onClick={saveEntry} disabled={saving}>
                {saving ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
