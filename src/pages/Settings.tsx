import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Lock, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { unit, setUnit } = useWeightUnit();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsUpdating(false);

    if (error) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="Settings" />

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="card-intense p-4">
            <div className="flex items-center gap-3 mb-4">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg text-foreground">Preferences</h2>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label htmlFor="weight-unit" className="text-base">Weight Unit</Label>
                <p className="text-sm text-muted-foreground">
                  {unit === 'kg' ? 'Using kilograms (kg)' : 'Using pounds (lbs)'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={unit === 'kg' ? 'text-primary font-medium' : 'text-muted-foreground'}>kg</span>
                <Switch
                  id="weight-unit"
                  checked={unit === 'lbs'}
                  onCheckedChange={(checked) => setUnit(checked ? 'lbs' : 'kg')}
                />
                <span className={unit === 'lbs' ? 'text-primary font-medium' : 'text-muted-foreground'}>lbs</span>
              </div>
            </div>
          </div>

          {user && (
            <div className="card-intense p-4">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg text-foreground">Change Password</h2>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isUpdating || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {isUpdating ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </div>
          )}
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
