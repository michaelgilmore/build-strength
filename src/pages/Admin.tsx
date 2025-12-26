import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2, Pencil, Save, X, Shield } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface WorkoutLog {
  id: string;
  user_id: string;
  exercise_id: string | null;
  exercise_name: string;
  set_number: number;
  weight_used: number;
  reps: number;
  workout_type: string;
  difficulty_feedback: string | null;
  completed_at: string;
}

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WorkoutLog>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAndFetchLogs = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is admin using the has_role function
      const { data: hasRole, error: roleError } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (roleError || !hasRole) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Fetch all workout logs (admin can see all via service role in RLS)
      // We need to fetch as admin - create a policy for this
      const { data: logsData, error: logsError } = await supabase
        .from('workout_logs')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(100);

      if (logsError) {
        console.error('Error fetching logs:', logsError);
        toast({ title: 'Error', description: 'Failed to fetch workout logs', variant: 'destructive' });
      } else {
        setLogs(logsData || []);
      }

      setLoading(false);
    };

    checkAdminAndFetchLogs();
  }, [user, navigate, toast]);

  const startEdit = (log: WorkoutLog) => {
    setEditingId(log.id);
    setEditForm({
      exercise_name: log.exercise_name,
      set_number: log.set_number,
      weight_used: log.weight_used,
      reps: log.reps,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from('workout_logs')
      .update({
        exercise_name: editForm.exercise_name,
        set_number: editForm.set_number,
        weight_used: editForm.weight_used,
        reps: editForm.reps,
      })
      .eq('id', editingId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update log', variant: 'destructive' });
      return;
    }

    setLogs(logs.map(log => 
      log.id === editingId 
        ? { ...log, ...editForm } as WorkoutLog
        : log
    ));
    setEditingId(null);
    setEditForm({});
    toast({ title: 'Updated', description: 'Workout log updated successfully' });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete log', variant: 'destructive' });
      return;
    }

    setLogs(logs.filter(log => log.id !== deleteId));
    setDeleteId(null);
    toast({ title: 'Deleted', description: 'Workout log deleted successfully' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pb-20">
        <Header />
        <main className="px-4 py-12 max-w-2xl mx-auto text-center">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-display text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You do not have permission to access this page.
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header />
      <main className="px-4 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-display text-foreground">Admin Panel</h1>
        </div>

        <div className="card-intense p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Workout Logs</h2>
          <p className="text-sm text-muted-foreground">
            Showing {logs.length} most recent workout entries
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Exercise</TableHead>
                <TableHead>Set</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {formatDate(log.completed_at)}
                  </TableCell>
                  <TableCell>
                    {editingId === log.id ? (
                      <Input
                        value={editForm.exercise_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, exercise_name: e.target.value })}
                        className="w-32"
                      />
                    ) : (
                      log.exercise_name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === log.id ? (
                      <Input
                        type="number"
                        value={editForm.set_number || ''}
                        onChange={(e) => setEditForm({ ...editForm, set_number: parseInt(e.target.value) })}
                        className="w-16"
                      />
                    ) : (
                      log.set_number
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === log.id ? (
                      <Input
                        type="number"
                        value={editForm.weight_used || ''}
                        onChange={(e) => setEditForm({ ...editForm, weight_used: parseFloat(e.target.value) })}
                        className="w-20"
                      />
                    ) : (
                      `${log.weight_used} lbs`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === log.id ? (
                      <Input
                        type="number"
                        value={editForm.reps || ''}
                        onChange={(e) => setEditForm({ ...editForm, reps: parseInt(e.target.value) })}
                        className="w-16"
                      />
                    ) : (
                      log.reps
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === log.id ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="fire" onClick={saveEdit}>
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(log)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(log.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No workout logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout Log</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workout log? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}
